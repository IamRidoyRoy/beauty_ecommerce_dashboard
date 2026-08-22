import {Command,Loader2,LogOut,Menu,Search,X} from 'lucide-react'
import {useEffect,useRef,useState} from 'react'
import {useNavigate} from 'react-router'
import {useAppDispatch,useAppSelector} from '../../store/hooks'
import {toggleSidebar} from '../../features/ui/uiSlice'
import {logout} from '../../features/auth/authSlice'
import {useLazyGlobalSearchQuery} from '../../services/settingsApi'
import {roleLabels} from '../../utils/permissions'
import {useDebouncedValue} from '../../hooks/useDebouncedValue'

export function Topbar(){
  const dispatch=useAppDispatch(),user=useAppSelector(s=>s.auth.user),nav=useNavigate(),[q,setQ]=useState(''),[open,setOpen]=useState(false),wrap=useRef<HTMLDivElement>(null); const debounced=useDebouncedValue(q,250); const [trigger,{data=[],isFetching,isError}]=useLazyGlobalSearchQuery()
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();document.getElementById('admin-global-search')?.focus();setOpen(true)}if(e.key==='Escape'){setOpen(false);setQ('')}};const click=(e:MouseEvent)=>{if(wrap.current&&!wrap.current.contains(e.target as Node))setOpen(false)};window.addEventListener('keydown',key);window.addEventListener('mousedown',click);return()=>{window.removeEventListener('keydown',key);window.removeEventListener('mousedown',click)}},[])
  useEffect(()=>{if(debounced.trim().length>=2){trigger(debounced.trim());setOpen(true)}},[debounced,trigger])
  const choose=(url:string)=>{nav(url);setQ('');setOpen(false)}
  return <header className="sticky top-0 z-30 flex h-18 items-center gap-3 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur lg:px-7">
    <button className="rounded-xl p-2 hover:bg-zinc-100 lg:hidden" onClick={()=>dispatch(toggleSidebar())}><Menu size={20}/></button>
    <div ref={wrap} className="relative max-w-xl flex-1"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={18}/><input id="admin-global-search" className="input pl-10 pr-20" value={q} onFocus={()=>q.length>=2&&setOpen(true)} onChange={e=>setQ(e.target.value)} placeholder="Search order, customer, product, SKU, supplier, purchase, coupon, tracking…"/>{q?<button className="absolute right-11 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:bg-zinc-100" onClick={()=>{setQ('');setOpen(false)}}><X size={14}/></button>:null}<div className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-zinc-200 px-1.5 py-1 text-[10px] text-zinc-400 sm:flex"><Command size={11}/>K</div>
      {open&&q.trim().length>=2&&<div className="absolute left-0 right-0 top-[calc(100%+8px)] max-h-[420px] overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-2xl">{isFetching?<div className="flex items-center gap-2 p-4 text-sm text-zinc-500"><Loader2 className="animate-spin" size={16}/>Searching…</div>:isError?<div className="p-4 text-sm text-red-600">Search API failed. Check the management backend endpoint.</div>:data.length?data.map(x=><button key={`${x.type}-${x.id}`} className="flex w-full items-center gap-3 border-b border-zinc-100 px-4 py-3 text-left last:border-0 hover:bg-zinc-50" onClick={()=>choose(x.url)}><span className="rounded-md bg-zinc-100 px-2 py-1 text-[10px] font-semibold uppercase text-zinc-500">{x.type}</span><span className="min-w-0"><b className="block truncate text-sm text-zinc-800">{x.title}</b><small className="block truncate text-zinc-400">{x.subtitle}</small></span></button>):<div className="p-4 text-sm text-zinc-400">No results found.</div>}</div>}
    </div>
    <div className="ml-auto hidden text-right sm:block"><div className="text-sm font-semibold text-zinc-900">{user?.full_name||user?.phone||'Staff'}</div><div className="text-xs text-zinc-400">{user?.role?roleLabels[user.role]:''}</div></div>
    <button title="Logout" className="rounded-xl border border-zinc-200 p-2.5 text-zinc-500 hover:bg-zinc-50" onClick={()=>{dispatch(logout());nav('/login')}}><LogOut size={18}/></button>
  </header>
}
