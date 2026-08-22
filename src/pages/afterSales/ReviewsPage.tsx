import {useState} from 'react'
import {Image as ImageIcon,Star,Search} from 'lucide-react'
import {PageHeader} from '../../components/ui/PageHeader'
import {DataTable,type Column} from '../../components/ui/DataTable'
import {StatusBadge} from '../../components/ui/StatusBadge'
import {Modal} from '../../components/ui/Modal'
import {Pagination} from '../../components/ui/Pagination'
import {LoadingRows} from '../../components/ui/Loading'
import {ErrorState} from '../../components/ui/ErrorState'
import {useReviewsQuery,useUpdateReviewMutation} from '../../services/reviewApi'
import {rowsOf,countOf,apiError} from '../../utils/data'
import {date,titleCase} from '../../utils/format'
import {useAppDispatch} from '../../store/hooks'
import {toast} from '../../features/ui/uiSlice'
import {useDebouncedValue} from '../../hooks/useDebouncedValue'

export default function ReviewsPage(){
  const dispatch=useAppDispatch(),[page,setPage]=useState(1),[search,setSearch]=useState(''),[status,setStatus]=useState('pending'),[selected,setSelected]=useState<any>(null)
  const debounced=useDebouncedValue(search,300)
  const q=useReviewsQuery({page,page_size:50,search:debounced||undefined,status:status||undefined})
  const [update,busy]=useUpdateReviewMutation()
  const moderate=async(id:number,next:string)=>{try{await update({id,body:{status:next}}).unwrap();dispatch(toast({type:'success',message:`Review ${next}.`}))}catch(e){dispatch(toast({type:'error',message:apiError(e)}))}}
  const cols:Column<any>[]=[
    {key:'product',header:'Product',render:r=><div><b>Product #{r.product}</b><div className="text-xs text-zinc-400">Review #{r.id}</div></div>},
    {key:'customer',header:'Customer',render:r=><div><span className="font-medium">User #{r.user}</span>{r.verified_purchase&&<div className="mt-1 text-xs font-semibold text-emerald-600">Verified purchase</div>}</div>},
    {key:'rating',header:'Rating',render:r=><div className="flex items-center gap-1 font-semibold"><Star size={15} className="fill-amber-400 text-amber-400"/>{r.rating}/5</div>},
    {key:'comment',header:'Review',render:r=><button className="max-w-sm text-left" onClick={()=>setSelected(r)}><b className="block truncate">{r.title||'Customer review'}</b><span className="line-clamp-2 text-xs text-zinc-500">{r.comment}</span></button>},
    {key:'images',header:'Media',render:r=><span className="inline-flex items-center gap-1 text-xs text-zinc-500"><ImageIcon size={14}/>{r.images?.length||0}</span>},
    {key:'status',header:'Status',render:r=><StatusBadge value={r.status}/>},{key:'date',header:'Date',render:r=>date(r.created_at,true)},
    {key:'action',header:'Moderate',render:r=><select disabled={busy.isLoading} className="input min-w-32 py-2" value={r.status} onClick={e=>e.stopPropagation()} onChange={e=>moderate(r.id,e.target.value)}>{['pending','approved','rejected'].map(x=><option key={x} value={x}>{titleCase(x)}</option>)}</select>}
  ]
  return <><PageHeader title="Review Moderation" description="Search and moderate customer reviews while preserving backend verified-purchase status."/><div className="mb-4 grid gap-2 md:grid-cols-2"><label className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"/><input className="input pl-9" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Product, customer, phone, review…"/></label><select className="input" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">All statuses</option>{['pending','approved','rejected'].map(x=><option key={x} value={x}>{titleCase(x)}</option>)}</select></div>{q.isLoading?<LoadingRows/>:q.isError?<ErrorState onRetry={()=>q.refetch()}/>:<><DataTable rows={rowsOf<any>(q.data)} columns={cols} getKey={r=>r.id}/><Pagination count={countOf(q.data)} page={page} onPage={setPage}/></>}<Modal open={!!selected} onClose={()=>setSelected(null)} title="Review detail"><div className="space-y-4"><div className="flex items-center justify-between"><div><div className="font-semibold">Product #{selected?.product}</div><div className="text-xs text-zinc-500">Customer #{selected?.user}</div></div><StatusBadge value={selected?.status||''}/></div><div className="flex items-center gap-1 text-lg font-bold"><Star size={18} className="fill-amber-400 text-amber-400"/>{selected?.rating}/5</div><div><b>{selected?.title||'Customer review'}</b><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-600">{selected?.comment}</p></div>{selected?.images?.length>0&&<div className="grid grid-cols-3 gap-2">{selected.images.map((img:any)=><img key={img.id} src={img.image} alt="Review" className="aspect-square rounded-xl object-cover"/>)}</div>}<div className="flex gap-2"><button className="btn-primary flex-1" onClick={()=>{moderate(selected.id,'approved');setSelected(null)}}>Approve</button><button className="btn-danger flex-1" onClick={()=>{moderate(selected.id,'rejected');setSelected(null)}}>Reject</button></div></div></Modal></>
}
