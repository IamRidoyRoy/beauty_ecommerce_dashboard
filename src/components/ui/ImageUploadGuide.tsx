import {useEffect,useState} from 'react'
import {CheckCircle2,Image as ImageIcon,TriangleAlert} from 'lucide-react'

type Props={
  width:number
  height:number
  file?:File|null
  maxRecommendedKB?:number
  note?:string
  className?:string
}

type Dimensions={width:number;height:number}|null

export function ImageUploadGuide({width,height,file=null,maxRecommendedKB=200,note,className=''}:Props){
  const [dimensions,setDimensions]=useState<Dimensions>(null)
  useEffect(()=>{
    setDimensions(null)
    if(!file||!file.type.startsWith('image/'))return
    const url=URL.createObjectURL(file)
    const image=new Image()
    image.onload=()=>{setDimensions({width:image.naturalWidth,height:image.naturalHeight});URL.revokeObjectURL(url)}
    image.onerror=()=>URL.revokeObjectURL(url)
    image.src=url
    return()=>URL.revokeObjectURL(url)
  },[file])

  const kb=file?Math.max(1,Math.round(file.size/1024)):0
  const isWebp=file?.type==='image/webp'||file?.name.toLowerCase().endsWith('.webp')
  const sizeOk=!file||kb<=maxRecommendedKB
  const dimensionOk=!file||!dimensions||(dimensions.width===width&&dimensions.height===height)
  const allRecommended=!file||(Boolean(isWebp)&&sizeOk&&dimensionOk)

  return <div className={`rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-3 text-xs leading-5 text-sky-950 ${className}`}>
    <div className="flex items-start gap-2.5"><ImageIcon size={16} className="mt-0.5 shrink-0 text-sky-700"/><div className="min-w-0"><div className="font-semibold">Recommended upload: {width} × {height} px · WebP · ≤ {maxRecommendedKB} KB</div>{note&&<div className="mt-0.5 text-sky-800">{note}</div>}</div></div>
    {file&&<div className={`mt-2.5 flex items-start gap-2 border-t pt-2.5 ${allRecommended?'border-emerald-200 text-emerald-800':'border-amber-200 text-amber-900'}`}>
      {allRecommended?<CheckCircle2 size={15} className="mt-0.5 shrink-0"/>:<TriangleAlert size={15} className="mt-0.5 shrink-0"/>}
      <div><span className="font-semibold">Selected:</span> {dimensions?`${dimensions.width} × ${dimensions.height} px · `:''}{kb} KB · {file.type==='image/webp'?'WebP':(file.type.split('/')[1]||'image').toUpperCase()}
        {!isWebp&&<span> · WebP recommended</span>}
        {!sizeOk&&<span> · compress to ≤ {maxRecommendedKB} KB</span>}
        {!dimensionOk&&dimensions&&<span> · resize to {width} × {height} px for best fit</span>}
      </div>
    </div>}
  </div>
}
