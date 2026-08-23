import {useEffect,useMemo,useState} from 'react'
import {Eye,EyeOff,ImagePlus,Pencil,Plus,Trash2} from 'lucide-react'
import {PageHeader} from '../../components/ui/PageHeader'
import {EmptyState} from '../../components/ui/EmptyState'
import {LoadingRows} from '../../components/ui/Loading'
import {ErrorState} from '../../components/ui/ErrorState'
import {Modal} from '../../components/ui/Modal'
import {Field,Input,Select,Switch,Textarea} from '../../components/forms/FormField'
import {StatusBadge} from '../../components/ui/StatusBadge'
import {useHeroSlidesQuery,useCreateHeroSlideMutation,useUpdateHeroSlideMutation,useDeleteHeroSlideMutation} from '../../services/heroApi'
import {rowsOf,apiError,apiFieldErrors} from '../../utils/data'
import {mediaUrl} from '../../utils/media'
import {date} from '../../utils/format'
import {useAppDispatch} from '../../store/hooks'
import {toast} from '../../features/ui/uiSlice'
import type {HeroSlide} from '../../types'

type Draft={
  eyebrow:string;title:string;subtitle:string;image_alt:string;primary_cta_label:string;primary_cta_url:string;secondary_cta_label:string;secondary_cta_url:string;text_position:'left'|'center'|'right';theme:'light'|'dark';overlay_opacity:string;order:string;starts_at:string;ends_at:string;active:boolean
}
const emptyDraft:Draft={eyebrow:'',title:'',subtitle:'',image_alt:'',primary_cta_label:'Shop Now',primary_cta_url:'/products',secondary_cta_label:'',secondary_cta_url:'',text_position:'left',theme:'dark',overlay_opacity:'20',order:'0',starts_at:'',ends_at:'',active:true}
const localDate=(value?:string|null)=>value?new Date(value).toISOString().slice(0,16):''

