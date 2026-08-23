import type {LucideIcon} from 'lucide-react'
import {Link} from 'react-router'

type Props={label:string;value:string|number;sub?:string;icon?:LucideIcon;tone?:'neutral'|'success'|'warning'|'danger';to?:string}

export function StatCard({label,value,sub,icon:Icon,tone='neutral',to}:Props){
  const tones={neutral:'bg-zinc-100 text-zinc-700',success:'bg-emerald-50 text-emerald-700',warning:'bg-amber-50 text-amber-700',danger:'bg-red-50 text-red-700'}
  const card=<div className={`panel p-5 transition ${to?'cursor-pointer hover:-translate-y-0.5 hover:border-pink-200 hover:shadow-sm':''}`}><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-zinc-500">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-zinc-950">{value}</p>{sub&&<p className="mt-1 text-xs text-zinc-500">{sub}</p>}</div>{Icon&&<div className={`rounded-xl p-2.5 ${tones[tone]}`}><Icon size={19}/></div>}</div></div>
  return to?<Link to={to} className="block">{card}</Link>:card
}
