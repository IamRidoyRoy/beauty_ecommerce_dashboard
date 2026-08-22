import {useState} from 'react'
import {useNavigate} from 'react-router'
import {Search} from 'lucide-react'
import {PageHeader} from '../../components/ui/PageHeader'
import {DataTable,type Column} from '../../components/ui/DataTable'
import {StatusBadge} from '../../components/ui/StatusBadge'
import {Pagination} from '../../components/ui/Pagination'
import {LoadingRows} from '../../components/ui/Loading'
import {ErrorState} from '../../components/ui/ErrorState'
import {useCustomersQuery} from '../../services/customerApi'
import {rowsOf,countOf} from '../../utils/data'
import {money,date} from '../../utils/format'
import {useDebouncedValue} from '../../hooks/useDebouncedValue'

export default function CustomersPage(){
 const nav=useNavigate(),[page,setPage]=useState(1),[search,setSearch]=useState(''),[status,setStatus]=useState('')
 const debounced=useDebouncedValue(search,300)
 const q=useCustomersQuery({page,page_size:50,search:debounced||undefined,is_active:status===''?undefined:status})
 const cols:Column<any>[]=[{key:'customer',header:'Customer',render:r=><div><b>{r.full_name||'Unnamed Customer'}</b><div className="text-xs text-zinc-400">{r.phone} · {r.email||'No email'}</div></div>},{key:'orders',header:'Orders',render:r=>r.orders_count??0},{key:'ltv',header:'Lifetime Spend',render:r=><b>{money(r.lifetime_spend)}</b>},{key:'aov',header:'Average Order',render:r=>money(r.average_order)},{key:'last',header:'Last Order',render:r=>r.last_order?date(r.last_order):'—'},{key:'status',header:'Status',render:r=><StatusBadge value={r.is_active?'active':'inactive'}/>},{key:'joined',header:'Joined',render:r=>date(r.created_at)}]
 return <><PageHeader title="Customers" description="Search and filter customer value, order history and account state."/><div className="mb-4 grid max-w-3xl gap-2 md:grid-cols-[1fr_220px]"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16}/><input className="input pl-9" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Name, phone or email"/></div><select className="input" value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}}><option value="">All customers</option><option value="true">Active</option><option value="false">Inactive</option></select></div>{q.isLoading?<LoadingRows/>:q.isError?<ErrorState onRetry={()=>q.refetch()}/>:<><DataTable rows={rowsOf<any>(q.data)} columns={cols} getKey={r=>r.id} onRowClick={r=>nav(`/customers/${r.id}`)}/><Pagination count={countOf(q.data)} page={page} onPage={setPage}/></>}</>}
