import {CrudPage} from '../../components/ui/CrudPage'
import {useCategoriesQuery,useCreateCategoryMutation,useUpdateCategoryMutation,useDeleteCategoryMutation} from '../../services/catalogApi'
import {rowsOf} from '../../utils/data'

const categoryPriority=(a:any,b:any)=>{
  const ao=Number(a?.order??0),bo=Number(b?.order??0)
  const aUnset=ao<=0,bUnset=bo<=0
  if(aUnset!==bUnset)return aUnset?1:-1
  if(!aUnset&&!bUnset&&ao!==bo)return ao-bo
  if(!aUnset&&!bUnset&&ao===bo){
    const at=Date.parse(a?.updated_at||''),bt=Date.parse(b?.updated_at||'')
    if(Number.isFinite(at)&&Number.isFinite(bt)&&at!==bt)return bt-at
  }
  const byName=String(a?.name??'').localeCompare(String(b?.name??''),undefined,{sensitivity:'base'})
  return byName||Number(a?.id??0)-Number(b?.id??0)
}

export default function CategoriesPage(){
  const q=useCategoriesQuery({page_size:500})
  const [create]=useCreateCategoryMutation(),[update]=useUpdateCategoryMutation(),[remove]=useDeleteCategoryMutation()
  const categories=[...rowsOf<any>(q.data)].sort(categoryPriority)
  const opts=categories.map(x=>({value:x.id,label:`${Number(x.order||0)>0?`${x.order}. `:''}${x.name}`}))
  return <CrudPage
    title="Categories"
    description="Hierarchical catalog categories. Priority 1 is always first within its parent; occupied positions are shifted automatically. 0 means unprioritized / show last."
    data={categories}
    isLoading={q.isLoading}
    isError={q.isError}
    refetch={q.refetch}
    fields={[
      {key:'name',label:'Name',required:true},
      {key:'slug',label:'Slug',required:true},
      {key:'parent',label:'Parent category',type:'select',options:opts},
      {key:'description',label:'Description',type:'textarea'},
      {key:'order',label:'Display order',type:'number',helpText:'1 = first, 2 = second, etc. If a position is already used, that category shifts down automatically. 0 = unprioritized / show last.'},
      {key:'active',label:'Active',type:'checkbox'}
    ]}
    renderRow={r=><div className="flex min-w-0 items-center gap-3"><span className={`grid h-8 min-w-8 place-items-center rounded-lg px-2 text-xs font-bold ${Number(r.order||0)>0?'bg-pink-50 text-pink-700':'bg-zinc-100 text-zinc-500'}`}>{Number(r.order||0)>0?r.order:'—'}</span><div className="min-w-0"><b className="block truncate text-sm text-zinc-900">{r.name}</b><span className="text-xs text-zinc-400">{r.parent?`Subcategory · Parent #${r.parent}`:'Parent category'} · {Number(r.order||0)>0?`Priority ${r.order}`:'Unprioritized'}</span></div></div>}
    createItem={b=>create({...b,parent:b.parent||null,order:Math.max(0,Number(b.order||0))}).unwrap()}
    updateItem={(id,b)=>update({id,body:{...b,parent:b.parent||null,order:Math.max(0,Number(b.order||0))}}).unwrap()}
    deleteItem={id=>remove(id).unwrap()}
  />
}
