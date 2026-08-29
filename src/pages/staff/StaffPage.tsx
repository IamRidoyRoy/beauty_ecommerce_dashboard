import {useMemo,useState} from 'react'
import {Check,Plus,Search,ShieldCheck,UserCog,X} from 'lucide-react'
import {PageHeader} from '../../components/ui/PageHeader'
import {DataTable,type Column} from '../../components/ui/DataTable'
import {Modal} from '../../components/ui/Modal'
import {ConfirmDialog} from '../../components/ui/ConfirmDialog'
import {Field,Input,Select,Switch} from '../../components/forms/FormField'
import {StatusBadge} from '../../components/ui/StatusBadge'
import {PageLoading} from '../../components/ui/Loading'
import {ErrorState} from '../../components/ui/ErrorState'
import {useStaffQuery,useStaffAccessOptionsQuery,useCreateStaffMutation,useUpdateStaffMutation,useDeleteStaffMutation} from '../../services/settingsApi'
import {rowsOf,apiError} from '../../utils/data'
import {date,titleCase} from '../../utils/format'
import {roleLabels} from '../../utils/permissions'
import {useAppDispatch,useAppSelector} from '../../store/hooks'
import {toast} from '../../features/ui/uiSlice'
import {useDebouncedValue} from '../../hooks/useDebouncedValue'
import type {StaffAccessModule} from '../../types'

const roles=['super_admin','admin','manager','product_manager','inventory_manager','order_manager','customer_support','marketing_manager','finance_manager'] as const
const baseForm={full_name:'',phone:'',email:'',role:'manager',password:'',is_active:true,is_staff:true,dashboard_modules:[] as string[]}

export default function StaffPage(){
 const dispatch=useAppDispatch(),me=useAppSelector(s=>s.auth.user);const [search,setSearch]=useState(''),[role,setRole]=useState(''),[status,setStatus]=useState('');const debouncedSearch=useDebouncedValue(search,300)
 const q=useStaffQuery({search:debouncedSearch||undefined,role:role||undefined,is_active:status===''?undefined:status,page_size:100});const accessQ=useStaffAccessOptionsQuery();const [create]=useCreateStaffMutation(),[update]=useUpdateStaffMutation(),[remove]=useDeleteStaffMutation()
 const [open,setOpen]=useState(false),[editing,setEditing]=useState<any>(null),[del,setDel]=useState<any>(null),[form,setForm]=useState<any>(baseForm)
 const defaults=accessQ.data?.role_defaults||{},allowed=accessQ.data?.role_allowed||{}
 const begin=(row?:any)=>{setEditing(row||null);setForm(row?{...row,password:'',dashboard_modules:[...(row.dashboard_modules||[])]}:{...baseForm,dashboard_modules:[...(defaults.manager||[])]});setOpen(true)}
 const save=async()=>{try{const body:any={...form,phone:form.phone||null,email:form.email||null,dashboard_modules:form.dashboard_modules||[]};if(!body.password)delete body.password;if(editing)await update({id:editing.id,body}).unwrap();else await create(body).unwrap();setOpen(false);dispatch(toast({type:'success',message:'Staff user saved with module access.'}))}catch(error){dispatch(toast({type:'error',message:apiError(error)}))}}
 const clearFilters=()=>{setSearch('');setRole('');setStatus('')}
 const columns:Column<any>[]=[
  {key:'staff',header:'Staff',render:r=><button className="text-left" onClick={()=>begin(r)}><b>{r.full_name}</b><div className="text-xs text-zinc-400">{r.email||r.phone||'No contact'}</div></button>},
  {key:'role',header:'Role',render:r=><span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700"><ShieldCheck size={13}/>{roleLabels[r.role as keyof typeof roleLabels]||titleCase(r.role)}</span>},
  {key:'status',header:'Status',render:r=><StatusBadge value={r.is_active?'active':'inactive'}/>},
  {key:'access',header:'Module Access',render:r=><div><b className="text-sm">{r.is_superuser?'All modules':`${r.dashboard_modules?.length||0} modules`}</b><div className="text-xs text-zinc-400">{r.is_superuser?'Superuser':r.dashboard_modules_customized?'Custom access':'Role defaults'}</div></div>},
  {key:'created',header:'Created',render:r=>date(r.created_at)},
  {key:'actions',header:'',render:r=><div className="flex gap-2"><button className="btn-secondary py-2" onClick={()=>begin(r)}>Edit</button><button disabled={r.id===me?.id} className="btn-danger py-2" onClick={()=>setDel(r)}>Delete</button></div>},
 ]
 if(q.isLoading||accessQ.isLoading)return <PageLoading/>;if(q.isError||accessQ.isError)return <ErrorState onRetry={()=>{q.refetch();accessQ.refetch()}}/>
 return <>
  <PageHeader title="Users & Roles" description="Assign a role plus exact dashboard modules. Role permissions remain the capability ceiling; module access further limits what the staff user can open." actions={<button className="btn-brand px-5 py-3 shadow-lg shadow-pink-200/60" onClick={()=>begin()}><Plus size={16}/>Add Staff</button>}/>
  <div className="mb-4 grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 md:grid-cols-[minmax(240px,1fr)_220px_180px_auto]"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16}/><Input className="pl-9" placeholder="Search name, phone or email..." value={search} onChange={e=>setSearch(e.target.value)}/></div><Select value={role} onChange={e=>setRole(e.target.value)}><option value="">All roles</option>{roles.map(x=><option key={x} value={x}>{roleLabels[x]}</option>)}</Select><Select value={status} onChange={e=>setStatus(e.target.value)}><option value="">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></Select>{(search||role||status)&&<button className="btn-secondary" onClick={clearFilters}><X size={16}/>Clear</button>}</div>
  <DataTable rows={rowsOf<any>(q.data)} columns={columns} getKey={r=>r.id}/>
  <Modal open={open} onClose={()=>setOpen(false)} title={editing?'Edit staff user':'Create staff user'} size="lg"><div className="space-y-5">
   <Field label="Full name"><Input value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/></Field>
   <div className="grid gap-3 sm:grid-cols-2"><Field label="Phone"><Input value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})}/></Field><Field label="Email"><Input type="email" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/></Field></div>
   <Field label="Role"><Select value={form.role} onChange={e=>{const next=e.target.value;setForm({...form,role:next,dashboard_modules:[...(defaults[next]||[])]})}}>{roles.map(x=><option key={x} value={x}>{roleLabels[x]}</option>)}</Select></Field>
   <ModuleAccess modules={accessQ.data?.modules||[]} allowed={allowed[form.role]||[]} selected={form.dashboard_modules||[]} onChange={v=>setForm({...form,dashboard_modules:v})}/>
   <Field label={editing?'New password (optional)':'Password'}><Input type="password" minLength={8} value={form.password||''} onChange={e=>setForm({...form,password:e.target.value})}/></Field>
   <div className="rounded-xl border border-zinc-200 p-4"><Switch checked={!!form.is_active} onChange={v=>setForm({...form,is_active:v})} label="Active account"/></div>
   <button disabled={!form.full_name||(!editing&&!form.password)} className="btn-brand w-full py-3 shadow-lg shadow-pink-200/60" onClick={save}><UserCog size={16}/>{editing?'Save Changes':'Create Staff User'}</button>
  </div></Modal>
  <ConfirmDialog open={!!del} onClose={()=>setDel(null)} danger title={`Delete ${del?.full_name||'staff user'}?`} onConfirm={async()=>{try{await remove(del.id).unwrap();setDel(null);dispatch(toast({type:'success',message:'Staff user deleted.'}))}catch(error){dispatch(toast({type:'error',message:apiError(error)}))}}}/>
 </>
}

