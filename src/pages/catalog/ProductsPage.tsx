import {useRef,useState} from 'react'
import {Link,useNavigate} from 'react-router'
import {FileSpreadsheet,ImageIcon,Pencil,Plus,Search,Trash2,Upload,X} from 'lucide-react'
import {PageHeader} from '../../components/ui/PageHeader'
import {DataTable,type Column} from '../../components/ui/DataTable'
import {StatusBadge} from '../../components/ui/StatusBadge'
import {LoadingRows} from '../../components/ui/Loading'
import {ErrorState} from '../../components/ui/ErrorState'
import {EmptyState} from '../../components/ui/EmptyState'
import {Pagination} from '../../components/ui/Pagination'
import {ConfirmDialog} from '../../components/ui/ConfirmDialog'
import {Modal} from '../../components/ui/Modal'
import {useBrandsQuery,useCategoriesQuery,useDeleteProductMutation,useImportProductsMutation,useProductsQuery} from '../../services/catalogApi'
import {useDebouncedValue} from '../../hooks/useDebouncedValue'
import {apiError,countOf,rowsOf} from '../../utils/data'
import {money,titleCase} from '../../utils/format'
import {mediaUrl} from '../../utils/media'
import type {Product} from '../../types'
import {toast} from '../../features/ui/uiSlice'
import {useAppDispatch} from '../../store/hooks'

const template=`name,product_type,sku,brand,category,base_price,compare_at_price,cost_price,barcode,weight,status,short_description,description,featured,new_arrival,bestseller,trending
CeraVe Foaming Cleanser 236ml,simple,CERAVE-236,CeraVe,Skincare,1850,2127.50,1200,,0.236,draft,Daily cleanser,Demo description,false,true,false,false
Maybelline Fit Me Foundation,variable,,Maybelline,Makeup,1200,,700,,,draft,Foundation with shades,Create variants after import,false,true,false,false
`

