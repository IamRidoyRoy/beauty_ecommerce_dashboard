import {useState} from 'react'
import {Plus,Search} from 'lucide-react'
import {PageHeader} from '../../components/ui/PageHeader'
import {DataTable,type Column} from '../../components/ui/DataTable'
import {StatusBadge} from '../../components/ui/StatusBadge'
import {Modal} from '../../components/ui/Modal'
import {Pagination} from '../../components/ui/Pagination'
import {LoadingRows} from '../../components/ui/Loading'
import {ErrorState} from '../../components/ui/ErrorState'
import {Field,Input,Select} from '../../components/forms/FormField'
import {useShipmentsQuery,useCreateShipmentMutation,useUpdateShipmentMutation} from '../../services/shippingApi'
import {useOrdersQuery} from '../../services/orderApi'
import {rowsOf,countOf,apiError} from '../../utils/data'
import {date,titleCase} from '../../utils/format'
import {useAppDispatch} from '../../store/hooks'
import {toast} from '../../features/ui/uiSlice'
import {useDebouncedValue} from '../../hooks/useDebouncedValue'

export default function ShipmentsPage(){
 const dispatch=useAppDispatch(),[page,setPage]=useState(1),[search,setSearch]=useState(''),[status,setStatus]=useState(''),[courier,setCourier]=useState(''),[open,setOpen]=useState(false),[form,setForm]=useState({order:'',courier:'Pathao',tracking_code:'',status:'pending'})
 const debounced=useDebouncedValue(search,300)
 const q=useShipmentsQuery({page,page_size:50,search:debounced||undefined,status:status||undefined,courier:courier||undefined}),orders=useOrdersQuery({page_size:200})
 const [create]=useCreateShipmentMutation(),[update]=useUpdateShipmentMutation()
 const cols:Column<any>[]=[{key:'tracking',header:'Tracking',render:r=><div><b>{r.tracking_code||`Shipment #${r.id}`}</b><div className="text-xs text-zinc-400">{r.external_id||'—'}</div></div>},{key:'order',header:'Order',render:r=>`#${r.order}`},{key:'courier',header:'Courier',render:r=>r.courier||'Other'},{key:'status',header:'Status',render:r=><StatusBadge value={r.status}/>},{key:'date',header:'Updated',render:r=>date(r.updated_at,true)},{key:'action',header:'Update',render:r=><select className="input min-w-40 py-2" value={r.status} onChange={e=>update({id:r.id,body:{status:e.target.value}})}>{['pending','booked','picked','in_transit','delivered','failed','cancelled'].map(x=><option key={x} value={x}>{titleCase(x)}</option>)}</select>}]
 return <><PageHeader title="Shipments" description="Search and manage courier-neutral shipment records for Pathao, Steadfast, RedX and other adapters." actions={<button className="btn-brand" onClick={()=>setOpen(true)}><Plus size={16}/>New Shipment</button>}/>
 <div className="mb-4 grid gap-2 md:grid-cols-3"><label className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"/><input className="input pl-9" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Tracking, order, customer, phone…"/></label><select className="input" value={courier} onChange={e=>{setCourier(e.target.value);setPage(1)}}><option value="">All couriers</option>{['Pathao','Steadfast','RedX','Other'].map(x=><option key={x} value={x}>{x}</option>)}</select><select className="input" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">All statuses</option>{['pending','booked','picked','in_transit','delivered','failed','cancelled'].map(x=><option key={x} value={x}>{titleCase(x)}</option>)}</select></div>
 {q.isLoading?<LoadingRows/>:q.isError?<ErrorState onRetry={()=>q.refetch()}/>:<><DataTable rows={rowsOf<any>(q.data)} columns={cols} getKey={r=>r.id}/><Pagination count={countOf(q.data)} page={page} onPage={setPage}/></>}
 <Modal open={open} onClose={()=>setOpen(false)} title="Create Shipment"><div className="space-y-4"><Field label="Order"><Select value={form.order} onChange={e=>setForm({...form,order:e.target.value})}><option value="">Select order</option>{rowsOf<any>(orders.data).map(o=><option key={o.id} value={o.id}>{o.order_number} · {o.customer_name}</option>)}</Select></Field><Field label="Courier"><Select value={form.courier} onChange={e=>setForm({...form,courier:e.target.value})}>{['Pathao','Steadfast','RedX','Other'].map(x=><option key={x}>{x}</option>)}</Select></Field><Field label="Tracking Code"><Input value={form.tracking_code} onChange={e=>setForm({...form,tracking_code:e.target.value})}/></Field><button className="btn-brand w-full" onClick={async()=>{try{await create({order:Number(form.order),courier:form.courier,tracking_code:form.tracking_code,status:'pending',payload:{}}).unwrap();setOpen(false);dispatch(toast({type:'success',message:'Shipment created.'}))}catch(e){dispatch(toast({type:'error',message:apiError(e)}))}}}>Create Shipment</button></div></Modal></>}