function ModuleAccess({modules,allowed,selected,onChange}:{modules:StaffAccessModule[];allowed:string[];selected:string[];onChange:(x:string[])=>void}){
 const usable=modules.filter(m=>allowed.includes(m.key));const groups=useMemo(()=>Array.from(new Set(usable.map(m=>m.group))),[usable]);const toggle=(key:string)=>onChange(selected.includes(key)?selected.filter(x=>x!==key):[...selected,key]);
 return <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-semibold">Dashboard module access</div><p className="mt-1 text-xs leading-5 text-zinc-500">Choose exactly which apps/modules appear and can be accessed. Backend API access is checked too.</p></div><div className="flex gap-2"><button type="button" className="btn-secondary py-2 text-xs" onClick={()=>onChange(usable.map(x=>x.key))}>Select all</button><button type="button" className="btn-secondary py-2 text-xs" onClick={()=>onChange([])}>Clear</button></div></div>
  <div className="mt-4 space-y-4">{groups.map(group=><div key={group}><div className="mb-2 text-[11px] font-bold uppercase tracking-[.14em] text-zinc-400">{group}</div><div className="grid gap-2 sm:grid-cols-2">{usable.filter(m=>m.group===group).map(m=>{const checked=selected.includes(m.key);return <button type="button" key={m.key} onClick={()=>toggle(m.key)} className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${checked?'border-pink-300 bg-pink-50':'border-zinc-200 bg-white hover:border-zinc-300'}`}><span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${checked?'border-pink-700 bg-pink-700 text-white':'border-zinc-300 bg-white'}`}>{checked&&<Check size={13}/>}</span><span><b className="text-sm">{m.label}</b><span className="mt-0.5 block text-xs leading-4 text-zinc-500">{m.description}</span></span></button>})}</div></div>)}</div>
 </div>
}
