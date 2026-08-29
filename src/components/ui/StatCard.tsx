import type {LucideIcon} from 'lucide-react'
import {Link} from 'react-router'

type Tone='neutral'|'success'|'warning'|'danger'

export function StatCard({label,value,sub,icon:Icon,tone='neutral',to}:{
  label:string
  value:string|number
  sub?:string
  icon:LucideIcon
  tone?:Tone
  to?:string
}){
  const tones:Record<Tone,string>={
    neutral:'bg-zinc-100 text-zinc-700',
    success:'bg-emerald-50 text-emerald-700',
    warning:'bg-amber-50 text-amber-700',
    danger:'bg-red-50 text-red-700',
  }
  const content=<>
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-500">{label}</p>
        <p className="mt-2 whitespace-nowrap text-[clamp(1.12rem,1.75vw,1.65rem)] font-bold tabular-nums tracking-[-0.035em] text-zinc-950">{value}</p>
        {sub&&<p className="mt-1 text-xs text-zinc-500">{sub}</p>}
      </div>
      <div className={`shrink-0 rounded-xl p-2.5 ${tones[tone]}`}><Icon size={19}/></div>
    </div>
  </>

  if(to)return <Link
    to={to}
    aria-label={`Open ${label}`}
    className="panel group block min-w-0 p-4 transition duration-200 hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-pink-100 sm:p-5"
  >{content}</Link>

  return <div className="panel min-w-0 p-4 sm:p-5">{content}</div>
}
