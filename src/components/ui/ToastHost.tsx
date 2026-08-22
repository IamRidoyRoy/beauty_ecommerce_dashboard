import {useEffect} from 'react'
import {CheckCircle2,Info,XCircle,X} from 'lucide-react'
import {useAppDispatch,useAppSelector} from '../../store/hooks'
import {dismissToast} from '../../features/ui/uiSlice'

type ToastItemProps={toast:{id:string;type:'success'|'error'|'info';message:string}}

function ToastItem({toast}:ToastItemProps){
  const dispatch=useAppDispatch()
  useEffect(()=>{
    const duration=toast.type==='error'?5000:3500
    const timer=window.setTimeout(()=>dispatch(dismissToast(toast.id)),duration)
    return()=>window.clearTimeout(timer)
  },[dispatch,toast.id,toast.type])

  const Icon=toast.type==='success'?CheckCircle2:toast.type==='error'?XCircle:Info
  return <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-xl">
    <Icon size={18} className={toast.type==='success'?'text-emerald-600':toast.type==='error'?'text-red-600':'text-blue-600'}/>
    <p className="flex-1 text-sm text-zinc-700">{toast.message}</p>
    <button aria-label="Dismiss notification" className="rounded-md p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700" onClick={()=>dispatch(dismissToast(toast.id))}><X size={16}/></button>
  </div>
}

export function ToastHost(){
  const toasts=useAppSelector(s=>s.ui.toasts)
  return <div className="fixed right-4 top-4 z-[100] w-[min(92vw,380px)] space-y-2">{toasts.map(t=><ToastItem key={t.id} toast={t}/>)}</div>
}
