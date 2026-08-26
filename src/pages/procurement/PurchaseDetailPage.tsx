import {useState} from 'react'
import {useParams} from 'react-router'
import {Printer,PackageCheck,XCircle,CheckCircle2,ImageIcon} from 'lucide-react'
import {PageHeader} from '../../components/ui/PageHeader'
import {StatusBadge} from '../../components/ui/StatusBadge'
import {PageLoading} from '../../components/ui/Loading'
import {Modal} from '../../components/ui/Modal'
import {usePurchaseQuery,useApprovePurchaseMutation,useCancelPurchaseMutation,useReceivePurchaseMutation,useSuppliersQuery} from '../../services/purchaseApi'
import {useWarehousesQuery} from '../../services/inventoryApi'
import {money,date} from '../../utils/format'
import {rowsOf,apiError} from '../../utils/data'
import {mediaUrl} from '../../utils/media'
import {useAppDispatch} from '../../store/hooks'
import {toast} from '../../features/ui/uiSlice'
import type {PurchaseItem} from '../../types'

function PurchaseTarget({item,compact=false}:{item:PurchaseItem;compact?:boolean}){
  const src=mediaUrl(item.target_image)
  const fallback=item.product?`Product #${item.product}`:`Variant #${item.product_variant}`
  return <div className="flex min-w-0 items-center gap-3">
    <div className={`purchase-product-image ${compact?'h-10 w-10':'h-14 w-14'} grid shrink-0 place-items-center overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50`}>
      {src?<img src={src} alt={item.target_name||fallback} className="h-full w-full object-cover"/>:<ImageIcon size={compact?16:20} className="text-zinc-300"/>}
    </div>
    <div className="min-w-0">
      <div className="font-semibold text-zinc-900">{item.target_name||fallback}</div>
      <div className="mt-0.5 text-xs text-zinc-500">{item.target_sku||'No SKU'}</div>
      {item.variant_label&&<div className="mt-1 text-xs text-zinc-400">{item.variant_label}</div>}
    </div>
  </div>
}

export default function PurchaseDetailPage(){
  const {id}=useParams()
  const q=usePurchaseQuery(Number(id))
  const ss=useSuppliersQuery()
  const ws=useWarehousesQuery()
  const [approve,{isLoading:approving}]=useApprovePurchaseMutation()
  const [cancel]=useCancelPurchaseMutation()
  const [receive,{isLoading:receiving}]=useReceivePurchaseMutation()
  const dispatch=useAppDispatch()
  const [open,setOpen]=useState(false)
  const [receipts,setReceipts]=useState<Record<number,number>>({})

  if(q.isLoading||!q.data)return <PageLoading/>
  const p=q.data
  const supplier=rowsOf<any>(ss.data).find(x=>x.id===p.supplier)
  const wh=rowsOf<any>(ws.data).find(x=>x.id===p.warehouse)
  const act=async(fn:()=>Promise<any>,msg:string)=>{
    try{await fn();dispatch(toast({type:'success',message:msg}))}
    catch(e){dispatch(toast({type:'error',message:apiError(e)}))}
  }

  return <>
    <PageHeader title={p.purchase_number} description={`${supplier?.name||'Supplier'} → ${wh?.name||'Warehouse'}`} actions={<>
      <button className="btn-secondary" onClick={()=>window.print()}><Printer size={16}/>Print Purchase</button>
      {p.status==='draft'&&<button className="btn-brand" disabled={approving} onClick={()=>act(()=>approve(p.id).unwrap(),'Purchase ordered; incoming stock recorded.')}><CheckCircle2 size={16}/>Order Purchase</button>}
      {['approved','partial'].includes(p.status)&&<button className="btn-brand" onClick={()=>{setReceipts(Object.fromEntries(p.items.filter(i=>i.remaining_quantity>0).map(i=>[i.id,i.remaining_quantity])));setOpen(true)}}><PackageCheck size={16}/>Receive</button>}
      {['draft','approved'].includes(p.status)&&<button className="btn-secondary text-red-600" onClick={()=>act(()=>cancel(p.id).unwrap(),'Purchase cancelled.')}><XCircle size={16}/>Cancel</button>}
    </>}/>

    <div className="grid gap-5 lg:grid-cols-3">
      <section className="panel p-5 lg:col-span-2">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Purchase Items</h2><StatusBadge value={p.status==='approved'?'ordered':p.status}/></div>
        <div className="overflow-x-auto">
          <table className="table min-w-[800px]">
            <thead><tr><th>Product</th><th>Ordered</th><th>Received</th><th>Remaining</th><th>Unit Cost</th><th>Total</th></tr></thead>
            <tbody>{p.items.map(item=><tr key={item.id}>
              <td className="min-w-72"><PurchaseTarget item={item}/></td>
              <td>{item.quantity}</td>
              <td>{item.received_quantity}</td>
              <td>{item.remaining_quantity}</td>
              <td>{money(item.unit_cost)}</td>
              <td className="font-semibold">{money(item.total)}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>

      <aside className="panel p-5">
        <h2 className="font-semibold">Purchase Summary</h2>
        <dl className="mt-4 space-y-3 text-sm">
          {[
            ['Supplier',supplier?.name],['Warehouse',wh?.name],['Supplier Invoice',p.supplier_invoice||'—'],
            ['Purchase Date',date(p.purchase_date)],['Expected',date(p.expected_date)],['Subtotal',money(p.subtotal)],
            ['Discount',money(p.discount)],['Tax',money(p.tax)]
          ].map(([a,b])=><div key={a} className="flex justify-between gap-4"><dt className="text-zinc-400">{a}</dt><dd className="text-right font-medium">{b}</dd></div>)}
          <div className="flex justify-between border-t border-zinc-200 pt-3 text-base"><dt className="font-semibold">Total</dt><dd className="font-bold">{money(p.total)}</dd></div>
        </dl>
      </aside>
    </div>

    <Modal open={open} onClose={()=>setOpen(false)} title="Receive Purchase">
      <p className="mb-4 text-sm text-zinc-500">Enter only quantities physically received now. The backend locks remaining quantities and prevents double-stock.</p>
      <div className="space-y-3">{p.items.filter(item=>item.remaining_quantity>0).map(item=><label key={item.id} className="grid grid-cols-[1fr_120px] items-center gap-3 rounded-xl border border-zinc-200 p-3">
        <span><PurchaseTarget item={item} compact/><small className="mt-1 block pl-[52px] text-zinc-400">Remaining {item.remaining_quantity}</small></span>
        <input className="input" type="number" min="0" max={item.remaining_quantity} value={receipts[item.id]??0} onChange={e=>setReceipts({...receipts,[item.id]:Number(e.target.value)})}/>
      </label>)}</div>
      <button className="btn-brand mt-5 w-full" disabled={receiving} onClick={()=>act(async()=>{
        await receive({id:p.id,receipts:Object.entries(receipts).filter(([,qty])=>Number(qty)>0).map(([item_id,quantity])=>({item_id:Number(item_id),quantity:Number(quantity)}))}).unwrap()
        setOpen(false)
      },'Purchase quantities received.')}>{receiving?'Receiving…':'Confirm Receive'}</button>
    </Modal>
  </>
}
