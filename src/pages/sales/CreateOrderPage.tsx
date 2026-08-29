import {useEffect,useMemo,useState} from 'react'
import {ArrowLeft,Check,Minus,Plus,Search,ShoppingBag,Trash2,UserPlus,UserRound} from 'lucide-react'
import {Link,useNavigate} from 'react-router'
import {PageHeader} from '../../components/ui/PageHeader'
import {Field,Input,Select,Textarea} from '../../components/forms/FormField'
import {SearchableSelect,type SearchableOption} from '../../components/ui/SearchableSelect'
import {useProductsQuery,useVariantsQuery} from '../../services/catalogApi'
import {useCustomersQuery} from '../../services/customerApi'
import {useDistrictsQuery,useThanasQuery} from '../../services/deliveryApi'
import {useShippingMethodsQuery} from '../../services/shippingApi'
import {useCreateAdminOrderMutation,useValidateAdminCouponMutation} from '../../services/orderApi'
import {useAvailablePaymentMethodsQuery} from '../../services/paymentGatewayApi'
import {useDebouncedValue} from '../../hooks/useDebouncedValue'
import {money} from '../../utils/format'
import {apiError,rowsOf} from '../../utils/data'
import {mediaUrl} from '../../utils/media'
import {useAppDispatch} from '../../store/hooks'
import {toast} from '../../features/ui/uiSlice'
import type {Product,ProductVariant} from '../../types'

type CustomerMode='existing'|'new'
type SavedAddress={district?:string;thana?:string;address?:string;label?:string;name?:string;phone?:string}
type DraftItem={
  productId:number
  productName:string
  productType:'simple'|'variable'
  productBasePrice:string
  basePrice:string
  sku?:string
  image?:string
  variantId?:number
  variantLabel?:string
  availableStock?:number
  quantity:number
  stockError?:string
}

const norm=(value?:string|null)=>String(value||'').trim().toLocaleLowerCase()

function VariantPicker({item,onChange}:{item:DraftItem;onChange:(patch:Partial<DraftItem>)=>void}){
  const q=useVariantsQuery({product:item.productId,is_active:true,page_size:100})
  const variants=rowsOf<ProductVariant>(q.data)
  const options:SearchableOption[]=variants.map(v=>{
    const stock=Number(v.available_stock||0)
    const attrs=(v.attributes||[]).map(a=>`${a.attribute}: ${a.value}`).join(' · ')
    return {value:String(v.id),label:attrs||v.sku,description:`${v.sku} · ${money(v.price_override||item.productBasePrice)} · ${stock} in stock`,disabled:stock<=0}
  })
  return <SearchableSelect
    value={item.variantId?String(item.variantId):''}
    options={options}
    placeholder={q.isLoading?'Loading variants…':'Select variant'}
    searchPlaceholder="Search variant, shade, size or SKU…"
    emptyText="No sellable variants found."
    required
    onChange={value=>{
      const variant=variants.find(v=>String(v.id)===value)
      if(!variant)return onChange({variantId:undefined,variantLabel:undefined,availableStock:undefined,stockError:undefined})
      const stock=Number(variant.available_stock||0)
      const label=(variant.attributes||[]).map(a=>`${a.attribute}: ${a.value}`).join(' · ')||variant.sku
      onChange({
        variantId:variant.id,
        variantLabel:label,
        sku:variant.sku,
        basePrice:variant.price_override||item.productBasePrice,
        availableStock:stock,
        stockError:item.quantity>stock?`Only ${stock} unit(s) are available for this variant.`:undefined,
      })
    }}
  />
}

