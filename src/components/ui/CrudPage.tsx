import {useState,type ReactNode} from 'react'
import {Plus,Search,Pencil,Trash2} from 'lucide-react'
import {PageHeader} from './PageHeader'
import {Modal} from './Modal'
import {ConfirmDialog} from './ConfirmDialog'
import {LoadingRows} from './Loading'
import {ErrorState} from './ErrorState'
import {EmptyState} from './EmptyState'
import {rowsOf,apiError,apiFieldErrors} from '../../utils/data'
import {useAppDispatch} from '../../store/hooks'
import {toast} from '../../features/ui/uiSlice'

export type CrudField={key:string;label:string;type?:'text'|'number'|'textarea'|'checkbox'|'select';options?:Array<{value:any;label:string}>;placeholder?:string;required?:boolean}

type Props={title:string;description?:string;data:any;isLoading:boolean;isError:boolean;refetch:()=>void;fields:CrudField[];createItem:(body:any)=>Promise<any>;updateItem:(id:number,body:any)=>Promise<any>;deleteItem?:(id:number)=>Promise<any>;renderRow?:(item:any)=>ReactNode}

export function CrudPage({title,description,data,isLoading,isError,refetch,fields,createItem,updateItem,deleteItem,renderRow}:Props){
  const dispatch=useAppDispatch()
  const [open,setOpen]=useState(false)
  const [editing,setEditing]=useState<any>(null)
  const [form,setForm]=useState<any>({})
  const [errors,setErrors]=useState<Record<string,string>>({})
  const [del,setDel]=useState<any>(null)
  const [busy,setBusy]=useState(false)
  const [search,setSearch]=useState('')
  const rows=rowsOf<any>(data).filter(r=>!search||Object.values(r).some(v=>String(v??'').toLowerCase().includes(search.toLowerCase())))

  const begin=(item?:any)=>{
    setEditing(item||null)
    setErrors({})
    setForm(item?{...item}:Object.fromEntries(fields.map(f=>[f.key,f.type==='checkbox'?false:''])))
    setOpen(true)
  }
  const setValue=(key:string,value:any)=>{
    setForm((current:any)=>({...current,[key]:value}))
    setErrors(current=>{if(!current[key])return current;const next={...current};delete next[key];return next})
  }
  const validate=()=>{
    const next:Record<string,string>={}
    fields.forEach(field=>{
      if(!field.required)return
      const value=form[field.key]
      if(value===undefined||value===null||String(value).trim()==='')next[field.key]=`${field.label} is required.`
    })
    setErrors(next)
    return Object.keys(next).length===0
  }
  const save=async()=>{
    if(!validate()){
      dispatch(toast({type:'error',message:'Please complete the required fields.'}))
      return
    }
    setBusy(true)
    try{
      const body={...form}
      delete body.id;delete body.created_at;delete body.updated_at
      editing?await updateItem(editing.id,body):await createItem(body)
      dispatch(toast({type:'success',message:`${title.slice(0,-1)||title} saved.`}))
      setOpen(false)
    }catch(e){
      setErrors(apiFieldErrors(e))
      dispatch(toast({type:'error',message:apiError(e)}))
    }finally{setBusy(false)}
  }

  return <>
    <PageHeader title={title} description={description} actions={<button className="btn-brand" onClick={()=>begin()}><Plus size={16}/>Add</button>}/>
    <div className="mb-4 max-w-md relative"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"/><input className="input pl-9" placeholder={`Search ${title.toLowerCase()}…`} value={search} onChange={e=>setSearch(e.target.value)}/></div>
    {isLoading?<LoadingRows/>:isError?<ErrorState onRetry={refetch}/>:rows.length?<div className="table-wrap"><div className="divide-y divide-zinc-100">{rows.map(r=><div key={r.id} className="flex items-center gap-4 px-5 py-4"><div className="min-w-0 flex-1">{renderRow?renderRow(r):<><b className="block truncate text-sm text-zinc-900">{r.name||r.value||r.code||`#${r.id}`}</b><span className="text-xs text-zinc-400">{r.slug||r.description||r.country||''}</span></>}</div><button className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100" onClick={()=>begin(r)}><Pencil size={16}/></button>{deleteItem&&<button className="rounded-lg p-2 text-red-500 hover:bg-red-50" onClick={()=>setDel(r)}><Trash2 size={16}/></button>}</div>)}</div></div>:<EmptyState title={`No ${title.toLowerCase()} yet`} action={<button className="btn-brand" onClick={()=>begin()}>Create first</button>}/>} 
    <Modal open={open} onClose={()=>setOpen(false)} title={`${editing?'Edit':'Add'} ${title}`}>
      <div className="space-y-4">{fields.map(f=><label key={f.key} className="block"><span className="label">{f.label}{f.required&&<span className="ml-1 text-red-500">*</span>}</span>{f.type==='textarea'?<textarea className={`input min-h-28 ${errors[f.key]?'border-red-400 focus:border-red-400 focus:ring-red-100':''}`} placeholder={f.placeholder} value={form[f.key]??''} onChange={e=>setValue(f.key,e.target.value)}/>:f.type==='checkbox'?<input type="checkbox" checked={!!form[f.key]} onChange={e=>setValue(f.key,e.target.checked)}/>:f.type==='select'?<select className={`input ${errors[f.key]?'border-red-400 focus:border-red-400 focus:ring-red-100':''}`} value={form[f.key]??''} onChange={e=>setValue(f.key,e.target.value)}><option value="">Select…</option>{f.options?.map(o=><option key={String(o.value)} value={o.value}>{o.label}</option>)}</select>:<input className={`input ${errors[f.key]?'border-red-400 focus:border-red-400 focus:ring-red-100':''}`} type={f.type==='number'?'number':'text'} placeholder={f.placeholder} value={form[f.key]??''} onChange={e=>setValue(f.key,e.target.value)}/>} {errors[f.key]&&<span className="mt-1 block text-xs text-red-600">{errors[f.key]}</span>}</label>)}<div className="flex justify-end gap-2 pt-2"><button className="btn-secondary" onClick={()=>setOpen(false)}>Cancel</button><button className="btn-brand" disabled={busy} onClick={save}>{busy?'Saving…':'Save'}</button></div></div>
    </Modal>
    <ConfirmDialog open={!!del} onClose={()=>setDel(null)} danger busy={busy} title={`Delete ${del?.name||del?.value||'item'}?`} onConfirm={async()=>{if(!del||!deleteItem)return;setBusy(true);try{await deleteItem(del.id);dispatch(toast({type:'success',message:'Deleted.'}));setDel(null)}catch(e){dispatch(toast({type:'error',message:apiError(e)}))}finally{setBusy(false)}}}/>
  </>
}
