import {useMemo,useState} from 'react'
import {Plus,Trash2} from 'lucide-react'
import {useNavigate} from 'react-router'
import {PageHeader} from '../../components/ui/PageHeader'
import {Field,Input,Select} from '../../components/forms/FormField'
import {SearchableSelect} from '../../components/ui/SearchableSelect'
import {useSuppliersQuery,useCreatePurchaseMutation,useCreatePurchaseItemMutation} from '../../services/purchaseApi'
import {useWarehousesQuery} from '../../services/inventoryApi'
import {useProductsQuery,useVariantsQuery} from '../../services/catalogApi'
import {rowsOf,apiError} from '../../utils/data'
import {money} from '../../utils/format'
import {useAppDispatch} from '../../store/hooks'
import {toast} from '../../features/ui/uiSlice'

type Row={product:string;variant:string;quantity:string;unit_cost:string;discount:string;tax:string}
const blank=():Row=>({product:'',variant:'',quantity:'1',unit_cost:'0',discount:'0',tax:'0'})

export default function PurchaseCreatePage(){
  const nav=useNavigate()
  const dispatch=useAppDispatch()
  const ss=useSuppliersQuery()
  const ws=useWarehousesQuery()
  const ps=useProductsQuery({page_size:500})
  const vs=useVariantsQuery({page_size:1000})
  const [createPurchase,{isLoading}]=useCreatePurchaseMutation()
  const [createItem]=useCreatePurchaseItemMutation()
  const [head,setHead]=useState({supplier:'',warehouse:'',supplier_invoice:'',purchase_date:new Date().toISOString().slice(0,10),expected_date:'',note:''})
  const [items,setItems]=useState<Row[]>([blank()])

  const products=rowsOf<any>(ps.data)
  const variants=rowsOf<any>(vs.data)
  const productOptions=useMemo(()=>products.map(p=>({
    value:String(p.id),
    label:p.name,
    description:[p.sku||'No base SKU',p.product_type==='variable'?'Variable product':'Simple product'].join(' · '),
  })),[products])
  const totals=useMemo(()=>items.reduce((a,r)=>a+Number(r.quantity||0)*Number(r.unit_cost||0)-Number(r.discount||0)+Number(r.tax||0),0),[items])

  const patchRow=(index:number,patch:Partial<Row>)=>setItems(items.map((row,i)=>i===index?{...row,...patch}:row))

  const save=async()=>{
    try{
      if(!head.supplier||!head.warehouse)throw new Error('Supplier and warehouse are required.')
      if(items.some(r=>!r.product))throw new Error('Every purchase row needs a product.')
      for(const row of items){
        const product=products.find(x=>x.id===Number(row.product))
        if(product?.product_type==='variable'&&!row.variant)throw new Error(`${product.name} requires a variant.`)
        if(Number(row.quantity)<=0)throw new Error('Purchase quantity must be at least 1.')
      }
      const purchaseNumber=`PO-${new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14)}`
      const purchase=await createPurchase({
        purchase_number:purchaseNumber,
        supplier:Number(head.supplier),
        warehouse:Number(head.warehouse),
        supplier_invoice:head.supplier_invoice,
        purchase_date:head.purchase_date,
        expected_date:head.expected_date||null,
        subtotal:totals,
        discount:0,
        tax:items.reduce((a,r)=>a+Number(r.tax||0),0),
        total:totals,
      }).unwrap()
      for(const row of items){
        const product=products.find(x=>x.id===Number(row.product))
        if(!product)continue
        const line=Number(row.quantity)*Number(row.unit_cost)-Number(row.discount||0)+Number(row.tax||0)
        await createItem({
          purchase:purchase.id,
          product:product.product_type==='simple'?product.id:null,
          product_variant:product.product_type==='variable'?Number(row.variant):null,
          quantity:Number(row.quantity),
          unit_cost:row.unit_cost,
          discount:row.discount||0,
          tax:row.tax||0,
          total:line,
        }).unwrap()
      }
      dispatch(toast({type:'success',message:'Purchase draft created.'}))
      nav(`/procurement/purchases/${purchase.id}`)
    }catch(e){
      dispatch(toast({type:'error',message:e instanceof Error?e.message:apiError(e)}))
    }
  }

  return <>
    <PageHeader title="Create Purchase" description="Search products by name or SKU. Simple products are purchased directly; variable products require their real variant."/>
    <div className="panel p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Supplier"><Select value={head.supplier} onChange={e=>setHead({...head,supplier:e.target.value})}><option value="">Select supplier</option>{rowsOf<any>(ss.data).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</Select></Field>
        <Field label="Warehouse"><Select value={head.warehouse} onChange={e=>setHead({...head,warehouse:e.target.value})}><option value="">Select warehouse</option>{rowsOf<any>(ws.data).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</Select></Field>
        <Field label="Supplier Invoice"><Input value={head.supplier_invoice} onChange={e=>setHead({...head,supplier_invoice:e.target.value})}/></Field>
        <Field label="Purchase Date"><Input type="date" value={head.purchase_date} onChange={e=>setHead({...head,purchase_date:e.target.value})}/></Field>
        <Field label="Expected Date"><Input type="date" value={head.expected_date} onChange={e=>setHead({...head,expected_date:e.target.value})}/></Field>
      </div>

      <div className="mt-7 flex items-center justify-between"><h2 className="font-semibold">Purchase Items</h2><button className="btn-secondary" onClick={()=>setItems([...items,blank()])}><Plus size={15}/>Add item</button></div>
      <div className="mt-3 rounded-2xl border border-zinc-200">
        <div className="overflow-x-auto">
          <table className="table min-w-[1050px]">
            <thead><tr><th>Product</th><th>Variant</th><th>Qty</th><th>Unit Cost</th><th>Discount</th><th>Tax</th><th>Total</th><th/></tr></thead>
            <tbody>{items.map((r,i)=>{
              const product=products.find(x=>x.id===Number(r.product))
              const productVariants=product?variants.filter(v=>v.product===product.id):[]
              const variantOptions=productVariants.map(v=>({
                value:String(v.id),
                label:v.sku,
                description:(v.attributes||[]).map((a:any)=>`${a.attribute}: ${a.value}`).join(' · ')||'Variant',
              }))
              const line=Number(r.quantity||0)*Number(r.unit_cost||0)-Number(r.discount||0)+Number(r.tax||0)
              return <tr key={i}>
                <td className="min-w-72 align-top"><SearchableSelect value={r.product} options={productOptions} onChange={value=>patchRow(i,{product:value,variant:''})} placeholder="Select product" searchPlaceholder="Search product name or SKU…"/></td>
                <td className="min-w-64 align-top">{product?.product_type==='variable'?<SearchableSelect value={r.variant} options={variantOptions} onChange={value=>patchRow(i,{variant:value})} placeholder="Select variant" searchPlaceholder="Search variant SKU or option…"/>:<span className="inline-block py-3 text-xs text-zinc-400">Not required</span>}</td>
                {(['quantity','unit_cost','discount','tax'] as const).map(k=><td key={k} className="align-top"><input type="number" min={k==='quantity'?'1':'0'} className="input min-w-24" value={r[k]} onChange={e=>patchRow(i,{[k]:e.target.value})}/></td>)}
                <td className="whitespace-nowrap py-4 align-top font-semibold">{money(line)}</td>
                <td className="align-top"><button disabled={items.length===1} onClick={()=>setItems(items.filter((_,j)=>j!==i))} className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-30"><Trash2 size={16}/></button></td>
              </tr>
            })}</tbody>
          </table>
        </div>
      </div>
      <div className="mt-5 flex justify-end"><div className="text-right"><div className="text-sm text-zinc-500">Purchase Total</div><div className="text-2xl font-bold">{money(totals)}</div></div></div>
      <div className="mt-6 flex justify-end gap-2"><button className="btn-secondary" onClick={()=>nav('/procurement/purchases')}>Cancel</button><button disabled={isLoading} onClick={save} className="btn-brand">{isLoading?'Creating…':'Create Purchase Draft'}</button></div>
    </div>
  </>
}
