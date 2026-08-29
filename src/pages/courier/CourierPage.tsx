import {useEffect,useMemo,useState} from 'react'
import {Eye,FileText,PackageCheck,Search,Send} from 'lucide-react'

import {Modal} from '../../components/ui/Modal'
import {PageHeader} from '../../components/ui/PageHeader'
import {Pagination} from '../../components/ui/Pagination'
import {StatusBadge} from '../../components/ui/StatusBadge'
import {LoadingRows} from '../../components/ui/Loading'
import {ErrorState} from '../../components/ui/ErrorState'
import {useOrderQuery} from '../../services/orderApi'
import {useAvailableCouriersQuery,useCourierDispatchOrdersQuery,useSubmitCourierOrdersMutation} from '../../services/shippingApi'
import {useAppDispatch} from '../../store/hooks'
import {toast} from '../../features/ui/uiSlice'
import {apiError,countOf,rowsOf} from '../../utils/data'
import {date,money,titleCase} from '../../utils/format'
import type {CourierDispatchOrder,Order} from '../../types'
import {useDebouncedValue} from '../../hooks/useDebouncedValue'

function OrderDetails({order}:{order:Order}){
  const a=order.shipping_address_snapshot||{}
  return <div className="space-y-5">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl bg-zinc-50 p-3"><div className="text-xs text-zinc-400">Order</div><b>{order.order_number}</b></div>
      <div className="rounded-xl bg-zinc-50 p-3"><div className="text-xs text-zinc-400">Order Status</div><div className="mt-1"><StatusBadge value={order.order_status}/></div></div>
      <div className="rounded-xl bg-zinc-50 p-3"><div className="text-xs text-zinc-400">Payment</div><div className="mt-1"><StatusBadge value={order.payment_status}/></div></div>
      <div className="rounded-xl bg-zinc-50 p-3"><div className="text-xs text-zinc-400">Total</div><b>{money(order.total)}</b></div>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-xl border border-zinc-200 p-4"><h3 className="font-semibold">Customer</h3><div className="mt-3 text-sm leading-6 text-zinc-600"><div><b>{order.customer_name}</b></div><div>{order.customer_phone}</div></div></section>
      <section className="rounded-xl border border-zinc-200 p-4"><h3 className="font-semibold">Delivery Address</h3><div className="mt-3 text-sm leading-6 text-zinc-600"><div>{a.address||'—'}</div><div>{[a.thana,a.district].filter(Boolean).join(', ')||'—'}</div></div></section>
    </div>
    <section className="overflow-hidden rounded-xl border border-zinc-200"><div className="border-b border-zinc-100 px-4 py-3 font-semibold">Items</div><div className="overflow-x-auto"><table className="table"><thead><tr><th>Product</th><th>SKU</th><th>Qty</th><th>Total</th></tr></thead><tbody>{order.items.map(i=><tr key={i.id}><td><b>{i.product_name_snapshot}</b></td><td>{i.sku_snapshot}</td><td>{i.quantity}</td><td>{money(i.total)}</td></tr>)}</tbody></table></div></section>
    {order.notes?<section className="rounded-xl border border-zinc-200 p-4"><h3 className="font-semibold">Order Note</h3><p className="mt-2 whitespace-pre-wrap text-sm text-zinc-600">{order.notes}</p></section>:null}
  </div>
}

