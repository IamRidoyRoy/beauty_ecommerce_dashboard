import type {InputHTMLAttributes,TextareaHTMLAttributes,SelectHTMLAttributes,ReactNode} from 'react'

export function Field({label,hint,error,required=false,children}:{label:string;hint?:string;error?:string;required?:boolean;children:ReactNode}){
  return <label className="block">
    <span className="label">{label}{required&&<span className="ml-0.5 text-red-600" aria-hidden="true">*</span>}</span>
    {children}
    {hint&&<span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    {error&&<span className="mt-1 block text-xs text-red-600">{error}</span>}
  </label>
}
export function Input(p:InputHTMLAttributes<HTMLInputElement>){return <input {...p} className={`input ${p.className||''}`}/>} 
export function Textarea(p:TextareaHTMLAttributes<HTMLTextAreaElement>){return <textarea {...p} className={`input min-h-28 resize-y ${p.className||''}`}/>} 
export function Select(p:SelectHTMLAttributes<HTMLSelectElement>){return <select {...p} className={`input ${p.className||''}`}/>} 
export function Switch({checked,onChange,label}:{checked:boolean;onChange:(v:boolean)=>void;label?:string}){return <label className="flex items-center gap-3"><button type="button" aria-pressed={checked} onClick={()=>onChange(!checked)} className={`relative h-6 w-11 rounded-full transition ${checked?'bg-pink-700':'bg-zinc-300'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked?'left-6':'left-1'}`}/></button>{label&&<span className="text-sm text-zinc-700">{label}</span>}</label>}
