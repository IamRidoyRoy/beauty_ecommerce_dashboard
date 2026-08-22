import {useParams,Link} from 'react-router'
import {MapPin,ShoppingBag,RotateCcw,Star,Heart} from 'lucide-react'
import {PageHeader} from '../../components/ui/PageHeader'
import {PageLoading} from '../../components/ui/Loading'
import {ErrorState} from '../../components/ui/ErrorState'
import {StatusBadge} from '../../components/ui/StatusBadge'
import {useCustomerQuery,useUpdateStatusMutation} from '../../services/customerApi'
import {money,date} from '../../utils/format'
import {useAppDispatch} from '../../store/hooks'
import {toast} from '../../features/ui/uiSlice'

export default function CustomerDetailPage(){
  const {id}=useParams()
  const q=useCustomerQuery(Number(id))
  const [status,{isLoading:statusSaving}]=useUpdateStatusMutation()
  const dispatch=useAppDispatch()

  if(q.isLoading)return <PageLoading/>
  if(q.isError||!q.data)return <ErrorState onRetry={()=>q.refetch()}/>
  const c=q.data

  return <>
    <PageHeader
      title={c.full_name||'Customer'}
      description={`${c.phone} · ${c.email||'No email'}`}
      actions={<button disabled={statusSaving} className="btn-secondary" onClick={async()=>{
        try{
          await status({id:c.id,is_active:!c.is_active}).unwrap()
          dispatch(toast({type:'success',message:`Customer ${c.is_active?'deactivated':'activated'}.`}))
        }catch{dispatch(toast({type:'error',message:'Could not update customer status.'}))}
      }}>{c.is_active?'Deactivate':'Activate'}</button>}
    />

    <div className="grid gap-5 xl:grid-cols-[.8fr_1.5fr]">
      <aside className="space-y-5">
        <section className="panel p-5">
          <div className="flex items-center justify-between"><h2 className="font-semibold">Profile</h2><StatusBadge value={c.is_active?'active':'inactive'}/></div>
          <dl className="mt-4 space-y-3 text-sm">
            {[
              ['Phone',c.phone],['Email',c.email||'—'],['Orders',c.orders_count??0],
              ['Lifetime Spend',money(c.lifetime_spend)],['Average Order',money(c.average_order)],
              ['Last Order',c.last_order?date(c.last_order):'—'],['Joined',date(c.created_at)],
            ].map(([k,v])=><div key={String(k)} className="flex justify-between gap-4"><dt className="text-zinc-400">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}
          </dl>
        </section>

        <section className="panel p-5">
          <h2 className="flex items-center gap-2 font-semibold"><MapPin size={17}/>Addresses</h2>
          <div className="mt-4 space-y-3">
            {c.addresses?.length?c.addresses.map((a:any)=><div key={a.id} className="rounded-xl bg-zinc-50 p-3 text-sm"><b>{a.label||'Address'} {a.is_default&&<span className="text-pink-700">· Default</span>}</b><p className="mt-1 text-zinc-500">{a.address}<br/>{a.thana}, {a.district}</p></div>):<p className="text-sm text-zinc-400">No saved addresses.</p>}
          </div>
        </section>
      </aside>

      <main className="space-y-5">
        <section className="panel overflow-hidden">
          <div className="flex items-center gap-2 border-b border-zinc-100 p-5"><ShoppingBag size={17}/><h2 className="font-semibold">Orders</h2></div>
          <div className="divide-y divide-zinc-100">
            {c.orders?.length?c.orders.map((o:any)=><Link key={o.id} to={`/sales/orders/${o.order_number}`} className="flex items-center justify-between p-4 hover:bg-zinc-50"><div><b>{o.order_number}</b><small className="block text-zinc-400">{date(o.created_at)}</small></div><div className="text-right"><b>{money(o.total)}</b><div className="mt-1"><StatusBadge value={o.order_status}/></div></div></Link>):<p className="p-5 text-sm text-zinc-400">No orders yet.</p>}
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="panel p-5">
            <h2 className="flex items-center gap-2 font-semibold"><RotateCcw size={17}/>Returns & Refunds</h2>
            <div className="mt-4 space-y-3 text-sm">
              {c.returns?.map((r:any)=><div key={`r${r.id}`} className="flex justify-between rounded-xl bg-zinc-50 p-3"><span>Return #{r.id}</span><StatusBadge value={r.status}/></div>)}
              {c.refunds?.map((r:any)=><div key={`f${r.id}`} className="flex justify-between rounded-xl bg-zinc-50 p-3"><span>Refund {money(r.amount)}</span><StatusBadge value={r.status}/></div>)}
              {!c.returns?.length&&!c.refunds?.length&&<p className="text-zinc-400">No returns or refunds.</p>}
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="flex items-center gap-2 font-semibold"><Star size={17}/>Reviews</h2>
            <div className="mt-4 space-y-3">
              {c.reviews?.length?c.reviews.map((r:any)=><div key={r.id} className="rounded-xl bg-zinc-50 p-3 text-sm"><div className="flex justify-between"><b>{'★'.repeat(r.rating)}</b><StatusBadge value={r.status}/></div><p className="mt-2 line-clamp-2 text-zinc-500">{r.comment}</p></div>):<p className="text-sm text-zinc-400">No reviews.</p>}
            </div>
          </section>
        </div>

        <section className="panel p-5">
          <h2 className="flex items-center gap-2 font-semibold"><Heart size={17}/>Wishlist</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {c.wishlist?.length?c.wishlist.map((w:any)=><span key={w.id} className="badge bg-pink-50 text-pink-700">{w.product_name}</span>):<span className="text-sm text-zinc-400">No saved products.</span>}
          </div>
        </section>
      </main>
    </div>
  </>
}
