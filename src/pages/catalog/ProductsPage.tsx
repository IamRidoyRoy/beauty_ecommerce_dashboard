import {useState} from 'react'
import {Link,useNavigate} from 'react-router'
import {Pencil,Plus,Search,Trash2,X} from 'lucide-react'
import {PageHeader} from '../../components/ui/PageHeader'
import {DataTable,type Column} from '../../components/ui/DataTable'
import {StatusBadge} from '../../components/ui/StatusBadge'
import {LoadingRows} from '../../components/ui/Loading'
import {ErrorState} from '../../components/ui/ErrorState'
import {EmptyState} from '../../components/ui/EmptyState'
import {Pagination} from '../../components/ui/Pagination'
import {ConfirmDialog} from '../../components/ui/ConfirmDialog'
import {useBrandsQuery,useCategoriesQuery,useDeleteProductMutation,useProductsQuery} from '../../services/catalogApi'
import {useDebouncedValue} from '../../hooks/useDebouncedValue'
import {countOf,rowsOf} from '../../utils/data'
import {money,titleCase} from '../../utils/format'
import type {Product} from '../../types'
import {toast} from '../../features/ui/uiSlice'
import {useAppDispatch} from '../../store/hooks'

export default function ProductsPage(){
  const nav=useNavigate(),dispatch=useAppDispatch(); const [page,setPage]=useState(1),[search,setSearch]=useState(''),[type,setType]=useState(''),[status,setStatus]=useState(''),[brand,setBrand]=useState(''),[category,setCategory]=useState(''),[del,setDel]=useState<Product|null>(null)
  const debounced=useDebouncedValue(search); const q=useProductsQuery({page,search:debounced||undefined,product_type:type||undefined,status:status||undefined,brand:brand||undefined,category:category||undefined,ordering:'-id'}); const brands=useBrandsQuery({page_size:100}),categories=useCategoriesQuery({page_size:100}); const [remove,{isLoading:deleting}]=useDeleteProductMutation()
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
  return <>
    <PageHeader title="Products" description="Search, filter, create and edit native simple or variable products." actions={<><Link className="btn-secondary" to="/catalog/variants">Manage Variants</Link><Link className="btn-brand" to="/catalog/products/new"><Plus size={17}/>Create Product</Link></>}/>
    <div className="panel mb-4 grid gap-2 p-3 md:grid-cols-2 xl:grid-cols-6">
      <label className="relative xl:col-span-2"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={17}/><input className="input pl-9" placeholder="Product, SKU or barcode" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/></label>
      <select className="input" value={brand} onChange={e=>{setBrand(e.target.value);setPage(1)}}><option value="">All brands</option>{rowsOf<any>(brands.data).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
      <select className="input" value={category} onChange={e=>{setCategory(e.target.value);setPage(1)}}><option value="">All categories</option>{rowsOf<any>(categories.data).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select>
      <select className="input" value={type} onChange={e=>{setType(e.target.value);setPage(1)}}><option value="">All types</option><option value="simple">Simple</option><option value="variable">Variable</option></select>
      <div className="flex gap-2"><select className="input" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">All statuses</option><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select><button title="Clear filters" className="btn-secondary px-3" onClick={reset}><X size={16}/></button></div>
    </div>
    {q.isLoading?<LoadingRows/>:q.isError?<ErrorState onRetry={q.refetch}/>:rows.length?<><DataTable rows={rows} columns={columns} getKey={r=>r.id} onRowClick={r=>nav(`/catalog/products/${r.id}/edit`)}/><Pagination count={count} page={page} onPage={setPage}/></>:<EmptyState title="No products found" description="Change the filters or create a product." action={<Link className="btn-brand" to="/catalog/products/new">Create Product</Link>}/>} 
    <ConfirmDialog open={!!del} onClose={()=>setDel(null)} danger busy={deleting} title="Delete product?" message={del?`Delete ${del.name}?`:''} onConfirm={async()=>{if(!del)return;try{await remove(del.id).unwrap();setDel(null);dispatch(toast({type:'success',message:'Product deleted.'}))}catch{dispatch(toast({type:'error',message:'Product could not be deleted.'}))}}}/>
  </>
}
