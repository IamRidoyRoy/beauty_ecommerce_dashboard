import {useState} from 'react'
import {Search} from 'lucide-react'
import {PageHeader} from '../../components/ui/PageHeader'
import {DataTable,type Column} from '../../components/ui/DataTable'
import {StatusBadge} from '../../components/ui/StatusBadge'
import {Pagination} from '../../components/ui/Pagination'
import {LoadingRows} from '../../components/ui/Loading'
import {ErrorState} from '../../components/ui/ErrorState'
import {usePaymentsQuery,useUpdatePaymentMutation} from '../../services/paymentApi'
import {rowsOf,countOf} from '../../utils/data'
import {money,date,titleCase} from '../../utils/format'
import {useDebouncedValue} from '../../hooks/useDebouncedValue'

export default function PaymentsPage(){
 const [page,setPage]=useState(1),[status,setStatus]=useState(''),[method,setMethod]=useState(''),[search,setSearch]=useState('')
 const debounced=useDebouncedValue(search,300)
 const q=usePaymentsQuery({page,page_size:50,search:debounced||undefined,status:status||undefined,method:method||undefined})
 const [update]=useUpdatePaymentMutation()
 const cols:Column<any>[]=[
  {key:'txn',header:'Transaction',render:r=><div><b>{r.transaction_id||`Payment #${r.id}`}</b><div className="text-xs text-zinc-400">{r.gateway_reference||'No gateway reference'}</div></div>},
  {key:'order',header:'Order',render:r=>`#${r.order}`},{key:'amount',header:'Amount',render:r=><b>{money(r.amount)}</b>},
  {key:'method',header:'Method',render:r=><span className="font-medium">{String(r.method||'').toUpperCase()}</span>},
  {key:'status',header:'Status',render:r=><StatusBadge value={r.status}/>},{key:'date',header:'Date',render:r=>date(r.created_at,true)},
  {key:'action',header:'',render:r=><select className="input min-w-40 py-2" value={r.status} onClick={e=>e.stopPropagation()} onChange={e=>update({id:r.id,body:{status:e.target.value}})}>{['pending','authorized','paid','failed','cancelled','partial_refund','refunded'].map(x=><option key={x} value={x}>{titleCase(x)}</option>)}</select>}
 ]
 const change=(setter:(v:string)=>void)=>(v:string)=>{setter(v);setPage(1)}
 return <><PageHeader title="Payments" description="Search and manage COD and gateway payments; refund limits remain backend enforced."/>
 <div className="mb-4 grid gap-2 md:grid-cols-3"><label className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"/><input className="input pl-9" value={search} onChange={e=>change(setSearch)(e.target.value)} placeholder="Transaction, order, customer, phone…"/></label><select className="input" value={method} onChange={e=>change(setMethod)(e.target.value)}><option value="">All methods</option>{['cod','bkash','nagad','card'].map(x=><option key={x} value={x}>{x.toUpperCase()}</option>)}</select><select className="input" value={status} onChange={e=>change(setStatus)(e.target.value)}><option value="">All statuses</option>{['pending','authorized','paid','failed','cancelled','partial_refund','refunded'].map(x=><option key={x} value={x}>{titleCase(x)}</option>)}</select></div>
 {q.isLoading?<LoadingRows/>:q.isError?<ErrorState onRetry={()=>q.refetch()}/>:<><DataTable rows={rowsOf<any>(q.data)} columns={cols} getKey={r=>r.id}/><Pagination count={countOf(q.data)} page={page} onPage={setPage}/></>}</>}
