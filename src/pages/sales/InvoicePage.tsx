import {useEffect,useRef} from 'react'
import {useParams,useSearchParams} from 'react-router'
import {Printer} from 'lucide-react'
import {useInvoiceQuery} from '../../services/orderApi'
import {PageLoading} from '../../components/ui/Loading'
import {ErrorState} from '../../components/ui/ErrorState'
import {money,date} from '../../utils/format'

export default function InvoicePage(){
  const {orderNumber=''}=useParams(); const [params]=useSearchParams(); const q=useInvoiceQuery(orderNumber); const printed=useRef(false)
  useEffect(()=>{if(q.data&&params.get('print')==='1'&&!printed.current){printed.current=true;window.setTimeout(()=>window.print(),250)}},[q.data,params])
  if(q.isLoading)return <PageLoading/>; if(q.isError||!q.data)return <ErrorState onRetry={q.refetch}/>
  const d:any=q.data,o=d.order,c=d.company||{}
  return <div className="print-page mx-auto max-w-5xl rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm sm:p-10">
    <div className="no-print mb-6 flex justify-end"><button className="btn-primary" onClick={()=>window.print()}><Printer size={16}/>Print Invoice</button></div>
    <header className="flex flex-col justify-between gap-6 border-b border-zinc-200 pb-8 sm:flex-row"><div>{c.logo?<img src={c.logo} className="mb-4 max-h-14 max-w-48 object-contain"/>:<div className="mb-3 text-2xl font-black">{c.name||'Beauty Commerce'}</div>}<p className="max-w-sm whitespace-pre-line text-sm leading-6 text-zinc-500">{c.address}<br/>{c.phone}<br/>{c.email}</p></div><div className="sm:text-right"><div className="text-xs font-bold uppercase tracking-[.2em] text-zinc-400">Invoice</div><h1 className="mt-2 text-3xl font-bold">{d.invoice_number}</h1><p className="mt-2 text-sm text-zinc-500">Order {o.order_number}<br/>{date(o.created_at,true)}</p></div></header>
    <div className="grid gap-6 py-8 sm:grid-cols-2"><div><div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Bill To</div><b className="mt-2 block">{o.customer_name}</b><p className="mt-1 text-sm leading-6 text-zinc-500">{o.customer_phone}<br/>{d.address?.address}<br/>{d.address?.thana}, {d.address?.district}</p></div><div className="sm:text-right"><div className="text-xs font-bold uppercase tracking-wider text-zinc-400">Payment</div>{d.payment?.map((p:any,i:number)=><p key={`${p.method}-${i}`} className="mt-2 text-sm"><b>{String(p.method).toUpperCase()}</b> · {p.status}<br/>{p.transaction_id&&<span className="text-zinc-400">Txn {p.transaction_id}</span>}</p>)}</div></div>
    <div className="overflow-x-auto"><table className="table"><thead><tr><th>Product</th><th>SKU / Variant</th><th>Qty</th><th>Unit</th><th>Discount</th><th>Total</th></tr></thead><tbody>{o.items?.map((i:any)=><tr key={i.id}><td className="font-medium">{i.product_name_snapshot}</td><td><div>{i.sku_snapshot}</div><div className="text-xs text-zinc-400">{Object.entries(i.variant_snapshot||{}).map(([k,v])=>`${k}: ${v}`).join(' · ')}</div></td><td>{i.quantity}</td><td>{money(i.unit_price)}</td><td>{money(i.discount)}</td><td className="font-semibold">{money(i.total)}</td></tr>)}</tbody></table></div>
    <div className="ml-auto mt-8 w-full max-w-sm space-y-2 text-sm">{[['Subtotal',o.subtotal],['Shipping',o.shipping_charge],['Tax',o.tax],['Discount',-Number(o.discount)]].map(([label,value]:any)=><div key={label} className="flex justify-between"><span className="text-zinc-500">{label}</span><span>{money(value)}</span></div>)}<div className="flex justify-between border-t border-zinc-200 pt-3 text-lg font-bold"><span>Grand Total</span><span>{money(o.total)}</span></div></div>
    <footer className="mt-12 border-t border-zinc-200 pt-5 text-center text-xs text-zinc-400">Thank you for shopping with {c.name||'Beauty Commerce'}.</footer>
  </div>
}
