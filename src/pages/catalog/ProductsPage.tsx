import {useRef,useState} from 'react'
import {Link,useNavigate} from 'react-router'
import {Download,FileSpreadsheet,Pencil,Plus,Search,Trash2,Upload,X} from 'lucide-react'
import {PageHeader} from '../../components/ui/PageHeader'
import {DataTable,type Column} from '../../components/ui/DataTable'
import {StatusBadge} from '../../components/ui/StatusBadge'
import {LoadingRows} from '../../components/ui/Loading'
import {ErrorState} from '../../components/ui/ErrorState'
import {EmptyState} from '../../components/ui/EmptyState'
import {Pagination} from '../../components/ui/Pagination'
import {ConfirmDialog} from '../../components/ui/ConfirmDialog'
import {Modal} from '../../components/ui/Modal'
import {useBrandsQuery,useCategoriesQuery,useDeleteProductMutation,useExportProductsMutation,useImportProductsMutation,useProductImportTemplateMutation,useProductsQuery} from '../../services/catalogApi'
import {useDebouncedValue} from '../../hooks/useDebouncedValue'
import {apiError,countOf,rowsOf} from '../../utils/data'
import {money,titleCase} from '../../utils/format'
import type {Product} from '../../types'
import {toast} from '../../features/ui/uiSlice'
import {useAppDispatch} from '../../store/hooks'

type ImportResult={created:number;updated:number;variants_created:number;variants_updated:number;skipped:number;errors:Array<{sheet?:string;row:number;error:string}>}

const saveBlob=(blob:Blob,filename:string)=>{
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove()
  window.setTimeout(()=>URL.revokeObjectURL(url),1000)
}

