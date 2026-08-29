import {useEffect,useMemo,useRef} from 'react'
import {ChevronLeft,ChevronRight,ImagePlus,Star,Trash2,Upload} from 'lucide-react'
import {ImageUploadGuide} from './ImageUploadGuide'

type Props={
  files:File[]
  onFilesChange:(files:File[])=>void
  primaryIndex:number
  onPrimaryIndexChange:(index:number)=>void
  title?:string
  description?:string
}

export function ImageUploadPicker({files,onFilesChange,primaryIndex,onPrimaryIndexChange,title='Upload product gallery',description='Upload multiple JPG, PNG or WebP images. Choose exactly one Feature Image.'}:Props){
  const inputRef=useRef<HTMLInputElement>(null)
  const previews=useMemo(()=>files.map(file=>({file,url:URL.createObjectURL(file)})),[files])
  useEffect(()=>()=>previews.forEach(x=>URL.revokeObjectURL(x.url)),[previews])

  const add=(incoming:File[])=>{
    const images=incoming.filter(file=>file.type.startsWith('image/'))
    if(!images.length)return
    const next=[...files,...images]
    onFilesChange(next)
    if(files.length===0)onPrimaryIndexChange(0)
  }
  const remove=(index:number)=>{
    const next=files.filter((_,i)=>i!==index)
    onFilesChange(next)
    if(!next.length){onPrimaryIndexChange(0);return}
    if(index===primaryIndex)onPrimaryIndexChange(Math.min(index,next.length-1))
    else if(index<primaryIndex)onPrimaryIndexChange(primaryIndex-1)
  }
  const move=(index:number,dir:-1|1)=>{
    const target=index+dir
    if(target<0||target>=files.length)return
    const next=[...files];[next[index],next[target]]=[next[target],next[index]];onFilesChange(next)
    if(primaryIndex===index)onPrimaryIndexChange(target)
    else if(primaryIndex===target)onPrimaryIndexChange(index)
  }

  return <div className="space-y-5">
    <button type="button" onClick={()=>inputRef.current?.click()} className="flex min-h-52 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-8 text-center transition hover:border-pink-300 hover:bg-pink-50/30">
      <Upload className="mb-3 text-zinc-400"/>
      <b>{title}</b>
      <span className="mt-1 text-sm text-zinc-500">{description}</span>
      <span className="mt-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-zinc-600 shadow-sm">Select multiple images</span>
    </button>
    <ImageUploadGuide width={600} height={600} note="Use square product images for consistent storefront cards and galleries."/>
    <input ref={inputRef} multiple accept="image/jpeg,image/png,image/webp,image/gif" type="file" className="hidden" onChange={e=>{add(Array.from(e.target.files||[]));e.currentTarget.value=''}}/>

    {files.length>0&&<>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <div className="flex items-center gap-2"><Star size={16} className="fill-amber-400 text-amber-500"/><span><b>Feature Image:</b> this image is used on storefront product cards and opens first in the product gallery.</span></div>
        <button type="button" className="btn-secondary py-1.5" onClick={()=>inputRef.current?.click()}><ImagePlus size={15}/>Add more</button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {previews.map(({file,url},i)=>{const feature=i===primaryIndex;return <article key={`${file.name}-${file.lastModified}-${i}`} className={`overflow-hidden rounded-2xl border bg-white ${feature?'border-amber-400 ring-2 ring-amber-100':'border-zinc-200'}`}>
          <div className="relative aspect-square bg-zinc-100"><img src={url} alt={file.name} className="h-full w-full object-cover"/>{feature&&<span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-amber-950"><Star size={12} className="fill-current"/>FEATURE</span>}</div>
          <div className="space-y-3 p-3">
            <div><b className="block truncate text-sm">{file.name}</b><span className="text-xs text-zinc-400">{Math.max(1,Math.round(file.size/1024))} KB</span></div>
            <button type="button" onClick={()=>onPrimaryIndexChange(i)} className={`w-full rounded-lg border px-3 py-2 text-xs font-semibold ${feature?'border-amber-300 bg-amber-50 text-amber-800':'border-zinc-200 hover:bg-zinc-50'}`}><Star size={14} className={`mr-1 inline ${feature?'fill-current':''}`}/>{feature?'Feature Image':'Set as Feature'}</button>
            <div className="flex gap-2"><button type="button" title="Move left" className="btn-secondary flex-1 px-2 py-2" disabled={i===0} onClick={()=>move(i,-1)}><ChevronLeft size={15}/></button><button type="button" title="Move right" className="btn-secondary flex-1 px-2 py-2" disabled={i===files.length-1} onClick={()=>move(i,1)}><ChevronRight size={15}/></button><button type="button" title="Remove" className="btn-secondary px-3 py-2 text-red-600" onClick={()=>remove(i)}><Trash2 size={15}/></button></div>
          </div>
        </article>})}
      </div>
    </>}
  </div>
}
