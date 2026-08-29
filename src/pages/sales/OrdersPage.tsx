import {useState} from 'react'
import {useNavigate,useSearchParams} from 'react-router'
import {useAppSelector} from '../../store/hooks'
import {can} from '../../utils/permissions'
import {Eye,FileText,Plus,Printer,Search,X} from 'lucide-react'
import {PageHeader} from '../../components/ui/PageHeader'
import {DataTable,type Column} from '../../components/ui/DataTable'
import {StatusBadge} from '../../components/ui/StatusBadge'
import {LoadingRows} from '../../components/ui/Loading'
import {ErrorState} from '../../components/ui/ErrorState'
import {Pagination} from '../../components/ui/Pagination'
import {useOrdersQuery} from '../../services/orderApi'
import {useShippingMethodsQuery} from '../../services/shippingApi'
import {useDebouncedValue} from '../../hooks/useDebouncedValue'
import {rowsOf,countOf} from '../../utils/data'
import {money,date,titleCase} from '../../utils/format'

const localDate=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}

export default function OrdersPage(){
  const nav=useNavigate(); const [params]=useSearchParams(); const user=useAppSelector(s=>s.auth.user); const today=params.get('period')==='today'?localDate():''; const [page,setPage]=useState(1),[search,setSearch]=useState(''),[status,setStatus]=useState(params.get('status')||''),[payment,setPayment]=useState(''),[fulfillment,setFulfillment]=useState(''),[shipping,setShipping]=useState(''),[dateFrom,setDateFrom]=useState(today),[dateTo,setDateTo]=useState(today)
  const debounced=useDebouncedValue(search); const q=useOrdersQuery({page,search:debounced||undefined,order_status:status||undefined,payment_status:payment||undefined,fulfillment_status:fulfillment||undefined,shipping_method:shipping||undefined,date_from:dateFrom||undefined,date_to:dateTo||undefined,ordering:'-created_at'}); const sm=useShippingMethodsQuery()
  const clear=()=>{setSearch('');setStatus('');setPayment('');setFulfillment('');setShipping('');setDateFrom('');setDateTo('');setPage(1)}
  const cols:Column<any>[]=[
    {key:'order',header:'Order',render:r=><div><b>{r.order_number}</b><div className="text-xs text-zinc-400">{date(r.created_at,true)}</div></div>},
    {key:'customer',header:'Customer',render:r=><div><b className="font-medium">{r.customer_name}</b><div className="text-xs text-zinc-400">{r.customer_phone}</div></div>},
    {key:'items',header:'Items',render:r=>r.items?.reduce((a:number,x:any)=>a+Number(x.quantity||0),0)||0},
    {key:'payment',header:'Payment',render:r=><div><StatusBadge value={r.payment_status}/><div className="mt-1 text-xs text-zinc-400">{r.payments?.[0]?.method?.toUpperCase()||'—'}</div></div>},
    {key:'total',header:'Total',render:r=><b>{money(r.total)}</b>},
    {key:'status',header:'Order Status',render:r=><StatusBadge value={r.order_status}/>},
    {key:'delivery',header:'Fulfillment',render:r=><StatusBadge value={r.fulfillment_status}/>},
    {key:'actions',header:'Actions',render:r=><div className="flex items-center gap-1" onClick={e=>e.stopPropagation()}><button title="Order detail" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100" onClick={()=>nav(`/sales/orders/${r.order_number}`)}><Eye size={16}/></button><button title="View invoice" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100" onClick={()=>nav(`/sales/orders/${r.order_number}/invoice`)}><FileText size={16}/></button><button title="Print invoice" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100" onClick={()=>window.open(`/sales/orders/${r.order_number}/invoice?print=1`,'_blank','noopener,noreferrer')}><Printer size={16}/></button></div>},
  ]
  return <>
    <PageHeader title="Orders" description="Search and process orders with direct invoice and print actions." actions={can(user,'order_write')?<button className="btn-brand" onClick={()=>nav('/sales/orders/new')}><Plus size={16}/>Create Order</button>:undefined}/>
    <div className="panel mb-4 grid gap-2 p-3 md:grid-cols-2 xl:grid-cols-8">
      <label className="relative xl:col-span-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16}/><input className="input pl-9" placeholder="Order, customer, phone or SKU" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/></label>
      <select className="input" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">All order statuses</option>{['pending','confirmed','processing','packed','shipped','out_for_delivery','delivered','cancelled','return_requested','partially_returned','returned','refunded'].map(x=><option key={x} value={x}>{titleCase(x)}</option>)}</select>
      <select className="input" value={payment} onChange={e=>{setPayment(e.target.value);setPage(1)}}><option value="">All payments</option>{['pending','paid','failed','partial_refund','refunded'].map(x=><option key={x} value={x}>{titleCase(x)}</option>)}</select>
      <select className="input" value={fulfillment} onChange={e=>{setFulfillment(e.target.value);setPage(1)}}><option value="">All fulfillment</option>{['unfulfilled','processing','fulfilled','partial_return','returned'].map(x=><option key={x} value={x}>{titleCase(x)}</option>)}</select>
      <select className="input" value={shipping} onChange={e=>{setShipping(e.target.value);setPage(1)}}><option value="">All delivery methods</option>{rowsOf<any>(sm.data).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
      <input className="input" type="date" title="From date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(1)}}/>
      <div className="flex gap-2"><input className="input" type="date" title="To date" value={dateTo} onChange={e=>{setDateTo(e.target.value);setPage(1)}}/><button className="btn-secondary px-3" title="Clear filters" onClick={clear}><X size={16}/></button></div>
    </div>
    {q.isLoading?<LoadingRows/>:q.isError?<ErrorState onRetry={q.refetch}/>:<><DataTable rows={rowsOf<any>(q.data)} columns={cols} getKey={r=>r.id} onRowClick={r=>nav(`/sales/orders/${r.order_number}`)}/><Pagination count={countOf(q.data)} page={page} onPage={setPage}/></>}
  </>
}
