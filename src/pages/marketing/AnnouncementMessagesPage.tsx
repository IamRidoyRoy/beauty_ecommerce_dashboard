import {CrudPage} from '../../components/ui/CrudPage'
import {useAnnouncementMessagesQuery,useCreateAnnouncementMessageMutation,useUpdateAnnouncementMessageMutation,useDeleteAnnouncementMessageMutation} from '../../services/marketingApi'
import {rowsOf} from '../../utils/data'

const iconOptions=[
  {value:'gift',label:'Gift'},
  {value:'truck',label:'Delivery truck'},
  {value:'sparkles',label:'Sparkles'},
  {value:'badge',label:'Authenticity badge'},
  {value:'tag',label:'Offer tag'},
  {value:'shield',label:'Shield'},
]

const priority=(a:any,b:any)=>{
  const ao=Number(a?.order??0),bo=Number(b?.order??0),au=ao<=0,bu=bo<=0
  if(au!==bu)return au?1:-1
  if(!au&&!bu&&ao!==bo)return ao-bo
  return Number(a?.id??0)-Number(b?.id??0)
}

export default function AnnouncementMessagesPage(){
  const q=useAnnouncementMessagesQuery({page_size:200,ordering:'order'})
  const [create]=useCreateAnnouncementMessageMutation(),[update]=useUpdateAnnouncementMessageMutation(),[remove]=useDeleteAnnouncementMessageMutation()
  const rows=[...rowsOf<any>(q.data)].sort(priority)
  return <CrudPage
    title="Announcement Messages"
    description="Control the moving messages in the storefront top bar. Lower display order appears first; deactivate a message to hide it instantly."
    data={rows}
    isLoading={q.isLoading}
    isError={q.isError}
    error={q.error}
    refetch={q.refetch}
    fields={[
      {key:'text',label:'Announcement text',required:true,placeholder:'Free delivery on eligible orders over ৳2,000'},
      {key:'icon',label:'Icon',type:'select',options:iconOptions},
      {key:'link_url',label:'Optional link',placeholder:'/products?ordering=-compare_at_price'},
      {key:'order',label:'Display order',type:'number',defaultValue:1,helpText:'1 appears first, 2 second. Use 0 for unprioritized / last.'},
      {key:'active',label:'Active',type:'checkbox',defaultValue:true},
    ]}
    createItem={b=>create({...b,order:Math.max(0,Number(b.order||0)),active:Boolean(b.active)}).unwrap()}
    updateItem={(id,b)=>update({id,body:{...b,order:Math.max(0,Number(b.order||0)),active:Boolean(b.active)}}).unwrap()}
    deleteItem={id=>remove(id).unwrap()}
    renderRow={r=><div><div className="flex items-center gap-2"><b className="text-sm text-zinc-900">{r.text}</b><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.active?'bg-emerald-50 text-emerald-700':'bg-zinc-100 text-zinc-500'}`}>{r.active?'Active':'Hidden'}</span></div><div className="mt-1 text-xs text-zinc-400">Order {r.order||0} · {r.icon||'No icon'}{r.link_url?` · ${r.link_url}`:''}</div></div>}
  />
}