export default function ProductsPage(){
  const nav=useNavigate(),dispatch=useAppDispatch(); const [page,setPage]=useState(1),[search,setSearch]=useState(''),[type,setType]=useState(''),[status,setStatus]=useState(''),[brand,setBrand]=useState(''),[category,setCategory]=useState(''),[del,setDel]=useState<Product|null>(null)
  const [bulkOpen,setBulkOpen]=useState(false),[bulkFile,setBulkFile]=useState<File|null>(null),[result,setResult]=useState<ImportResult|null>(null);const fileRef=useRef<HTMLInputElement|null>(null)
  const debounced=useDebouncedValue(search); const q=useProductsQuery({page,search:debounced||undefined,product_type:type||undefined,status:status||undefined,brand:brand||undefined,category:category||undefined,ordering:'-id'}); const brands=useBrandsQuery({page_size:100}),categories=useCategoriesQuery({page_size:100}); const [remove,{isLoading:deleting}]=useDeleteProductMutation()
  const [importProducts,{isLoading:importing}]=useImportProductsMutation(),[downloadTemplate,{isLoading:templateLoading}]=useProductImportTemplateMutation(),[exportProducts,{isLoading:exporting}]=useExportProductsMutation()
  const rows=rowsOf<Product>(q.data),count=countOf(q.data),reset=()=>{setSearch('');setType('');setStatus('');setBrand('');setCategory('');setPage(1)}
  const columns:Column<Product>[]=[
    {key:'product',header:'Product',render:p=><div className="min-w-60"><div className="font-semibold text-zinc-900">{p.name}</div><div className="mt-0.5 text-xs text-zinc-400">{p.sku||'Variant SKUs'} · {titleCase(p.product_type)}</div></div>},
    {key:'brand',header:'Brand',render:p=>typeof p.brand==='object'?p.brand.name:String(p.brand||'—')},
    {key:'category',header:'Category',render:p=>typeof p.category==='object'?p.category.name:String(p.category||'—')},
    {key:'price',header:'Price',render:p=><b>{money(p.base_price)}</b>},
    {key:'status',header:'Status',render:p=><StatusBadge value={p.status}/>},
    {key:'flags',header:'Merchandising',render:p=><div className="flex flex-wrap gap-1">{p.featured&&<span className="badge bg-pink-50 text-pink-700">Featured</span>}{p.new_arrival&&<span className="badge bg-blue-50 text-blue-700">New</span>}{p.bestseller&&<span className="badge bg-amber-50 text-amber-700">Best</span>}</div>},
    {key:'actions',header:'Actions',render:p=><div className="flex items-center gap-1" onClick={e=>e.stopPropagation()}><button className="btn-secondary px-3 py-2" onClick={()=>nav(`/catalog/products/${p.id}/edit`)}><Pencil size={14}/>Edit</button><button title="Delete" className="rounded-lg p-2 text-red-500 hover:bg-red-50" onClick={()=>setDel(p)}><Trash2 size={16}/></button></div>},
  ]
  const doTemplate=async()=>{try{const blob=await downloadTemplate().unwrap();saveBlob(blob,'product_import_template.xlsx')}catch(e){dispatch(toast({type:'error',message:apiError(e)}))}}
  const doExport=async()=>{try{const blob=await exportProducts().unwrap();saveBlob(blob,`products_export_${new Date().toISOString().slice(0,10)}.xlsx`);dispatch(toast({type:'success',message:'All product data exported.'}))}catch(e){dispatch(toast({type:'error',message:apiError(e)}))}}
  const doImport=async()=>{if(!bulkFile)return;const fd=new FormData();fd.append('file',bulkFile);try{const data=await importProducts(fd).unwrap();setResult(data);setBulkFile(null);if(fileRef.current)fileRef.current.value='';q.refetch();dispatch(toast({type:data.skipped?'info':'success',message:`Import complete: ${data.created||0} created, ${data.updated||0} updated, ${data.skipped||0} skipped.`}))}catch(e){dispatch(toast({type:'error',message:apiError(e)}))}}
  return <>
    <PageHeader title="Products" description="Search, filter, create, bulk upload and export simple or variable products." actions={<>
      <button className="btn-secondary" onClick={()=>setBulkOpen(true)}><Upload size={16}/>Bulk Upload</button>
      <button className="btn-secondary" disabled={exporting} onClick={doExport}><Download size={16}/>{exporting?'Exporting…':'Export All'}</button>
      <Link className="btn-secondary" to="/catalog/variants">Manage Variants</Link>
      <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-pink-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-pink-200 ring-2 ring-pink-100 transition hover:-translate-y-0.5 hover:bg-pink-700 focus:outline-none focus:ring-4 focus:ring-pink-200" to="/catalog/products/new"><Plus size={18} strokeWidth={2.5}/>Create Product</Link>
    </>}/>
    <div className="panel mb-4 grid gap-2 p-3 md:grid-cols-2 xl:grid-cols-6">
      <label className="relative xl:col-span-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={17}/><input className="input pl-9" placeholder="Product, SKU or barcode" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/></label>
      <select className="input" value={brand} onChange={e=>{setBrand(e.target.value);setPage(1)}}><option value="">All brands</option>{rowsOf<any>(brands.data).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
      <select className="input" value={category} onChange={e=>{setCategory(e.target.value);setPage(1)}}><option value="">All categories</option>{rowsOf<any>(categories.data).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
      <select className="input" value={type} onChange={e=>{setType(e.target.value);setPage(1)}}><option value="">All types</option><option value="simple">Simple</option><option value="variable">Variable</option></select>
      <div className="flex gap-2"><select className="input" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">All statuses</option><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select><button title="Clear filters" className="btn-secondary px-3" onClick={reset}><X size={16}/></button></div>
    </div>
    {q.isLoading?<LoadingRows/>:q.isError?<ErrorState onRetry={q.refetch}/>:rows.length?<><DataTable rows={rows} columns={columns} getKey={r=>r.id} onRowClick={r=>nav(`/catalog/products/${r.id}/edit`)}/><Pagination count={count} page={page} onPage={setPage}/></>:<EmptyState title="No products found" description="Change the filters or create a product." action={<Link className="btn-brand" to="/catalog/products/new">Create Product</Link>}/>} 
    <Modal open={bulkOpen} onClose={()=>setBulkOpen(false)} title="Bulk Product Upload" size="lg"><div className="space-y-5">
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900"><div className="flex items-start gap-3"><FileSpreadsheet className="mt-0.5 shrink-0" size={20}/><div><b>Excel create + update workflow</b><p className="mt-1 text-blue-800">Download the template, keep its headers unchanged, then upload the completed .xlsx file. Existing products are updated using Product ID/SKU; new rows are created. Variable-product variants can be managed from the Variants sheet.</p></div></div></div>
      <div className="grid gap-3 sm:grid-cols-2"><button className="btn-secondary justify-center py-3" disabled={templateLoading} onClick={doTemplate}><Download size={17}/>{templateLoading?'Preparing…':'Download Excel Template'}</button><button className="btn-secondary justify-center py-3" disabled={exporting} onClick={doExport}><Download size={17}/>{exporting?'Exporting…':'Download Existing Products'}</button></div>
      <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-zinc-200 p-7 text-center transition hover:border-pink-300 hover:bg-pink-50/40"><Upload className="mx-auto text-pink-600" size={28}/><b className="mt-3 block">{bulkFile?bulkFile.name:'Choose Excel file'}</b><span className="mt-1 block text-sm text-zinc-500">.xlsx recommended · .csv supported for Products-only imports</span><input ref={fileRef} type="file" className="hidden" accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" onChange={e=>setBulkFile(e.target.files?.[0]||null)}/></label>
      <button disabled={!bulkFile||importing} className="btn-brand w-full justify-center py-3 text-sm font-semibold" onClick={doImport}><Upload size={17}/>{importing?'Importing products…':'Upload & Import Products'}</button>
      <p className="text-xs leading-5 text-zinc-500">Images are intentionally excluded from Excel import. Existing image data is included in the export workbook for reference, while product image uploads remain under Catalog → Product Images.</p>
    </div></Modal>
    <Modal open={!!result} onClose={()=>setResult(null)} title="Product Import Result" size="lg">{result&&<div className="space-y-5"><div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{[['Products created',result.created,'emerald'],['Products updated',result.updated,'blue'],['Variants created',result.variants_created,'violet'],['Variants updated',result.variants_updated,'indigo'],['Skipped',result.skipped,'red']].map(([label,value,tone])=><div key={String(label)} className={`rounded-xl border p-3 ${tone==='red'?'border-red-100 bg-red-50':tone==='emerald'?'border-emerald-100 bg-emerald-50':'border-zinc-100 bg-zinc-50'}`}><div className="text-xs text-zinc-500">{label}</div><div className="mt-1 text-xl font-bold">{value}</div></div>)}</div>{result.errors?.length>0&&<div><h3 className="mb-2 font-semibold text-zinc-900">Rows that need attention</h3><div className="max-h-80 space-y-2 overflow-auto">{result.errors.map((e,i)=><div key={`${e.sheet}-${e.row}-${i}`} className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm"><b>{e.sheet||'Products'} · Row {e.row}</b><div className="mt-1 text-red-700">{e.error}</div></div>)}</div></div>}</div>}</Modal>
    <ConfirmDialog open={!!del} onClose={()=>setDel(null)} danger busy={deleting} title="Delete product?" message={del?`Delete ${del.name}?`:''} onConfirm={async()=>{if(!del)return;try{await remove(del.id).unwrap();setDel(null);dispatch(toast({type:'success',message:'Product deleted.'}))}catch{dispatch(toast({type:'error',message:'Product could not be deleted.'}))}}}/>
  </>
}