export default function CourierPage(){
  const dispatch=useAppDispatch()
  const [page,setPage]=useState(1)
  const [search,setSearch]=useState('')
  const [state,setState]=useState('')
  const [courierFilter,setCourierFilter]=useState('')
  const [provider,setProvider]=useState('')
  const [selected,setSelected]=useState<number[]>([])
  const [detailOrder,setDetailOrder]=useState('')
  const [result,setResult]=useState<any>(null)
  const debounced=useDebouncedValue(search,300)
  const q=useCourierDispatchOrdersQuery({page,page_size:50,search:debounced||undefined,state:state||undefined,courier:courierFilter||undefined})
  const couriers=useAvailableCouriersQuery()
  const [submit,{isLoading:submitting}]=useSubmitCourierOrdersMutation()
  const detail=useOrderQuery(detailOrder,{skip:!detailOrder})

  const rows=rowsOf<CourierDispatchOrder>(q.data)
  const courierRows=rowsOf<any>(couriers.data)
  const selectable=useMemo(()=>rows.filter(r=>r.can_submit).map(r=>r.id),[rows])
  const selectedSet=useMemo(()=>new Set(selected),[selected])
  const allVisibleSelected=selectable.length>0&&selectable.every(id=>selectedSet.has(id))

  useEffect(()=>{
    // Selections that moved to Shipped after a successful submit should not stay checked.
    const allowed=new Set(selectable)
    setSelected(prev=>prev.filter(id=>allowed.has(id)))
  },[q.data])

  useEffect(()=>{
    if(!provider&&courierRows.length)setProvider(courierRows[0].provider)
    if(provider&&!courierRows.some(x=>x.provider===provider))setProvider(courierRows[0]?.provider||'')
  },[couriers.data,provider])

  const toggle=(id:number)=>setSelected(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id])
  const toggleAll=()=>setSelected(prev=>allVisibleSelected?prev.filter(id=>!selectable.includes(id)):Array.from(new Set([...prev,...selectable])))

  const submitSelected=async()=>{
    if(!selected.length||!provider)return
    try{
      const data=await submit({order_ids:selected,provider}).unwrap()
      setResult(data)
      setSelected([])
      const failed=Number(data.failed_count||0)
      dispatch(toast({type:failed?'info':'success',message:failed?`${data.submitted_count} submitted, ${failed} failed.`:`${data.submitted_count} order(s) submitted successfully.`}))
    }catch(e){dispatch(toast({type:'error',message:apiError(e)}))}
  }

  return <>
    <PageHeader title="Courier Orders" description="Submit Packed orders to Pathao, Steadfast, RedX or CarryBee. Successfully submitted orders become Shipped; courier tracking syncs automatically and confirmed deliveries update the order to Delivered."/>

    <section className="mb-5 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="relative sm:col-span-2"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"/><input className="input pl-9" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search order, customer, phone, SKU, tracking…"/></label>
          <select className="input" value={state} onChange={e=>{setState(e.target.value);setPage(1)}}><option value="">Packed + Shipped</option><option value="packed">Packed only</option><option value="shipped">Shipped only</option></select>
          <select className="input" value={courierFilter} onChange={e=>{setCourierFilter(e.target.value);setPage(1)}}><option value="">All submitted couriers</option>{courierRows.map(x=><option key={x.provider} value={x.provider}>{x.display_name}</option>)}</select>
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row xl:w-auto">
          <select className="input min-w-[210px]" value={provider} onChange={e=>setProvider(e.target.value)} disabled={!courierRows.length}><option value="">Select courier</option>{courierRows.map(x=><option key={x.provider} value={x.provider}>{x.display_name}{x.environment==='sandbox'?' (Sandbox)':''}</option>)}</select>
          <button className="btn-brand min-h-11 whitespace-nowrap px-5" disabled={submitting||!selected.length||!provider} onClick={submitSelected}><Send size={16}/>{submitting?'Submitting…':`Submit ${selected.length||''} Order${selected.length===1?'':'s'}`}</button>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500"><span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-700">Packed: selectable</span><span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">Shipped: view only</span><span>{selected.length} selected</span></div>
    </section>

    {q.isLoading?<LoadingRows rows={8}/>:q.isError?<ErrorState onRetry={()=>q.refetch()}/>:<>
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="table min-w-[1180px]">
          <thead><tr>
            <th className="w-12"><input aria-label="Select all Packed orders" type="checkbox" checked={allVisibleSelected} disabled={!selectable.length} onChange={toggleAll}/></th>
            <th>Order</th><th>Customer</th><th>Items</th><th>Amount</th><th>Payment</th><th>Order Status</th><th>Submitted Courier</th><th>Tracking</th><th className="text-right">Actions</th>
          </tr></thead>
          <tbody>{rows.length?rows.map(r=><tr key={r.id} className={r.order_status==='shipped'?'bg-zinc-50/60':''}>
            <td><input aria-label={`Select ${r.order_number}`} type="checkbox" checked={selectedSet.has(r.id)} disabled={!r.can_submit} onChange={()=>toggle(r.id)}/></td>
            <td><b>{r.order_number}</b><div className="text-xs text-zinc-400">{date(r.created_at,true)}</div></td>
            <td><div className="font-medium">{r.customer_name}</div><div className="text-xs text-zinc-400">{r.customer_phone}</div></td>
            <td>{r.item_count}</td>
            <td><b>{money(r.total)}</b></td>
            <td><StatusBadge value={r.payment_status}/></td>
            <td><StatusBadge value={r.order_status}/></td>
            <td>{r.submitted_courier_display?<div><b>{r.submitted_courier_display}</b><div className="text-xs text-zinc-400">{r.shipment_status?titleCase(r.shipment_status):''}</div></div>:<span className="text-zinc-400">Not submitted</span>}</td>
            <td>{r.tracking_code?<span className="font-mono text-xs">{r.tracking_code}</span>:<span className="text-zinc-400">—</span>}</td>
            <td><div className="flex justify-end gap-2"><button className="btn-secondary py-2" onClick={()=>setDetailOrder(r.order_number)}><Eye size={14}/>Details</button><button className="btn-secondary py-2" onClick={()=>window.open(`/sales/orders/${r.order_number}/invoice`,'_blank','noopener,noreferrer')}><FileText size={14}/>Invoice</button></div></td>
          </tr>):<tr><td colSpan={10}><div className="py-14 text-center"><PackageCheck size={34} className="mx-auto mb-3 text-zinc-300"/><div className="font-semibold text-zinc-700">No Packed or Shipped orders</div><div className="mt-1 text-sm text-zinc-400">Packed orders will appear here automatically.</div></div></td></tr>}</tbody>
        </table>
      </div>
      <Pagination count={countOf(q.data)} page={page} onPage={setPage}/>
    </>}

    <Modal open={!!detailOrder} onClose={()=>setDetailOrder('')} title={detailOrder?`Order Details · ${detailOrder}`:'Order Details'} size="xl">
      {detail.isLoading?<div className="py-12 text-center text-sm text-zinc-500">Loading order details…</div>:detail.isError?<ErrorState onRetry={()=>detail.refetch()}/>:detail.data?<OrderDetails order={detail.data}/>:null}
    </Modal>

    <Modal open={!!result} onClose={()=>setResult(null)} title="Courier Submission Result" size="lg">
      <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-emerald-50 p-4"><div className="text-xs font-medium text-emerald-700">Submitted</div><div className="mt-1 text-2xl font-black text-emerald-800">{result?.submitted_count||0}</div></div><div className="rounded-xl bg-red-50 p-4"><div className="text-xs font-medium text-red-700">Failed</div><div className="mt-1 text-2xl font-black text-red-800">{result?.failed_count||0}</div></div></div>
      {result?.submitted?.length?<section className="mt-5"><h3 className="mb-2 font-semibold">Submitted Orders</h3><div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">{result.submitted.map((x:any)=><div key={x.order_id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"><div><b>{x.order_number}</b><div className="text-xs text-zinc-400">{x.courier_display}{x.tracking_code?` · ${x.tracking_code}`:''}</div></div><StatusBadge value={x.order_status}/></div>)}</div></section>:null}
      {result?.failed?.length?<section className="mt-5"><h3 className="mb-2 font-semibold">Failed Orders</h3><div className="divide-y divide-red-100 rounded-xl border border-red-200 bg-red-50/40">{result.failed.map((x:any)=><div key={`${x.order_id}-${x.code}`} className="p-3 text-sm"><div className="flex flex-wrap items-center gap-2"><b>{x.order_number||`Order #${x.order_id}`}</b>{x.code?<span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">{x.code}</span>:null}</div><div className="mt-1 text-xs font-medium text-red-700">{x.message}</div>{Array.isArray(x.details)&&x.details.length?<ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-red-700">{x.details.map((d:string,i:number)=><li key={`${x.order_id}-detail-${i}`}>{d}</li>)}</ul>:null}</div>)}</div></section>:null}
    </Modal>
  </>
}