export default function HeroSlidesPage(){
  const dispatch=useAppDispatch();const q=useHeroSlidesQuery();const [create]=useCreateHeroSlideMutation();const [update]=useUpdateHeroSlideMutation();const [remove]=useDeleteHeroSlideMutation()
  const [open,setOpen]=useState(false);const [editing,setEditing]=useState<HeroSlide|null>(null);const [draft,setDraft]=useState<Draft>(emptyDraft);const [image,setImage]=useState<File|null>(null);const [mobileImage,setMobileImage]=useState<File|null>(null);const [saving,setSaving]=useState(false);const [fieldErrors,setFieldErrors]=useState<Record<string,string>>({})
  const rows=rowsOf<HeroSlide>(q.data).slice().sort((a,b)=>a.order-b.order||a.id-b.id)
  const imagePreview=useMemo(()=>image?URL.createObjectURL(image):editing?.image?mediaUrl(editing.image):'', [image,editing])
  const mobilePreview=useMemo(()=>mobileImage?URL.createObjectURL(mobileImage):editing?.mobile_image?mediaUrl(editing.mobile_image):'', [mobileImage,editing])
  useEffect(()=>()=>{if(imagePreview.startsWith('blob:'))URL.revokeObjectURL(imagePreview);if(mobilePreview.startsWith('blob:'))URL.revokeObjectURL(mobilePreview)},[imagePreview,mobilePreview])

  const startAdd=()=>{setEditing(null);setDraft(emptyDraft);setImage(null);setMobileImage(null);setFieldErrors({});setOpen(true)}
  const startEdit=(slide:HeroSlide)=>{setEditing(slide);setDraft({eyebrow:slide.eyebrow||'',title:slide.title,subtitle:slide.subtitle||'',image_alt:slide.image_alt||'',primary_cta_label:slide.primary_cta_label||'',primary_cta_url:slide.primary_cta_url||'',secondary_cta_label:slide.secondary_cta_label||'',secondary_cta_url:slide.secondary_cta_url||'',text_position:slide.text_position,theme:slide.theme,overlay_opacity:String(slide.overlay_opacity??20),order:String(slide.order??0),starts_at:localDate(slide.starts_at),ends_at:localDate(slide.ends_at),active:slide.active});setImage(null);setMobileImage(null);setFieldErrors({});setOpen(true)}
  const set=<K extends keyof Draft>(key:K,value:Draft[K])=>setDraft(current=>({...current,[key]:value}))
  const save=async()=>{
    const clientErrors:Record<string,string>={};if(!draft.title.trim())clientErrors.title='Title is required.';if(!editing&&!image)clientErrors.image='Desktop hero image is required.';if(clientErrors.title||clientErrors.image){setFieldErrors(clientErrors);return}
    const body=new FormData();Object.entries(draft).forEach(([key,value])=>{if(key==='starts_at'||key==='ends_at'){if(value)body.append(key,String(value));return}body.append(key,String(value))});if(image)body.append('image',image);if(mobileImage)body.append('mobile_image',mobileImage)
    setSaving(true);setFieldErrors({});try{if(editing)await update({id:editing.id,body}).unwrap();else await create(body).unwrap();dispatch(toast({type:'success',message:editing?'Hero slide updated.':'Hero slide created.'}));setOpen(false)}catch(e){setFieldErrors(apiFieldErrors(e));dispatch(toast({type:'error',message:apiError(e)}))}finally{setSaving(false)}
  }
  const toggle=async(slide:HeroSlide)=>{try{await update({id:slide.id,body:{active:!slide.active}}).unwrap();dispatch(toast({type:'success',message:slide.active?'Hero slide hidden.':'Hero slide activated.'}))}catch(e){dispatch(toast({type:'error',message:apiError(e)}))}}
  const del=async(slide:HeroSlide)=>{if(!confirm(`Delete hero slide “${slide.title}”?`))return;try{await remove(slide.id).unwrap();dispatch(toast({type:'success',message:'Hero slide deleted.'}))}catch(e){dispatch(toast({type:'error',message:apiError(e)}))}}

  return <>
    <PageHeader title="Hero Slider" description="Control the storefront homepage hero campaigns, images, CTAs, order and schedule." actions={<button className="btn-brand" onClick={startAdd}><Plus size={16}/>Add Hero Slide</button>}/>
    {q.isLoading?<LoadingRows/>:q.isError?<ErrorState onRetry={q.refetch}/>:rows.length?<div className="grid gap-5 xl:grid-cols-2">{rows.map(slide=><article key={slide.id} className="panel overflow-hidden"><div className="relative aspect-[16/7] bg-zinc-100"><img src={mediaUrl(slide.image)} alt={slide.image_alt||slide.title} className="h-full w-full object-cover"/><div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-zinc-950/70 to-transparent p-4 text-white"><div><div className="text-xs font-semibold uppercase tracking-[.14em] text-white/75">#{slide.order} {slide.eyebrow}</div><h2 className="mt-1 text-lg font-bold">{slide.title}</h2></div><StatusBadge value={slide.active?'active':'inactive'}/></div></div><div className="p-5"><p className="line-clamp-2 text-sm text-zinc-500">{slide.subtitle||'No subtitle'}</p><div className="mt-4 grid grid-cols-2 gap-3 text-xs text-zinc-500"><div><b className="text-zinc-700">Position:</b> {slide.text_position}</div><div><b className="text-zinc-700">Theme:</b> {slide.theme}</div><div><b className="text-zinc-700">Starts:</b> {date(slide.starts_at)}</div><div><b className="text-zinc-700">Ends:</b> {date(slide.ends_at)}</div></div><div className="mt-5 flex flex-wrap gap-2"><button className="btn-secondary" onClick={()=>startEdit(slide)}><Pencil size={15}/>Edit</button><button className="btn-secondary" onClick={()=>toggle(slide)}>{slide.active?<><EyeOff size={15}/>Hide</>:<><Eye size={15}/>Activate</>}</button><button className="btn-secondary text-red-600" onClick={()=>del(slide)}><Trash2 size={15}/>Delete</button></div></div></article>)}</div>:<EmptyState title="No hero slides" description="Create your first storefront hero campaign." action={<button className="btn-brand" onClick={startAdd}><Plus size={16}/>Add Hero Slide</button>}/>} 

    <Modal open={open} onClose={()=>setOpen(false)} title={editing?'Edit Hero Slide':'Add Hero Slide'} size="xl">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Eyebrow"><Input value={draft.eyebrow} onChange={e=>set('eyebrow',e.target.value)} placeholder="Authentic beauty, curated"/></Field><Field label="Order"><Input type="number" min="0" value={draft.order} onChange={e=>set('order',e.target.value)}/></Field></div>
          <Field label="Title" error={fieldErrors.title}><Input value={draft.title} onChange={e=>set('title',e.target.value)} placeholder="Beauty that works for you."/></Field>
          <Field label="Subtitle"><Textarea value={draft.subtitle} onChange={e=>set('subtitle',e.target.value)} placeholder="Campaign supporting copy…"/></Field>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Primary CTA label"><Input value={draft.primary_cta_label} onChange={e=>set('primary_cta_label',e.target.value)}/></Field><Field label="Primary CTA URL"><Input value={draft.primary_cta_url} onChange={e=>set('primary_cta_url',e.target.value)} placeholder="/products?new_arrival=true"/></Field></div>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Secondary CTA label"><Input value={draft.secondary_cta_label} onChange={e=>set('secondary_cta_label',e.target.value)}/></Field><Field label="Secondary CTA URL"><Input value={draft.secondary_cta_url} onChange={e=>set('secondary_cta_url',e.target.value)} placeholder="/category/skincare"/></Field></div>
          <div className="grid gap-4 sm:grid-cols-3"><Field label="Text position"><Select value={draft.text_position} onChange={e=>set('text_position',e.target.value as Draft['text_position'])}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></Select></Field><Field label="Text theme"><Select value={draft.theme} onChange={e=>set('theme',e.target.value as Draft['theme'])}><option value="dark">Dark text</option><option value="light">Light text</option></Select></Field><Field label="Overlay %"><Input type="number" min="0" max="90" value={draft.overlay_opacity} onChange={e=>set('overlay_opacity',e.target.value)}/></Field></div>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Starts at"><Input type="datetime-local" value={draft.starts_at} onChange={e=>set('starts_at',e.target.value)}/></Field><Field label="Ends at"><Input type="datetime-local" value={draft.ends_at} onChange={e=>set('ends_at',e.target.value)}/></Field></div>
          <Switch checked={draft.active} onChange={value=>set('active',value)} label="Active on storefront"/>
        </div>
        <div className="space-y-4">
          <Field label="Desktop hero image" error={fieldErrors.image} hint="Recommended 1920×900 or wider."><label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 p-5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"><ImagePlus size={18}/>{image?'Replace desktop image':editing?'Replace desktop image':'Choose desktop image'}<input type="file" accept="image/*" className="hidden" onChange={e=>setImage(e.target.files?.[0]||null)}/></label></Field>
          {imagePreview&&<div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100"><img src={imagePreview} alt="Hero preview" className="aspect-[16/8] w-full object-cover"/></div>}
          <Field label="Mobile image" hint="Optional. Recommended portrait crop around 900×1200."><label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 p-4 text-sm font-semibold text-zinc-600 hover:bg-zinc-50"><ImagePlus size={18}/>{mobileImage?'Replace mobile image':'Choose mobile image'}<input type="file" accept="image/*" className="hidden" onChange={e=>setMobileImage(e.target.files?.[0]||null)}/></label></Field>
          {mobilePreview&&<div className="mx-auto max-w-52 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100"><img src={mobilePreview} alt="Mobile hero preview" className="aspect-[3/4] w-full object-cover"/></div>}
          <Field label="Image alt text"><Input value={draft.image_alt} onChange={e=>set('image_alt',e.target.value)} placeholder="Describe the campaign image"/></Field>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2 border-t border-zinc-100 pt-5"><button className="btn-secondary" onClick={()=>setOpen(false)}>Cancel</button><button className="btn-brand" disabled={saving} onClick={save}>{saving?'Saving…':editing?'Save Changes':'Create Hero Slide'}</button></div>
    </Modal>
  </>
}