export default function ProductsPage(){
  const nav=useNavigate(),dispatch=useAppDispatch(),fileRef=useRef<HTMLInputElement>(null); const [page,setPage]=useState(1),[search,setSearch]=useState(''),[type,setType]=useState(''),[status,setStatus]=useState(''),[brand,setBrand]=useState(''),[category,setCategory]=useState(''),[del,setDel]=useState<Product|null>(null),[importOpen,setImportOpen]=useState(false),[file,setFile]=useState<File|null>(null),[importResult,setImportResult]=useState<any>(null)
  const debounced=useDebouncedValue(search); const q=useProductsQuery({page,search:debounced||undefined,product_type:type||undefined,status:status||undefined,brand:brand||undefined,category:category||undefined,ordering:'-id'}); const brands=useBrandsQuery({page_size:100}),categories=useCategoriesQuery({page_size:100}); const [remove,{isLoading:deleting}]=useDeleteProductMutation(); const [importProducts,{isLoading:importing}]=useImportProductsMutation()
  const rows=rowsOf<Product>(q.data),count=countOf(q.data),reset=()=>{setSearch('');setType('');setStatus('');setBrand('');setCategory('');setPage(1)}
  const picture=(p:Product)=>p.images?.find(x=>x.is_primary&&!x.variant)?.image||p.images?.find(x=>!x.variant)?.image||p.images?.[0]?.image
  const downloadTemplate=()=>{const url=URL.createObjectURL(new Blob([template],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='beauty-products-import-template.csv';a.click();URL.revokeObjectURL(url)}
  const doImport=async()=>{if(!file)return;const body=new FormData();body.append('file',file);try{const result=await importProducts(body).unwrap();setImportResult(result);dispatch(toast({type:'success',message:`Product import complete: ${result.created||0} created.`}));q.refetch()}catch(e){dispatch(toast({type:'error',message:apiError(e)}))}}
  const columns:Column<Product>[]=[
    {key:'product',header:'Product',render:p=><div className="flex min-w-72 items-center gap-3">{picture(p)?<img src={mediaUrl(picture(p))} alt={p.name} className="h-12 w-12 rounded-xl border border-zinc-200 object-cover"/>:<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400"><ImageIcon size={18}/></div>}<div><div className="font-semibold text-zinc-900">{p.name}</div><div className="mt-0.5 text-xs text-zinc-400">{p.sku||'Variant SKUs'} · {titleCase(p.product_type)}</div></div></div>},
    {key:'brand',header:'Brand',render:p=>typeof p.brand==='object'?p.brand.name:String(p.brand||'—')},
    {key:'category',header:'Category',render:p=>typeof p.category==='object'?p.category.name:String(p.category||'—')},
    {key:'price',header:'Price',render:p=><b>{money(p.base_price)}</b>},
    {key:'status',header:'Status',render:p=><StatusBadge value={p.status}/>},
    {key:'flags',header:'Merchandising',render:p=><div className="flex flex-wrap gap-1">{p.featured&&<span className="badge bg-pink-50 text-pink-700">Featured</span>}{p.new_arrival&&<span className="badge bg-blue-50 text-blue-700">New</span>}{p.bestseller&&<span className="badge bg-amber-50 text-amber-700">Best</span>}</div>},
    {key:'actions',header:'Actions',render:p=><div className="flex items-center gap-1" onClick={e=>e.stopPropagation()}><button className="btn-secondary px-3 py-2" onClick={()=>nav(`/catalog/products/${p.id}/edit`)}><Pencil size={14}/>Edit</button><button title="Delete" className="rounded-lg p-2 text-red-500 hover:bg-red-50" onClick={()=>setDel(p)}><Trash2 size={16}/></button></div>},
  ]
  return <>
    <PageHeader title="Products" description="Search, filter, bulk import, create and edit native simple or variable products." actions={<><button className="btn-secondary" onClick={()=>{setImportResult(null);setFile(null);setImportOpen(true)}}><Upload size={16}/>Import CSV/XLSX</button><Link className="btn-secondary" to="/catalog/variants">Manage Variants</Link><Link className="btn-brand" to="/catalog/products/new"><Plus size={17}/>Create Product</Link></>}/>
    <div className="panel mb-4 grid gap-2 p-3 md:grid-cols-2 xl:grid-cols-6">
      <label className="relative xl:col-span-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={17}/><input className="input pl-9" placeholder="Product, SKU or barcode" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/></label>
      <select className="input" value={brand} onChange={e=>{setBrand(e.target.value);setPage(1)}}><option value="">All brands</option>{rowsOf<any>(brands.data).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
      <select className="input" value={category} onChange={e=>{setCategory(e.target.value);setPage(1)}}><option value="">All categories</option>{rowsOf<any>(categories.data).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
      <select className="input" value={type} onChange={e=>{setType(e.target.value);setPage(1)}}><option value="">All types</option><option value="simple">Simple</option><option value="variable">Variable</option></select>
      <div className="flex gap-2"><select className="input" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">All statuses</option><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select><button title="Clear filters" className="btn-secondary px-3" onClick={reset}><X size={16}/></button></div>
    </div>
    {q.isLoading?<LoadingRows/>:q.isError?<ErrorState onRetry={q.refetch}/>:rows.length?<><DataTable rows={rows} columns={columns} getKey={r=>r.id} onRowClick={r=>nav(`/catalog/products/${r.id}/edit`)}/><Pagination count={count} page={page} onPage={setPage}/></>:<EmptyState title="No products found" description="Change the filters or create/import products." action={<Link className="btn-brand" to="/catalog/products/new">Create Product</Link>}/>} 
    <Modal open={importOpen} onClose={()=>setImportOpen(false)} title="Import Products"><div className="space-y-4"><div className="rounded-xl border border-dashed border-zinc-300 p-6 text-center"><FileSpreadsheet className="mx-auto text-zinc-400"/><p className="mt-2 text-sm font-semibold">CSV or XLSX product file</p><p className="mt-1 text-xs text-zinc-500">Simple products require SKU. Variable products are imported as draft and variants can be generated afterward.</p><input ref={fileRef} className="hidden" type="file" accept=".csv,.xlsx" onChange={e=>setFile(e.target.files?.[0]||null)}/><button className="btn-secondary mt-4" onClick={()=>fileRef.current?.click()}>Choose file</button>{file&&<div className="mt-2 text-sm text-zinc-600">{file.name}</div>}</div><div className="flex flex-wrap gap-2"><button className="btn-secondary" onClick={downloadTemplate}>Download CSV Template</button><button className="btn-brand ml-auto" disabled={!file||importing} onClick={doImport}>{importing?'Importing…':'Import Products'}</button></div>{importResult&&<div className="rounded-xl bg-zinc-50 p-4 text-sm"><b>Import result</b><div className="mt-2">Created: {importResult.created||0} · Skipped: {importResult.skipped||0} · Errors: {importResult.errors?.length||0}</div>{importResult.errors?.length>0&&<div className="mt-2 max-h-48 overflow-auto text-xs text-red-600">{importResult.errors.map((x:any,i:number)=><div key={i}>Row {x.row}: {x.error}</div>)}</div>}</div>}</div></Modal>
    <ConfirmDialog open={!!del} onClose={()=>setDel(null)} danger busy={deleting} title="Delete product?" message={del?`Delete ${del.name}?`:''} onConfirm={async()=>{if(!del)return;try{await remove(del.id).unwrap();setDel(null);dispatch(toast({type:'success',message:'Product deleted.'}))}catch{dispatch(toast({type:'error',message:'Product could not be deleted.'}))}}}/>
  </>
}
