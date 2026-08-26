import {useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {ExternalLink,Image as ImageIcon,Search,Star} from 'lucide-react'
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
import {mediaUrl} from '../../utils/media'
import {useAppDispatch} from '../../store/hooks'
import {toast} from '../../features/ui/uiSlice'
import {useDebouncedValue} from '../../hooks/useDebouncedValue'

function ProductCell({review,onOpen}:{review:any;onOpen:()=>void}){
  const product=review.product_summary
  return <button type="button" onClick={onOpen} className="group flex max-w-xs items-center gap-3 text-left">
    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
      {product?.primary_image?<img src={mediaUrl(product.primary_image)} alt={product.name||'Reviewed product'} className="h-full w-full object-cover"/>:<div className="grid h-full w-full place-items-center text-zinc-300"><ImageIcon size={18}/></div>}
    </div>
    <div className="min-w-0">
      <div className="truncate font-semibold text-zinc-900 group-hover:text-pink-700">{product?.name||`Product #${review.product}`}</div>
      <div className="mt-0.5 truncate text-xs text-zinc-500">{review.reviewed_sku||product?.sku||`Review #${review.id}`}</div>
      <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-pink-700">View product <ExternalLink size={11}/></span>
    </div>
  </button>
}

export default function ReviewsPage(){
  const dispatch=useAppDispatch(),navigate=useNavigate(),[page,setPage]=useState(1),[search,setSearch]=useState(''),[status,setStatus]=useState('pending'),[selected,setSelected]=useState<any>(null)
  const debounced=useDebouncedValue(search,300)
  const q=useReviewsQuery({page,page_size:50,search:debounced||undefined,status:status||undefined})
  const [update,busy]=useUpdateReviewMutation()
  const openProduct=(review:any)=>{const id=review?.product_summary?.id||review?.product;if(id)navigate(`/catalog/products/${id}/edit`)}
  const moderate=async(id:number,next:string)=>{try{await update({id,body:{status:next}}).unwrap();dispatch(toast({type:'success',message:`Review ${next}.`}))}catch(e){dispatch(toast({type:'error',message:apiError(e)}))}}
  const cols:Column<any>[]=[
    {key:'product',header:'Reviewed Product',render:r=><ProductCell review={r} onOpen={()=>openProduct(r)}/>},
    {key:'customer',header:'Customer',render:r=><div><span className="font-medium">{r.user_name||`User #${r.user}`}</span>{r.user_phone&&<div className="text-xs text-zinc-400">{r.user_phone}</div>}{r.verified_purchase&&<div className="mt-1 text-xs font-semibold text-emerald-600">Verified purchase</div>}</div>},
    {key:'rating',header:'Rating',render:r=><div className="flex items-center gap-1 font-semibold"><Star size={15} className="fill-amber-400 text-amber-400"/>{r.rating}/5</div>},
    {key:'comment',header:'Review',render:r=><button className="max-w-sm text-left" onClick={()=>setSelected(r)}><b className="block truncate">{r.title||'Customer review'}</b><span className="line-clamp-2 text-xs text-zinc-500">{r.comment}</span>{r.order_number&&<span className="mt-1 block text-[11px] text-zinc-400">Order {r.order_number}</span>}</button>},
    {key:'images',header:'Media',render:r=><span className="inline-flex items-center gap-1 text-xs text-zinc-500"><ImageIcon size={14}/>{r.images?.length||0}</span>},
    {key:'status',header:'Status',render:r=><StatusBadge value={r.status}/>},{key:'date',header:'Date',render:r=>date(r.created_at,true)},
    {key:'action',header:'Moderate',render:r=><select disabled={busy.isLoading} className="input min-w-32 py-2" value={r.status} onClick={e=>e.stopPropagation()} onChange={e=>moderate(r.id,e.target.value)}>{['pending','approved','rejected'].map(x=><option key={x} value={x}>{titleCase(x)}</option>)}</select>}
  ]
  return <><PageHeader title="Review Moderation" description="See exactly which product was reviewed, open the product record, and moderate customer reviews."/><div className="mb-4 grid gap-2 md:grid-cols-2"><label className="relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"/><input className="input pl-9" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Product, SKU, customer, phone, review…"/></label><select className="input" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">All statuses</option>{['pending','approved','rejected'].map(x=><option key={x} value={x}>{titleCase(x)}</option>)}</select></div>{q.isLoading?<LoadingRows/>:q.isError?<ErrorState onRetry={()=>q.refetch()}/>:<><DataTable rows={rowsOf<any>(q.data)} columns={cols} getKey={r=>r.id}/><Pagination count={countOf(q.data)} page={page} onPage={setPage}/></>}<Modal open={!!selected} onClose={()=>setSelected(null)} title="Review detail"><div className="space-y-4">{selected?.product_summary&&<button type="button" onClick={()=>openProduct(selected)} className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 p-3 text-left hover:bg-zinc-50"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-50">{selected.product_summary.primary_image?<img src={mediaUrl(selected.product_summary.primary_image)} alt={selected.product_summary.name} className="h-full w-full object-cover"/>:<div className="grid h-full w-full place-items-center text-zinc-300"><ImageIcon size={20}/></div>}</div><div className="min-w-0 flex-1"><div className="truncate font-semibold">{selected.product_summary.name}</div><div className="mt-1 text-xs text-zinc-500">{selected.reviewed_sku||selected.product_summary.sku||'No SKU'}{selected.order_number?` · Order ${selected.order_number}`:''}</div><span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-pink-700">View product details <ExternalLink size={12}/></span></div></button>}<div className="flex items-center justify-between"><div><div className="font-semibold">{selected?.user_name||`Customer #${selected?.user}`}</div><div className="text-xs text-zinc-500">{selected?.user_phone||''}</div></div><StatusBadge value={selected?.status||''}/></div><div className="flex items-center gap-1 text-lg font-bold"><Star size={18} className="fill-amber-400 text-amber-400"/>{selected?.rating}/5</div><div><b>{selected?.title||'Customer review'}</b><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-600">{selected?.comment}</p></div>{selected?.images?.length>0&&<div className="grid grid-cols-3 gap-2">{selected.images.map((img:any)=><img key={img.id} src={mediaUrl(img.image)} alt="Review" className="aspect-square rounded-xl object-cover"/>)}</div>}<div className="flex gap-2"><button className="btn-secondary flex-1" onClick={()=>openProduct(selected)}>View Product</button><button className="btn-primary flex-1" onClick={()=>{moderate(selected.id,'approved');setSelected(null)}}>Approve</button><button className="btn-danger flex-1" onClick={()=>{moderate(selected.id,'rejected');setSelected(null)}}>Reject</button></div></div></Modal></>
}
