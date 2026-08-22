import {Boxes,Clock,DollarSign,PackageX,RotateCcw,ShoppingBag,ShoppingBasket,TrendingUp,TriangleAlert,Users} from 'lucide-react'
import {Link} from 'react-router'
import {PageHeader} from '../components/ui/PageHeader'
import {StatCard} from '../components/ui/StatCard'
import {TrendChart} from '../components/charts/TrendChart'
import {useDashboardQuery} from '../services/dashboardApi'
import {useReportQuery} from '../services/reportApi'
import {useOrdersQuery} from '../services/orderApi'
import {useInventoryQuery} from '../services/inventoryApi'
import {useReturnsQuery} from '../services/returnApi'
import {useCustomersQuery} from '../services/customerApi'
import {StatusBadge} from '../components/ui/StatusBadge'
import {LoadingRows} from '../components/ui/Loading'
import {money,date} from '../utils/format'
import {rowsOf} from '../utils/data'

const MiniEmpty=({text}:{text:string})=><div className="p-8 text-center text-sm text-zinc-400">{text}</div>

export default function DashboardPage(){
  const d=useDashboardQuery({days:1}); const sales=useReportQuery({type:'sales',days:30}); const products=useReportQuery({type:'product-performance',days:30}); const customerReport=useReportQuery({type:'customers',days:30}); const orders=useOrdersQuery({page_size:6,ordering:'-created_at'}); const stock=useInventoryQuery({ordering:'available_stock',page_size:6,low_stock:true}); const returns=useReturnsQuery({status:'requested',page_size:5}); const customers=useCustomersQuery({ordering:'-created_at',page_size:5})
  const s:any=d.data||{}; const salesRows=Array.isArray(sales.data)?sales.data:[]; const productRows=Array.isArray(products.data)?products.data:[]; const customerRows=Array.isArray(customerReport.data)?customerReport.data:[]; const orderRows=rowsOf<any>(orders.data).slice(0,6); const stockRows=rowsOf<any>(stock.data).slice(0,6); const returnRows=rowsOf<any>(returns.data).slice(0,5); const recentCustomers=rowsOf<any>(customers.data).slice(0,5)
  const stat=(label:string,value:any,icon:any,tone?:any)=>d.isLoading?<div className="h-28 animate-pulse rounded-2xl bg-zinc-200"/>:<StatCard label={label} value={value} icon={icon} tone={tone}/>
  return <>
    <PageHeader title="Dashboard" description="Live operational pulse with 30-day commercial trends." actions={<button className="btn-secondary" onClick={()=>{d.refetch();sales.refetch();products.refetch();orders.refetch();stock.refetch()}}>Refresh</button>}/>
    {d.isError&&<div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Dashboard KPI API could not be loaded. Operational panels below remain available. <button className="font-semibold underline" onClick={()=>d.refetch()}>Retry</button></div>}
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
      {stat("Today's Revenue",money(s.revenue),DollarSign)}{stat("Today's Orders",s.orders??0,ShoppingBag)}{stat('Units Sold',s.units_sold??0,ShoppingBasket)}{stat('New Customers',s.customers??0,Users)}{stat('Average Order Value',money(s.aov),TrendingUp)}
      {stat('Gross Profit',money(s.gross_profit),DollarSign,Number(s.gross_profit||0)>=0?'success':'danger')}{stat('Pending Orders',s.pending_orders??0,Clock,'warning')}{stat('Return Requests',s.return_requests??0,RotateCcw,'warning')}{stat('Low Stock',s.low_stock_rows??0,TriangleAlert,'warning')}{stat('Out of Stock',s.out_of_stock_rows??0,PackageX,'danger')}
    </div>
    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <section className="panel p-5"><h2 className="font-semibold">Revenue trend</h2><p className="mb-3 text-xs text-zinc-400">Last 30 days</p>{sales.isLoading?<div className="h-64 animate-pulse rounded-xl bg-zinc-100"/>:<TrendChart data={salesRows.map((x:any)=>({name:String(x.day||'').slice(5),value:Number(x.sales||0)}))}/>}</section>
      <section className="panel p-5"><h2 className="font-semibold">Orders trend</h2><p className="mb-3 text-xs text-zinc-400">Daily order volume</p>{sales.isLoading?<div className="h-64 animate-pulse rounded-xl bg-zinc-100"/>:<TrendChart data={salesRows.map((x:any)=>({name:String(x.day||'').slice(5),value:Number(x.orders||0)}))}/>}</section>
      <section className="panel p-5"><h2 className="font-semibold">Customer value</h2><p className="mb-3 text-xs text-zinc-400">Top lifetime value</p><TrendChart kind="bar" data={customerRows.slice(0,10).map((x:any)=>({name:(x.full_name||`#${x.id}`).slice(0,16),value:Number(x.lifetime_value||0)}))}/></section>
      <section className="panel p-5"><h2 className="font-semibold">Product sales</h2><p className="mb-3 text-xs text-zinc-400">Top products by revenue</p><TrendChart kind="bar" data={productRows.slice(0,10).map((x:any)=>({name:(x.product_name_snapshot||`#${x.product_id}`).slice(0,16),value:Number(x.revenue||0)}))}/></section>
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-3">
      <section className="panel overflow-hidden"><div className="flex items-center justify-between p-5"><h2 className="font-semibold">Recent Orders</h2><Link className="text-sm font-semibold text-pink-700" to="/sales/orders">View all</Link></div>{orders.isLoading?<div className="p-4"><LoadingRows rows={4}/></div>:orderRows.length?<div className="divide-y divide-zinc-100">{orderRows.map((o:any)=><Link to={`/sales/orders/${o.order_number}`} key={o.id} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50"><div><b className="text-sm">{o.order_number}</b><div className="text-xs text-zinc-400">{o.customer_name} · {date(o.created_at)}</div></div><div className="text-right"><b className="text-sm">{money(o.total)}</b><div className="mt-1"><StatusBadge value={o.order_status}/></div></div></Link>)}</div>:<MiniEmpty text="No orders yet."/>}</section>
      <section className="panel overflow-hidden"><div className="flex items-center justify-between p-5"><h2 className="font-semibold">Top Products</h2><Link className="text-sm font-semibold text-pink-700" to="/reports">Analyze</Link></div>{productRows.length?<div className="divide-y divide-zinc-100">{productRows.slice(0,6).map((p:any)=><div key={p.product_id} className="flex items-center justify-between px-5 py-3"><div><b className="line-clamp-1 text-sm">{p.product_name_snapshot}</b><div className="text-xs text-zinc-400">{p.units||0} units · {p.orders||0} orders</div></div><b className="text-sm">{money(p.revenue)}</b></div>)}</div>:<MiniEmpty text="No product sales in this period."/>}</section>
      <section className="panel overflow-hidden"><div className="flex items-center justify-between p-5"><h2 className="font-semibold">Low Stock</h2><Link className="text-sm font-semibold text-pink-700" to="/inventory/stock">View stock</Link></div>{stockRows.length?<div className="divide-y divide-zinc-100">{stockRows.map((row:any)=><div key={row.id} className="flex items-center justify-between px-5 py-3"><div><b className="line-clamp-1 text-sm">{row.stock_item_detail?.name}</b><div className="text-xs text-zinc-400">{row.stock_item_detail?.sku} · {row.warehouse_name}</div></div><div className="text-right"><b className="text-red-600">{row.available_stock}</b><div className="text-xs text-zinc-400">reserved {row.reserved_stock}</div></div></div>)}</div>:<MiniEmpty text="No low-stock rows."/>}</section>
      <section className="panel overflow-hidden"><div className="flex items-center justify-between p-5"><h2 className="font-semibold">Recent Customers</h2><Link className="text-sm font-semibold text-pink-700" to="/customers">View all</Link></div>{recentCustomers.length?<div className="divide-y divide-zinc-100">{recentCustomers.map((c:any)=><Link key={c.id} to={`/customers/${c.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50"><div><b className="text-sm">{c.full_name||'Unnamed customer'}</b><div className="text-xs text-zinc-400">{c.phone||c.email||'—'}</div></div><div className="text-right text-xs text-zinc-500">{c.orders_count||0} orders<br/>{money(c.lifetime_spend||0)}</div></Link>)}</div>:<MiniEmpty text="No customers yet."/>}</section>
      <section className="panel overflow-hidden xl:col-span-2"><div className="flex items-center justify-between p-5"><h2 className="font-semibold">Pending Returns</h2><Link className="text-sm font-semibold text-pink-700" to="/after-sales/returns">Manage</Link></div>{returnRows.length?<div className="grid sm:grid-cols-2">{returnRows.map((r:any)=><div key={r.id} className="flex items-center justify-between border-t border-zinc-100 px-5 py-4"><div><b className="text-sm">Return #{r.id}</b><div className="text-xs text-zinc-400">Order #{r.order} · {r.items?.length||0} lines</div></div><StatusBadge value={r.status}/></div>)}</div>:<MiniEmpty text="No pending returns."/>}</section>
    </div>
  </>
}