function CustomerSuggestions({search,onPick}:{search:string;onPick:(customer:any)=>void}){
  const debounced=useDebouncedValue(search,250)
  const q=useCustomersQuery({search:debounced||undefined,page_size:8},{skip:debounced.trim().length<2})
  const rows=rowsOf<any>(q.data)
  if(debounced.trim().length<2)return null
  return <div className="mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
    {q.isLoading?<div className="p-3 text-sm text-zinc-400">Searching customers…</div>:rows.length?rows.map(c=><button type="button" key={c.id} className="flex w-full items-center gap-3 border-b border-zinc-100 px-3 py-2.5 text-left last:border-0 hover:bg-zinc-50" onClick={()=>onPick(c)}>
      <span className="grid h-8 w-8 place-items-center rounded-full bg-pink-50 text-pink-700"><UserRound size={15}/></span>
      <span className="min-w-0 flex-1"><b className="block truncate text-sm">{c.full_name||'Unnamed customer'}</b><span className="block truncate text-xs text-zinc-400">{c.phone||c.email||'No contact'}</span>{c.checkout_address&&<span className="mt-0.5 block truncate text-xs text-zinc-400">{c.checkout_address.thana}, {c.checkout_address.district}</span>}</span>
    </button>):<div className="p-3 text-sm text-zinc-400">No matching customer. Switch to <b>New customer</b> to place an order for a new phone number.</div>}
  </div>
}

