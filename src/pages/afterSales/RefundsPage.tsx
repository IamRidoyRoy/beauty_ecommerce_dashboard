import {useState} from 'react'
import {Plus,CheckCircle2,Search} from 'lucide-react'
import {PageHeader} from '../../components/ui/PageHeader'
import {DataTable,type Column} from '../../components/ui/DataTable'
import {StatusBadge} from '../../components/ui/StatusBadge'
import {Modal} from '../../components/ui/Modal'
import {Pagination} from '../../components/ui/Pagination'
import {LoadingRows} from '../../components/ui/Loading'
import {ErrorState} from '../../components/ui/ErrorState'
import {Field,Input,Select,Textarea} from '../../components/forms/FormField'
import {useRefundsQuery,useCreateRefundMutation,useCompleteRefundMutation} from '../../services/returnApi'
import {usePaymentsQuery} from '../../services/paymentApi'
import {rowsOf,countOf,apiError} from '../../utils/data'
import {date,money,titleCase} from '../../utils/format'
import {useAppDispatch} from '../../store/hooks'
import {toast} from '../../features/ui/uiSlice'
import {useDebouncedValue} from '../../hooks/useDebouncedValue'

export default function RefundsPage(){
 const dispatch=useAppDispatch(),[page,setPage]=useState(1),[search,setSearch]=useState(''),[status,setStatus]=useState(''),[open,setOpen]=useState(false),[form,setForm]=useState({payment:'',amount:'',reason:''})
 const debounced=useDebouncedValue(search,300)
 const q=useRefundsQuery({page,page_size:50,search:debounced||undefined,status:status||undefined}),pq=usePaymentsQuery({status:'paid',page_size:200})
 const [create]=useCreateRefundMutation(),[complete]=useCompleteRefundMutation()
 const cols:Column<any>[]=[{key:'id',header:'Refund',render:r=><div><b>Refund #{r.id}</b><div className="text-xs text-zinc-400">Order #{r.order}</div></div>},{key:'payment',header:'Payment',render:r=>`#${r.payment}`},{key:'amount',header:'Amount',render:r=><b>{money(r.amount)}</b>},{key:'reason',header:'Reason',render:r=><span className="max-w-xs line-clamp-2">{r.reason||'—'}</span>},{key:'status',header:'Status',render:r=><StatusBadge value={r.status}/>},{key:'date',header:'Created',render:r=>date(r.created_at,true)},{key:'action',header:'',render:r=>r.status==='completed'?null:<button className="btn-secondary py-2" onClick={async()=>{try{await complete({id:r.id}).unwrap();dispatch(toast({type:'success',message:'Refund completed.'}))}catch(e){dispatch(toast({type:'error',message:apiError(e)}))}}}><CheckCircle2 size={15}/>Complete</button>}]
 return <><PageHeader title="Refunds" description="Search, create and complete full/partial refunds. Backend locks payments and enforces refund limits." actions={<button className="btn-brand" onClick={()=>setOpen(true)}><Plus size={16}/>Create Refund</button>}/><div className="mb-4 grid gap-2 md:grid-cols-2"><label className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"/><input className="input pl-9" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Order, customer, transaction, reason…"/></label><select className="input" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">All statuses</option>{['pending','processing','completed','failed','cancelled'].map(x=><option key={x} value={x}>{titleCase(x)}</option>)}</select></div>{q.isLoading?<LoadingRows/>:q.isError?<ErrorState onRetry={()=>q.refetch()}/>:<><DataTable rows={rowsOf<any>(q.data)} columns={cols} getKey={r=>r.id}/><Pagination count={countOf(q.data)} page={page} onPage={setPage}/></>}<Modal open={open} onClose={()=>setOpen(false)} title="Create refund"><div className="space-y-4"><Field label="Paid payment"><Select value={form.payment} onChange={e=>setForm({...form,payment:e.target.value})}><option value="">Select payment…</option>{rowsOf<any>(pq.data).map(p=><option key={p.id} value={p.id}>Payment #{p.id} · Order #{p.order} · {money(p.amount)}</option>)}</Select></Field><Field label="Refund amount"><Input type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></Field><Field label="Reason"><Textarea value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}/></Field><button disabled={!form.payment||!form.amount} className="btn-brand w-full" onClick={async()=>{try{await create({payment:Number(form.payment),amount:form.amount,reason:form.reason}).unwrap();setOpen(false);setForm({payment:'',amount:'',reason:''});dispatch(toast({type:'success',message:'Refund created.'}))}catch(e){dispatch(toast({type:'error',message:apiError(e)}))}}}>Create Refund</button></div></Modal></>}
