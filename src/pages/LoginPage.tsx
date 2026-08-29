import {useState} from 'react'
import {Navigate} from 'react-router'
import {BarChart3,PackageCheck,ShieldCheck,Sparkles} from 'lucide-react'
import {useLoginMutation,useLazyMeQuery} from '../services/authApi'
import {useSiteBrandingQuery} from '../services/brandingApi'
import {useAppDispatch,useAppSelector} from '../store/hooks'
import {setCredentials} from '../features/auth/authSlice'
import {apiError} from '../utils/data'

function DashboardBrand({dark=false}:{dark?:boolean}){
  const {data}=useSiteBrandingQuery()
  if(data?.dashboard_brand_mode==='logo'&&data.dashboard_logo)return <img src={data.dashboard_logo} alt={data.dashboard_name||'Dashboard'} className="max-h-11 max-w-[220px] object-contain object-left"/>
  return <div><div className={`text-xl font-black tracking-tight ${dark?'text-white':'text-zinc-950'}`}>{data?.dashboard_name||'BEAUTYOPS'}</div>{data?.dashboard_tagline&&<div className={`mt-0.5 text-[9px] font-semibold uppercase tracking-[.2em] ${dark?'text-zinc-500':'text-zinc-400'}`}>{data.dashboard_tagline}</div>}</div>
}

export default function LoginPage(){
  const dispatch=useAppDispatch(),token=useAppSelector(s=>s.auth.access),[login,{isLoading}]=useLoginMutation(),[me]=useLazyMeQuery(),[form,setForm]=useState({identifier:'',password:''}),[error,setError]=useState('')
  if(token)return <Navigate to="/" replace/>
  const submit=async(e:React.FormEvent)=>{e.preventDefault();setError('');try{const r=await login(form).unwrap();if(r.user.role==='customer')throw new Error('Customer accounts cannot access the management dashboard.');dispatch(setCredentials({user:r.user,access:r.auth.access,refresh:r.auth.refresh}));const u=await me().unwrap();dispatch(setCredentials({user:u,access:r.auth.access,refresh:r.auth.refresh}))}catch(e){setError(e instanceof Error?e.message:apiError(e))}}
  return <div className="grid min-h-screen lg:grid-cols-[1.1fr_.9fr]">
    <section className="hidden bg-zinc-950 p-12 text-white lg:flex lg:flex-col lg:justify-between"><DashboardBrand dark/><div className="max-w-xl"><span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-300"><Sparkles size={15}/>Beauty commerce operations</span><h1 className="mt-5 text-5xl font-bold leading-[1.08] tracking-tight">Run catalog, inventory, orders and profit from one workspace.</h1><p className="mt-5 text-lg leading-8 text-zinc-400">Built around native simple and variable products, auditable stock movements and protected business workflows.</p></div><div className="grid grid-cols-3 gap-3 text-sm text-zinc-300">{[[ShieldCheck,'Role controlled'],[PackageCheck,'Inventory safe'],[BarChart3,'Report driven']].map(([I,t]:any)=><div key={t} className="rounded-2xl border border-white/10 bg-white/5 p-4"><I className="mb-4 text-pink-400"/>{t}</div>)}</div></section>
    <section className="flex items-center justify-center bg-white p-6"><form onSubmit={submit} className="w-full max-w-md"><div className="mb-8 lg:hidden"><DashboardBrand/></div><h2 className="text-3xl font-bold tracking-tight">Welcome back</h2><p className="mt-2 text-sm text-zinc-500">Sign in with your staff phone/email and password.</p>{error&&<div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}<label className="mt-7 block"><span className="label">Phone or email</span><input className="input" autoFocus value={form.identifier} onChange={e=>setForm({...form,identifier:e.target.value})} required/></label><label className="mt-4 block"><span className="label">Password</span><input type="password" className="input" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/></label><button disabled={isLoading} className="btn-brand mt-6 w-full">{isLoading?'Signing in…':'Sign in to dashboard'}</button><p className="mt-5 text-center text-xs leading-5 text-zinc-400">Access is restricted by the role assigned in the commerce backend.</p></form></section>
  </div>
}