export default function CreateOrderPage(){
  const nav=useNavigate(),dispatch=useAppDispatch()
  const [createOrder,{isLoading}]=useCreateAdminOrderMutation()
  const [validateCoupon,{isLoading:validatingCoupon}]=useValidateAdminCouponMutation()
  const [couponPreview,setCouponPreview]=useState<any|null>(null)
  const [customerMode,setCustomerMode]=useState<CustomerMode>('existing')
  const [selectedCustomer,setSelectedCustomer]=useState<any|null>(null)
  const [customerSearch,setCustomerSearch]=useState('')
  const [pendingAddress,setPendingAddress]=useState<SavedAddress|null>(null)
  const [pendingThana,setPendingThana]=useState('')
  const [productSearch,setProductSearch]=useState('')
  const debouncedProduct=useDebouncedValue(productSearch,250)
  const productsQ=useProductsQuery({search:debouncedProduct||undefined,status:'active',page_size:12,ordering:'name'})
  const districtsQ=useDistrictsQuery({active:true})
  const [district,setDistrict]=useState('')
  const thanasQ=useThanasQuery({active:true,city:district||undefined},{skip:!district})
  const shippingQ=useShippingMethodsQuery()
  const [form,setForm]=useState({name:'',phone:'',thana:'',address:'',label:'',shipping_method:'',payment_method:'cod',coupon_code:'',order_note:''})
  const paymentMethodsQ=useAvailablePaymentMethodsQuery()
  const paymentMethods=paymentMethodsQ.data||[{code:'cod',display_name:'Cash on Delivery',provider:'cod',environment:'offline',sort_order:0}]
  const [items,setItems]=useState<DraftItem[]>([])

  useEffect(()=>{setCouponPreview(null)},[form.coupon_code,form.phone,items])

  const products=rowsOf<Product>(productsQ.data)
  const districts=rowsOf<any>(districtsQ.data)
  const thanas=rowsOf<any>(thanasQ.data)
  const shipping=rowsOf<any>(shippingQ.data)
  const districtOptions=useMemo<SearchableOption[]>(()=>districts.map(d=>({value:String(d.id),label:d.name,description:d.delivery_module?.name?`${d.delivery_module.name} · ${money(d.delivery_module.charge)}`:undefined})),[districts])
  const thanaOptions=useMemo<SearchableOption[]>(()=>thanas.map(t=>({value:String(t.id),label:t.name,description:t.delivery_module?.name?`${t.delivery_module.name} · ${money(t.delivery_module.charge)}`:undefined})),[thanas])

  useEffect(()=>{
    if(!pendingAddress||!districts.length)return
    const match=districts.find(d=>norm(d.name)===norm(pendingAddress.district))
    if(match){
      setDistrict(String(match.id))
      setForm(f=>({...f,thana:'',address:pendingAddress.address||'',label:pendingAddress.label||''}))
      setPendingThana(pendingAddress.thana||'')
      setPendingAddress(null)
    }else{
      setForm(f=>({...f,address:pendingAddress.address||'',label:pendingAddress.label||''}))
      setPendingAddress(null)
      dispatch(toast({type:'info',message:`Saved district “${pendingAddress.district||''}” is not in the current delivery list. Please select it manually.`}))
    }
  },[pendingAddress,districts,dispatch])

  useEffect(()=>{
    if(!pendingThana||!thanas.length)return
    const match=thanas.find(t=>norm(t.name)===norm(pendingThana))
    if(match)setForm(f=>({...f,thana:String(match.id)}))
    else dispatch(toast({type:'info',message:`Saved thana “${pendingThana}” is not available under this district. Please select it manually.`}))
    setPendingThana('')
  },[pendingThana,thanas,dispatch])

  const chooseCustomer=(customer:any)=>{
    setSelectedCustomer(customer)
    setCustomerSearch('')
    const address:SavedAddress|undefined=customer.checkout_address
    setForm(f=>({...f,name:customer.full_name||address?.name||'',phone:customer.phone||address?.phone||'',thana:'',address:address?.address||'',label:address?.label||''}))
    setDistrict('')
    if(address)setPendingAddress(address)
    else dispatch(toast({type:'info',message:'This customer has no saved delivery address. Select District/Thana and enter the address for this order.'}))
  }

  const changeCustomerMode=(mode:CustomerMode)=>{
    setCustomerMode(mode);setSelectedCustomer(null);setCustomerSearch('');setPendingAddress(null);setPendingThana('');setDistrict('')
    setForm(f=>({...f,name:'',phone:'',thana:'',address:'',label:''}))
  }

  const addProduct=(p:Product)=>{
    if(items.some(x=>x.productId===p.id))return dispatch(toast({type:'info',message:'Product is already in this order. Increase its quantity or change its variant instead.'}))
    const stock=Number(p.available_stock||0)
    if(stock<=0)return dispatch(toast({type:'error',message:`${p.name} is out of stock.`}))
    setItems(v=>[...v,{productId:p.id,productName:p.name,productType:p.product_type,productBasePrice:p.base_price,basePrice:p.base_price,sku:p.sku,image:p.primary_image?.image,availableStock:p.product_type==='simple'?stock:undefined,quantity:1}])
    setProductSearch('')
  }
  const patchItem=(index:number,patch:Partial<DraftItem>)=>setItems(v=>v.map((x,i)=>i===index?{...x,...patch}:x))
  const removeItem=(index:number)=>setItems(v=>v.filter((_,i)=>i!==index))
  const changeQty=(index:number,next:number)=>{
    const item=items[index]; const quantity=Math.max(1,Math.floor(Number(next)||1)); const max=item.availableStock
    if(typeof max==='number'&&quantity>max){
      patchItem(index,{quantity,stockError:`Requested ${quantity}, but only ${max} unit(s) are available.`})
      dispatch(toast({type:'error',message:`${item.productName}: only ${max} unit(s) are available.`}))
      return
    }
    patchItem(index,{quantity,stockError:undefined})
  }
  const couponItemsReady=items.length>0&&items.every(i=>(i.productType==='simple'||!!i.variantId)&&!i.stockError&&typeof i.availableStock==='number'&&i.quantity<=i.availableStock)
  const couponApplied=!form.coupon_code.trim()||(couponPreview&&norm(couponPreview.code)===norm(form.coupon_code))
  const applyCoupon=async()=>{
    const code=form.coupon_code.trim()
    if(!code)return dispatch(toast({type:'error',message:'Enter a coupon code first.'}))
    if(!couponItemsReady)return dispatch(toast({type:'error',message:'Add valid in-stock order items and choose required variants before applying a coupon.'}))
    try{
      const result:any=await validateCoupon({
        code,
        phone:form.phone.trim(),
        items:items.map(i=>({product:i.productId,...(i.productType==='variable'?{product_variant:i.variantId}:{}),quantity:i.quantity})),
      }).unwrap()
      setCouponPreview(result)
      dispatch(toast({type:'success',message:result.free_shipping?`Coupon ${result.code} applied: free shipping.`:`Coupon ${result.code} applied. Discount ${money(result.coupon_discount)}.`}))
    }catch(e){setCouponPreview(null);dispatch(toast({type:'error',message:apiError(e)}))}
  }

  const estimatedSubtotal=useMemo(()=>items.reduce((sum,item)=>sum+Number(item.basePrice||0)*item.quantity,0),[items])
  const customerValid=customerMode==='new'?!!form.name.trim()&&!!form.phone.trim():!!selectedCustomer&&!!form.name.trim()&&!!form.phone.trim()
  const valid=customerValid&&!!district&&!!form.thana&&!!form.address.trim()&&!!form.payment_method&&items.length>0&&items.every(i=>(i.productType==='simple'||!!i.variantId)&&!i.stockError&&typeof i.availableStock==='number'&&i.quantity<=i.availableStock)&&!!couponApplied

  const submit=async()=>{
    if(form.coupon_code.trim()&&!couponApplied)return dispatch(toast({type:'error',message:'Apply the coupon after the latest item/customer changes before creating the order.'}))
    if(!valid)return dispatch(toast({type:'error',message:'Complete every required field and resolve stock/variant warnings before creating the order.'}))
    try{
      const result:any=await createOrder({
        name:form.name.trim(),phone:form.phone.trim(),district:Number(district),thana:Number(form.thana),address:form.address.trim(),label:form.label.trim(),
        shipping_method:form.shipping_method?Number(form.shipping_method):null,payment_method:form.payment_method,coupon_code:form.coupon_code.trim(),order_note:form.order_note.trim(),
        items:items.map(i=>({product:i.productId,...(i.productType==='variable'?{product_variant:i.variantId}:{}),quantity:i.quantity})),
      }).unwrap()
      const order=result?.order
      dispatch(toast({type:'success',message:`${order?.order_number||'Order'} created successfully.`}))
      nav(order?.order_number?`/sales/orders/${order.order_number}`:'/sales/orders')
    }catch(e){dispatch(toast({type:'error',message:apiError(e)}))}
  }

  return <>
    <PageHeader title="Create Order" description="Create an order for an existing or new customer using the same stock, delivery, promotion and payment rules as storefront checkout." actions={<Link className="btn-secondary" to="/sales/orders"><ArrowLeft size={16}/>Back to Orders</Link>}/>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <section className="panel p-5">
          <h2 className="font-semibold">Customer & delivery</h2>
          <p className="mb-4 mt-1 text-sm text-zinc-500">Choose an existing customer to reuse their saved delivery details, or switch to New customer.</p>
          <div className="mb-5 inline-flex rounded-xl bg-zinc-100 p-1">
            <button type="button" onClick={()=>changeCustomerMode('existing')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${customerMode==='existing'?'bg-white text-zinc-950 shadow-sm':'text-zinc-500'}`}><UserRound size={15}/>Existing customer</button>
            <button type="button" onClick={()=>changeCustomerMode('new')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${customerMode==='new'?'bg-white text-zinc-950 shadow-sm':'text-zinc-500'}`}><UserPlus size={15}/>New customer</button>
          </div>

          {customerMode==='existing'&&<div className="mb-4">
            <Field label="Find existing customer" required hint={selectedCustomer?'Customer selected. Saved delivery details were loaded where available.':'Search and select a customer before creating the order.'}>
              <div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"/><Input required className="pl-9" value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)} placeholder="Search by name, phone or email…"/></div>
            </Field>
            <CustomerSuggestions search={customerSearch} onPick={chooseCustomer}/>
            {selectedCustomer&&<div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm"><span className="grid h-8 w-8 place-items-center rounded-full bg-white text-emerald-700"><Check size={16}/></span><span><b>{selectedCustomer.full_name||'Customer'}</b><span className="ml-2 text-emerald-700">{selectedCustomer.phone}</span></span></div>}
          </div>}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Customer name" required><Input required readOnly={customerMode==='existing'&&!!selectedCustomer} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Customer name"/></Field>
            <Field label="Phone" required><Input required readOnly={customerMode==='existing'&&!!selectedCustomer} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="017XXXXXXXX"/></Field>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="District" required><SearchableSelect required value={district} options={districtOptions} onChange={value=>{setDistrict(value);setPendingThana('');setForm(f=>({...f,thana:''}))}} placeholder="Select district" searchPlaceholder="Search district…"/></Field>
            <Field label="Thana" required><SearchableSelect required disabled={!district} value={form.thana} options={thanaOptions} onChange={value=>setForm({...form,thana:value})} placeholder={district?'Select thana':'Select district first'} searchPlaceholder="Search thana…"/></Field>
          </div>
          <div className="mt-4"><Field label="Full address" required><Textarea required value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="House, road, area"/></Field></div>
        </section>

        <section className="panel p-5">
          <h2 className="font-semibold">Order items</h2><p className="mb-4 mt-1 text-sm text-zinc-500">Stock is shown before selection. Quantity above available stock is blocked before submit.</p>
          <Field label="Add product" required><div className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"/><Input className="pl-9" value={productSearch} onChange={e=>setProductSearch(e.target.value)} placeholder="Search product name or SKU…"/></div></Field>
          {productSearch.trim()&&<div className="mt-2 max-h-80 overflow-auto rounded-xl border border-zinc-200 bg-white">
            {productsQ.isLoading?<div className="p-3 text-sm text-zinc-400">Searching products…</div>:products.length?products.map(p=>{
              const stock=Number(p.available_stock||0),src=mediaUrl(p.primary_image?.image)
              return <div key={p.id} className="flex items-center justify-between gap-3 border-b border-zinc-100 px-3 py-3 last:border-0">
                <div className="flex min-w-0 items-center gap-3">{src?<img src={src} alt="" className="h-12 w-12 shrink-0 rounded-lg border border-zinc-100 object-cover"/>:<div className="h-12 w-12 shrink-0 rounded-lg bg-zinc-100"/>}<div className="min-w-0"><b className="block truncate text-sm">{p.name}</b><div className="text-xs text-zinc-400">{p.product_type==='variable'?'Variable product':p.sku||'Simple product'} · {money(p.base_price)}</div><div className={`mt-1 text-xs font-medium ${stock>0?'text-emerald-700':'text-red-600'}`}>{stock>0?`${stock} available`:'Out of stock'}</div></div></div>
                <button disabled={stock<=0} className="btn-secondary shrink-0 py-2" onClick={()=>addProduct(p)}><Plus size={15}/>Add</button>
              </div>
            }):<div className="p-3 text-sm text-zinc-400">No active products found.</div>}
          </div>}
          <div className="mt-4 space-y-3">
            {items.map((item,index)=>{
              const src=mediaUrl(item.image),variantRequired=item.productType==='variable'
              return <div key={item.productId} className={`grid gap-3 rounded-xl border p-4 lg:grid-cols-[minmax(0,1fr)_280px_170px_44px] lg:items-end ${item.stockError?'border-red-300 bg-red-50/30':'border-zinc-200'}`}>
                <div className="flex min-w-0 items-center gap-3">{src?<img src={src} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-zinc-100 object-cover"/>:<div className="h-14 w-14 shrink-0 rounded-lg bg-zinc-100"/>}<div className="min-w-0"><div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Product</div><b className="mt-1 block truncate text-sm">{item.productName}</b><span className="text-xs text-zinc-400">{item.sku||item.productType}</span>{typeof item.availableStock==='number'&&<div className={`mt-1 text-xs font-medium ${item.availableStock>0?'text-emerald-700':'text-red-600'}`}>{item.availableStock} available</div>}</div></div>
                <div>{variantRequired?<Field label="Variant" required><VariantPicker item={item} onChange={patch=>patchItem(index,patch)}/></Field>:<div><span className="label">Inventory target</span><div className="input bg-zinc-50 text-zinc-500">Simple product</div></div>}</div>
                <Field label="Quantity" required error={item.stockError}><div className="flex items-center rounded-xl border border-zinc-200 bg-white"><button type="button" className="p-3" onClick={()=>changeQty(index,item.quantity-1)}><Minus size={14}/></button><input className="w-full min-w-0 text-center text-sm outline-none" type="number" min={1} max={item.availableStock} required value={item.quantity} onChange={e=>changeQty(index,Number(e.target.value))}/><button type="button" className="p-3" disabled={typeof item.availableStock==='number'&&item.quantity>=item.availableStock} onClick={()=>changeQty(index,item.quantity+1)}><Plus size={14}/></button></div></Field>
                <button title="Remove item" className="grid h-11 w-11 place-items-center rounded-xl border border-red-100 text-red-600 hover:bg-red-50" onClick={()=>removeItem(index)}><Trash2 size={16}/></button>
              </div>
            })}
            {!items.length&&<div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-400">Search and add at least one product.</div>}
          </div>
        </section>
      </div>

      <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
        <section className="panel p-5"><h2 className="font-semibold">Order settings</h2>
          <div className="mt-4 space-y-4"><Field label="Payment method" required><Select required value={form.payment_method} onChange={e=>setForm({...form,payment_method:e.target.value})}>{paymentMethods.map(method=><option key={method.code} value={method.code}>{method.display_name}{method.environment==='sandbox'?' (Sandbox)':''}</option>)}</Select></Field>
          <Field label="Shipping method"><Select value={form.shipping_method} onChange={e=>setForm({...form,shipping_method:e.target.value})}><option value="">Area-based delivery only</option>{shipping.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
          <Field label="Coupon code">
            <div className="flex gap-2"><Input value={form.coupon_code} onChange={e=>setForm({...form,coupon_code:e.target.value.toUpperCase()})} placeholder="Optional"/><button type="button" className="btn-secondary shrink-0" disabled={validatingCoupon||!form.coupon_code.trim()||!couponItemsReady} onClick={applyCoupon}>{validatingCoupon?'Checking…':'Apply'}</button></div>
            {couponPreview&&<div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800"><div className="flex items-center justify-between gap-3"><b>{couponPreview.code} applied</b><span>{couponPreview.free_shipping?'Free shipping':`-${money(couponPreview.coupon_discount)}`}</span></div>{Number(couponPreview.promotion_discount||0)>0&&<div className="mt-1 flex justify-between text-emerald-700"><span>Automatic promotions</span><span>-{money(couponPreview.promotion_discount)}</span></div>}<div className="mt-1 flex justify-between border-t border-emerald-200 pt-1 font-semibold"><span>Total estimated discount</span><span>-{money(couponPreview.total_discount)}</span></div></div>}
          </Field>
          <Field label="Order note"><Textarea value={form.order_note} onChange={e=>setForm({...form,order_note:e.target.value})} placeholder="Optional order note"/></Field></div>
        </section>
        <section className="panel p-5"><div className="flex items-center gap-2"><ShoppingBag size={18}/><h2 className="font-semibold">Summary</h2></div><div className="mt-4 space-y-2 text-sm"><div className="flex justify-between"><span className="text-zinc-500">Line items</span><b>{items.length}</b></div><div className="flex justify-between"><span className="text-zinc-500">Estimated product subtotal</span><b>{money(estimatedSubtotal)}</b></div><div className="flex justify-between"><span className="text-zinc-500">Delivery</span><span className="text-right text-xs text-zinc-500">Calculated from District + Thana</span></div>{couponPreview?<><div className="flex justify-between"><span className="text-zinc-500">Coupon {couponPreview.code}</span><b className="text-emerald-700">{couponPreview.free_shipping?'Free shipping':`-${money(couponPreview.coupon_discount)}`}</b></div>{Number(couponPreview.promotion_discount||0)>0&&<div className="flex justify-between"><span className="text-zinc-500">Automatic promotions</span><span>-{money(couponPreview.promotion_discount)}</span></div>}<div className="flex justify-between"><span className="text-zinc-500">Estimated after discounts</span><b>{money(couponPreview.estimated_product_total)}</b></div></>:<div className="flex justify-between"><span className="text-zinc-500">Discounts</span><span className="text-right text-xs text-zinc-500">Apply a coupon to preview</span></div>}</div><button disabled={!valid||isLoading} className="btn-brand mt-5 w-full" onClick={submit}>{isLoading?'Creating order…':'Create Order'}</button><p className="mt-3 text-xs leading-5 text-zinc-400"><span className="text-red-600">*</span> Required fields. Stock is revalidated and reserved by the backend when the order is created.</p></section>
      </aside>
    </div>
  </>
}
