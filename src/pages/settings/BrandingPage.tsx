import {useEffect,useMemo,useState} from 'react'
import {Image as ImageIcon,Palette,Save,Trash2,Upload} from 'lucide-react'
import {PageHeader} from '../../components/ui/PageHeader'
import {Field,Input,Select} from '../../components/forms/FormField'
import {PageLoading} from '../../components/ui/Loading'
import {ErrorState} from '../../components/ui/ErrorState'
import {useAdminSiteBrandingQuery,useUpdateSiteBrandingMutation} from '../../services/brandingApi'
import {useAppDispatch} from '../../store/hooks'
import {toast} from '../../features/ui/uiSlice'
import {apiError} from '../../utils/data'
import {ImageUploadGuide} from '../../components/ui/ImageUploadGuide'

type FormState={
  website_brand_mode:'text'|'logo';website_name:string;website_tagline:string;
  dashboard_brand_mode:'text'|'logo';dashboard_name:string;dashboard_tagline:string;
  primary_color:string;secondary_color:string;
}

const defaults:FormState={website_brand_mode:'text',website_name:'LUMÉA',website_tagline:'Beauty Commerce',dashboard_brand_mode:'text',dashboard_name:'BEAUTYOPS',dashboard_tagline:'Commerce Control',primary_color:'#d43a89',secondary_color:'#33245e'}
const hex=/^#[0-9a-fA-F]{6}$/

function LogoField({label,current,file,onFile,remove,onRemove,width=600,height=180}:{label:string;current?:string|null;file:File|null;onFile:(f:File|null)=>void;remove:boolean;onRemove:()=>void;width?:number;height?:number}){
  const preview=useMemo(()=>file?URL.createObjectURL(file):(!remove?current||'':''),[file,current,remove])
  useEffect(()=>()=>{if(file&&preview)URL.revokeObjectURL(preview)},[file,preview])
  return <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
    <div className="mb-3 flex items-center justify-between gap-3"><div><b className="text-sm">{label}</b><p className="mt-0.5 text-xs text-zinc-500">WebP recommended for faster loading.</p></div>{preview&&<button type="button" className="btn-secondary px-3 py-2 text-red-600" onClick={onRemove}><Trash2 size={15}/>Remove</button>}</div>
    {preview?<div className="mb-3 flex h-24 items-center justify-center rounded-xl border border-zinc-200 bg-white p-3"><img src={preview} alt={`${label} preview`} className="max-h-full max-w-full object-contain"/></div>:<div className="mb-3 grid h-24 place-items-center rounded-xl border border-dashed border-zinc-300 bg-white text-zinc-400"><ImageIcon/></div>}
    <ImageUploadGuide width={width} height={height} file={file} note="Transparent background is recommended for logos." className="mb-3"/>
    <label className="btn-secondary w-full cursor-pointer"><Upload size={15}/>{file?'Change selected logo':'Choose logo'}<input type="file" accept="image/webp,image/png,image/jpeg,image/gif" className="hidden" onChange={e=>onFile(e.target.files?.[0]||null)}/></label>
  </div>
}

