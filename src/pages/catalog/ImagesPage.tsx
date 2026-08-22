import {useEffect,useState} from 'react'
import {ChevronDown,ChevronUp,Star,Trash2} from 'lucide-react'
import {PageHeader} from '../../components/ui/PageHeader'
import {EmptyState} from '../../components/ui/EmptyState'
import {LoadingRows} from '../../components/ui/Loading'
import {ImageUploadPicker} from '../../components/ui/ImageUploadPicker'
import {useProductsQuery,useVariantsQuery,useImagesQuery,useUploadImagesMutation,useUpdateImageMutation,useDeleteImageMutation,useSetPrimaryMutation,useReorderImagesMutation} from '../../services/catalogApi'
import {rowsOf,apiError} from '../../utils/data'
import {useAppDispatch} from '../../store/hooks'
import {toast} from '../../features/ui/uiSlice'
import {mediaUrl} from '../../utils/media'

export default function ImagesPage(){
  const dispatch=useAppDispatch()
  const products=useProductsQuery({page_size:200})
  const [product,setProduct]=useState('')
  const variants=useVariantsQuery(product?{product:Number(product)}:{},{skip:!product})
  const [variant,setVariant]=useState('')
  const images=useImagesQuery(product?{product:Number(product),variant:variant?Number(variant):undefined}:undefined,{skip:!product})
  const [upload]=useUploadImagesMutation();const [update]=useUpdateImageMutation();const [remove]=useDeleteImageMutation();const [primary]=useSetPrimaryMutation();const [reorder]=useReorderImagesMutation()
  const [files,setFiles]=useState<File[]>([]);const [primaryUploadIndex,setPrimaryUploadIndex]=useState(0);const [uploading,setUploading]=useState(false)

  useEffect(()=>{setVariant('');setFiles([]);setPrimaryUploadIndex(0)},[product])
  useEffect(()=>{setFiles([]);setPrimaryUploadIndex(0)},[variant])

  const allImages=rowsOf<any>(images.data)
  const rows=variant?allImages.filter((x:any)=>Number(x.variant)===Number(variant)):allImages.filter((x:any)=>!x.variant)
  const ps=rowsOf<any>(products.data),vs=rowsOf<any>(variants.data)

  const move=async(i:number,dir:-1|1)=>{const arr=[...rows],j=i+dir;if(j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];try{await reorder({product:Number(product),image_ids:arr.map(x=>x.id)}).unwrap()}catch(e){dispatch(toast({type:'error',message:apiError(e)}))}}
  const doUpload=async()=>{if(!product||!files.length)return;const fd=new FormData();fd.append('product',product);if(variant)fd.append('variant',variant);fd.append('primary_index',String(primaryUploadIndex));files.forEach(f=>fd.append('images',f));setUploading(true);try{await upload(fd).unwrap();setFiles([]);setPrimaryUploadIndex(0);dispatch(toast({type:'success',message:`${files.length} image(s) uploaded. Feature image saved.`}))}catch(e){dispatch(toast({type:'error',message:apiError(e)}))}finally{setUploading(false)}}
  const setFeature=async(id:number)=>{try{await primary(id).unwrap();dispatch(toast({type:'success',message:variant?'Variant primary image updated.':'Feature image updated.'}))}catch(e){dispatch(toast({type:'error',message:apiError(e)}))}}
  const deleteImage=async(id:number)=>{if(!confirm('Delete this image?'))return;try{await remove(id).unwrap();dispatch(toast({type:'success',message:'Image deleted.'}))}catch(e){dispatch(toast({type:'error',message:apiError(e)}))}}

  return <>
    <PageHeader title="Product Images" description="Upload multiple product images, choose one Feature Image, reorder galleries and manage variant-specific imagery."/>
    <div className="panel mb-5 grid gap-4 p-5 md:grid-cols-2">
      <label><span className="label">Product</span><select className="input" value={product} onChange={e=>setProduct(e.target.value)}><option value="">Select product</option>{ps.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      <label><span className="label">Gallery scope</span><select className="input" value={variant} onChange={e=>setVariant(e.target.value)} disabled={!product}><option value="">Base product gallery</option>{vs.map(x=><option key={x.id} value={x.id}>Variant — {x.sku}</option>)}</select></label>
    </div>

    {!product?<EmptyState title="Choose a product" description="Select a product to upload its gallery and Feature Image."/>:<div className="space-y-6">
      <div className="panel p-5">
        <div className="mb-4"><h3 className="font-semibold">{variant?'Variant gallery':'Product gallery'}</h3><p className="mt-1 text-sm text-zinc-500">{variant?'Choose a primary image for this variant. It replaces the product gallery when the customer selects this variant.':'The Feature Image is used first on the customer storefront and product cards.'}</p></div>
        <ImageUploadPicker files={files} onFilesChange={setFiles} primaryIndex={primaryUploadIndex} onPrimaryIndexChange={setPrimaryUploadIndex}/>
        {files.length>0&&<div className="mt-5 flex justify-end"><button type="button" onClick={doUpload} disabled={uploading} className="btn-brand">{uploading?'Uploading…':`Upload ${files.length} image(s)`}</button></div>}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Current images</h3><span className="text-sm text-zinc-500">{rows.length} image(s)</span></div>
        {images.isLoading?<LoadingRows/>:rows.length?<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{rows.map((x,i)=><article key={x.id} className={`panel overflow-hidden ${x.is_primary?'ring-2 ring-amber-300':''}`}><div className="relative aspect-square bg-zinc-100"><img src={mediaUrl(x.image)} alt={x.alt_text||''} className="h-full w-full object-cover"/>{x.is_primary&&<span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[11px] font-bold text-amber-950"><Star size={12} className="fill-current"/>{variant?'PRIMARY':'FEATURE'}</span>}</div><div className="space-y-3 p-4"><div className="flex items-center justify-between"><select className="input py-2" value={x.image_type} onChange={e=>update({id:x.id,body:{image_type:e.target.value}})}>{['gallery','detail','swatch','lifestyle'].map(t=><option key={t} value={t}>{t}</option>)}</select></div><input className="input" defaultValue={x.alt_text} placeholder="Alt text" onBlur={e=>update({id:x.id,body:{alt_text:e.target.value}})}/><button type="button" className={`w-full rounded-lg border px-3 py-2 text-xs font-semibold ${x.is_primary?'border-amber-300 bg-amber-50 text-amber-800':'border-zinc-200 hover:bg-zinc-50'}`} onClick={()=>setFeature(x.id)}><Star size={14} className={`mr-1 inline ${x.is_primary?'fill-current':''}`}/>{x.is_primary?(variant?'Variant Primary':'Feature Image'):(variant?'Set as Variant Primary':'Set as Feature Image')}</button><div className="flex gap-2"><button type="button" className="btn-secondary flex-1 px-3" disabled={i===0} onClick={()=>move(i,-1)}><ChevronUp size={15}/></button><button type="button" className="btn-secondary flex-1 px-3" disabled={i===rows.length-1} onClick={()=>move(i,1)}><ChevronDown size={15}/></button><button type="button" className="btn-secondary px-3 text-red-600" onClick={()=>deleteImage(x.id)}><Trash2 size={15}/></button></div></div></article>)}</div>:<EmptyState title="No images yet" description="Upload multiple images above and select one Feature Image."/>}
      </div>
    </div>}
  </>
}
