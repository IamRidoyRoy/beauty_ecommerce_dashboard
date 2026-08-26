import {Check,ChevronDown,Search,X} from 'lucide-react'
import {createPortal} from 'react-dom'
import {useEffect,useMemo,useRef,useState} from 'react'

export type SearchableOption={value:string;label:string;description?:string;disabled?:boolean}

type Props={
  value:string
  options:SearchableOption[]
  onChange:(value:string)=>void
  placeholder?:string
  searchPlaceholder?:string
  disabled?:boolean
  required?:boolean
  emptyText?:string
}

type MenuPosition={left:number;top:number;width:number;maxHeight:number}

export function SearchableSelect({value,options,onChange,placeholder='Select option',searchPlaceholder='Search…',disabled=false,required=false,emptyText='No matching options.'}:Props){
  const [open,setOpen]=useState(false)
  const [query,setQuery]=useState('')
  const [menu,setMenu]=useState<MenuPosition|null>(null)
  const root=useRef<HTMLDivElement>(null)
  const menuRef=useRef<HTMLDivElement>(null)
  const selected=options.find(o=>o.value===value)
  const rows=useMemo(()=>{
    const q=query.trim().toLowerCase()
    if(!q)return options
    return options.filter(o=>`${o.label} ${o.description||''}`.toLowerCase().includes(q))
  },[options,query])

  const positionMenu=()=>{
    if(!root.current)return
    const rect=root.current.getBoundingClientRect()
    const viewportHeight=window.innerHeight
    const preferred=320
    const below=viewportHeight-rect.bottom-12
    const above=rect.top-12
    const useAbove=below<220&&above>below
    const maxHeight=Math.max(180,Math.min(preferred,useAbove?above:below))
    const top=useAbove?Math.max(8,rect.top-maxHeight-8):rect.bottom+8
    setMenu({left:rect.left,top,width:rect.width,maxHeight})
  }

  useEffect(()=>{
    if(!open)return
    positionMenu()
    const onMove=()=>positionMenu()
    window.addEventListener('resize',onMove)
    window.addEventListener('scroll',onMove,true)
    return()=>{window.removeEventListener('resize',onMove);window.removeEventListener('scroll',onMove,true)}
  },[open])

  useEffect(()=>{
    const onDoc=(event:MouseEvent)=>{
      const target=event.target as Node
      if(root.current?.contains(target)||menuRef.current?.contains(target))return
      setOpen(false)
    }
    document.addEventListener('mousedown',onDoc)
    return()=>document.removeEventListener('mousedown',onDoc)
  },[])

  const dropdown=open&&menu&&typeof document!=='undefined'?createPortal(
    <div ref={menuRef} className="fixed z-[120] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xl" style={{left:menu.left,top:menu.top,width:menu.width,maxHeight:menu.maxHeight}}>
      <div className="relative border-b border-zinc-100 p-2">
        <Search size={15} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400"/>
        <input autoFocus className="input h-10 pl-9 pr-9" placeholder={searchPlaceholder} value={query} onChange={e=>setQuery(e.target.value)}/>
        {query&&<button type="button" className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-400" onClick={()=>setQuery('')}><X size={14}/></button>}
      </div>
      <div role="listbox" className="overflow-y-auto p-1" style={{maxHeight:Math.max(120,menu.maxHeight-58)}}>
        {rows.length?rows.map(option=><button key={option.value} type="button" role="option" aria-selected={option.value===value} disabled={option.disabled} onClick={()=>{if(option.disabled)return;onChange(option.value);setOpen(false);setQuery('')}} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${option.disabled?'cursor-not-allowed opacity-40':'hover:bg-zinc-50'}`}>
          <span className="min-w-0 flex-1"><span className="block truncate font-medium text-zinc-800">{option.label}</span>{option.description&&<span className="block truncate text-xs text-zinc-400">{option.description}</span>}</span>
          {option.value===value&&<Check size={15} className="text-pink-700"/>}
        </button>):<div className="p-4 text-center text-sm text-zinc-400">{emptyText}</div>}
      </div>
    </div>,document.body
  ):null

  return <div ref={root} className="relative">
    <button type="button" disabled={disabled} aria-haspopup="listbox" aria-expanded={open} onClick={()=>{setOpen(v=>!v);setQuery('')}} className="input flex min-h-11 items-center justify-between gap-3 text-left disabled:bg-zinc-50 disabled:text-zinc-400">
      <span className={selected?'truncate text-zinc-900':'truncate text-zinc-400'}>{selected?.label||placeholder}</span>
      <ChevronDown size={16} className="shrink-0 text-zinc-400"/>
    </button>
    {required&&<input tabIndex={-1} aria-hidden="true" required value={value} onChange={()=>{}} className="pointer-events-none absolute h-px w-px opacity-0"/>}
    {dropdown}
  </div>
}