function ColorControl({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){
  return <Field label={label}><div className="flex gap-2"><input aria-label={`${label} color picker`} type="color" value={hex.test(value)?value:'#000000'} onChange={e=>onChange(e.target.value)} className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-zinc-200 bg-white p-1"/><Input value={value} maxLength={7} onChange={e=>onChange(e.target.value)} placeholder="#d43a89"/></div></Field>
}

export default function BrandingPage(){
  const dispatch=useAppDispatch();const q=useAdminSiteBrandingQuery();const [update,{isLoading}]=useUpdateSiteBrandingMutation()
  const [form,setForm]=useState<FormState>(defaults);const [websiteLogo,setWebsiteLogo]=useState<File|null>(null);const [dashboardLogo,setDashboardLogo]=useState<File|null>(null);const [clearWebsite,setClearWebsite]=useState(false);const [clearDashboard,setClearDashboard]=useState(false)
  useEffect(()=>{if(q.data)setForm({website_brand_mode:q.data.website_brand_mode,website_name:q.data.website_name,website_tagline:q.data.website_tagline||'',dashboard_brand_mode:q.data.dashboard_brand_mode,dashboard_name:q.data.dashboard_name,dashboard_tagline:q.data.dashboard_tagline||'',primary_color:q.data.primary_color,secondary_color:q.data.secondary_color})},[q.data])
  if(q.isLoading)return <PageLoading/>;if(q.isError)return <ErrorState onRetry={q.refetch}/>
  const save=async()=>{if(!hex.test(form.primary_color)||!hex.test(form.secondary_color)){dispatch(toast({type:'error',message:'Primary and secondary colors must be valid 6-digit HEX values.'}));return}const body=new FormData();Object.entries(form).forEach(([k,v])=>body.append(k,String(v)));if(websiteLogo)body.append('website_logo',websiteLogo);if(dashboardLogo)body.append('dashboard_logo',dashboardLogo);if(clearWebsite)body.append('clear_website_logo','true');if(clearDashboard)body.append('clear_dashboard_logo','true');try{await update(body).unwrap();setWebsiteLogo(null);setDashboardLogo(null);setClearWebsite(false);setClearDashboard(false);dispatch(toast({type:'success',message:'Branding and website colors updated.'}))}catch(e){dispatch(toast({type:'error',message:apiError(e)}))}}
  return <>
    <PageHeader title="Branding & Theme" description="Control storefront identity, dashboard identity and website brand colors without code changes." actions={<button className="btn-brand px-5 py-3 shadow-lg shadow-pink-200/60" disabled={isLoading} onClick={save}><Save size={16}/>{isLoading?'Saving…':'Save Branding'}</button>}/>
    <div className="grid gap-5 xl:grid-cols-2">
      <section className="panel p-5 sm:p-6"><div className="mb-5 flex items-start gap-3"><span className="rounded-xl bg-pink-50 p-2.5 text-pink-700"><ImageIcon size={19}/></span><div><h2 className="font-semibold">Website identity</h2><p className="text-xs leading-5 text-zinc-500">Choose whether the storefront shows an uploaded logo or a text brand name.</p></div></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Display as"><Select value={form.website_brand_mode} onChange={e=>setForm({...form,website_brand_mode:e.target.value as 'text'|'logo'})}><option value="text">Text name</option><option value="logo">Logo image</option></Select></Field><Field label="Website name"><Input value={form.website_name} onChange={e=>setForm({...form,website_name:e.target.value})}/></Field></div><div className="mt-4"><Field label="Website tagline"><Input value={form.website_tagline} onChange={e=>setForm({...form,website_tagline:e.target.value})} placeholder="Beauty Commerce"/></Field></div><div className="mt-5"><LogoField label="Website logo" current={q.data?.website_logo} file={websiteLogo} remove={clearWebsite} onFile={f=>{setWebsiteLogo(f);if(f)setClearWebsite(false)}} onRemove={()=>{setWebsiteLogo(null);setClearWebsite(true)}}/></div></section>
      <section className="panel p-5 sm:p-6"><div className="mb-5 flex items-start gap-3"><span className="rounded-xl bg-violet-50 p-2.5 text-violet-700"><ImageIcon size={19}/></span><div><h2 className="font-semibold">Dashboard identity</h2><p className="text-xs leading-5 text-zinc-500">Controls the management dashboard logo/name shown in the sidebar and sign-in screen.</p></div></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Display as"><Select value={form.dashboard_brand_mode} onChange={e=>setForm({...form,dashboard_brand_mode:e.target.value as 'text'|'logo'})}><option value="text">Text name</option><option value="logo">Logo image</option></Select></Field><Field label="Dashboard name"><Input value={form.dashboard_name} onChange={e=>setForm({...form,dashboard_name:e.target.value})}/></Field></div><div className="mt-4"><Field label="Dashboard tagline"><Input value={form.dashboard_tagline} onChange={e=>setForm({...form,dashboard_tagline:e.target.value})} placeholder="Commerce Control"/></Field></div><div className="mt-5"><LogoField label="Dashboard logo" current={q.data?.dashboard_logo} file={dashboardLogo} remove={clearDashboard} onFile={f=>{setDashboardLogo(f);if(f)setClearDashboard(false)}} onRemove={()=>{setDashboardLogo(null);setClearDashboard(true)}}/></div></section>
    </div>
    <section className="panel mt-5 p-5 sm:p-6"><div className="mb-5 flex items-start gap-3"><span className="rounded-xl bg-amber-50 p-2.5 text-amber-700"><Palette size={19}/></span><div><h2 className="font-semibold">Website colors</h2><p className="text-xs leading-5 text-zinc-500">Primary controls storefront actions/highlights; secondary controls strong navigation and supporting brand surfaces.</p></div></div><div className="grid gap-4 md:grid-cols-2"><ColorControl label="Primary color" value={form.primary_color} onChange={v=>setForm({...form,primary_color:v})}/><ColorControl label="Secondary color" value={form.secondary_color} onChange={v=>setForm({...form,secondary_color:v})}/></div><div className="mt-5 overflow-hidden rounded-2xl border border-zinc-200"><div className="grid sm:grid-cols-2"><div className="p-5 text-white" style={{background:hex.test(form.primary_color)?form.primary_color:'#d43a89'}}><b>Primary preview</b><p className="mt-1 text-sm text-white/80">Buttons, links, offer highlights and active accents.</p></div><div className="p-5 text-white" style={{background:hex.test(form.secondary_color)?form.secondary_color:'#33245e'}}><b>Secondary preview</b><p className="mt-1 text-sm text-white/80">Category navigation and supporting brand areas.</p></div></div></div></section>
  </>
}
