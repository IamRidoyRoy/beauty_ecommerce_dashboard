import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  Check,
  MapPin,
  Phone,
  Printer,
  RotateCcw,
  Truck,
  User,
  WalletCards,
  XCircle,
} from 'lucide-react'

import { Field, Input, Select, Textarea } from '../../components/forms/FormField'
import { Modal } from '../../components/ui/Modal'
import { PageHeader } from '../../components/ui/PageHeader'
import { PageLoading } from '../../components/ui/Loading'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { toast } from '../../features/ui/uiSlice'
import { useCreateReturnForOrderMutation, useCreateRefundMutation } from '../../services/returnApi'
import { useOrderQuery, useTransitionOrderMutation } from '../../services/orderApi'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { apiError } from '../../utils/data'
import { date, money, titleCase } from '../../utils/format'
import {mediaUrl} from '../../utils/media'

const sequence = [
  'pending',
  'confirmed',
  'processing',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
]

const terminalStatuses = new Set(['delivered', 'cancelled', 'returned', 'refunded'])

export default function OrderDetailPage() {
  const { orderNumber = '' } = useParams()
  const q = useOrderQuery(orderNumber)
  const [transition, { isLoading }] = useTransitionOrderMutation()
  const [createReturn] = useCreateReturnForOrderMutation()
  const [createRefund] = useCreateRefundMutation()
  const dispatch = useAppDispatch()
  const role = useAppSelector((s) => s.auth.user?.role)

  const [selectedStatus, setSelectedStatus] = useState('')
  const [returnOpen, setReturnOpen] = useState(false)
  const [refundOpen, setRefundOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [returnQty, setReturnQty] = useState<Record<number, number>>({})
  const [refund, setRefund] = useState({ payment: '', amount: '', reason: '' })

  const order = q.data
  const orderWrite = ['super_admin', 'admin', 'manager', 'order_manager'].includes(role || '')
  const refundWrite = ['super_admin', 'admin', 'manager', 'finance_manager'].includes(role || '')

  useEffect(() => {
    if (order?.order_status) setSelectedStatus(order.order_status)
  }, [order?.order_status])

  const act = async (status: string) => {
    try {
      await transition({ order: orderNumber, new_status: status }).unwrap()
      dispatch(toast({ type: 'success', message: `Order moved to ${titleCase(status)}.` }))
    } catch (e) {
      dispatch(toast({ type: 'error', message: apiError(e) }))
    }
  }

  if (q.isLoading || !order) return <PageLoading />

  const address = order.shipping_address_snapshot || {}
  const current = sequence.indexOf(order.order_status)
  const payment = order.payments?.[0]
  const couponEntry=(order.promotion_snapshot||[]).find((x:any)=>x?.type==='coupon'||(order.coupon_code_snapshot&&x?.code===order.coupon_code_snapshot)) as any
  const activeShipment = order.shipments?.find((row) => !['cancelled', 'failed', 'returned'].includes(row.status))
  const packedIndex = sequence.indexOf('packed')
  const selectableLifecycle = activeShipment ? sequence : sequence.slice(0, packedIndex + 1)
  const forwardStatuses = current >= 0 ? selectableLifecycle.filter((_, index) => index >= current) : [order.order_status]
  const canChangeStatus = orderWrite && current >= 0 && !terminalStatuses.has(order.order_status)
  const canBookShipment = orderWrite && !activeShipment && order.order_status === 'packed'

  return (
    <>
      <PageHeader
        title={order.order_number}
        description={`${date(order.created_at, true)} · ${order.items.length} line item(s)`}
        actions={
          <>
            <Link to={`/sales/orders/${order.order_number}/invoice`} className="btn-secondary">
              <Printer size={16} />
              View Invoice
            </Link>

            {canChangeStatus && (
              <div className="flex min-w-[330px] items-center gap-2">
                <Select
                  aria-label="Order status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="min-w-[185px]"
                >
                  {forwardStatuses.map((status) => (
                    <option key={status} value={status}>
                      {titleCase(status)}{status === order.order_status ? ' (Current)' : ''}
                    </option>
                  ))}
                </Select>
                <button
                  type="button"
                  className="btn-brand whitespace-nowrap"
                  disabled={isLoading || !selectedStatus || selectedStatus === order.order_status}
                  onClick={() => act(selectedStatus)}
                >
                  {isLoading ? 'Updating…' : 'Update Status'}
                </button>
              </div>
            )}

            {canBookShipment && (
              <Link to="/courier/orders" className="btn-secondary">
                <Truck size={16} />
                Submit to Courier
              </Link>
            )}

            {orderWrite && !terminalStatuses.has(order.order_status) && (
              <button
                type="button"
                className="btn-secondary text-red-600"
                onClick={() => act('cancelled')}
              >
                <XCircle size={16} />
                Cancel
              </button>
            )}
          </>
        }
      />

      <section className="panel mb-5 p-5">
        <div className="flex gap-0 overflow-x-auto pb-2">
          {sequence.map((s, i) => (
            <div key={s} className="min-w-32 flex-1">
              <div className="flex items-center">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    i <= current ? 'bg-pink-700 text-white' : 'bg-zinc-100 text-zinc-400'
                  }`}
                >
                  {i < current ? <Check size={14} /> : i + 1}
                </span>
                {i < sequence.length - 1 && (
                  <div className={`h-0.5 flex-1 ${i < current ? 'bg-pink-700' : 'bg-zinc-200'}`} />
                )}
              </div>
              <div className="mt-2 text-xs font-medium text-zinc-600">{titleCase(s)}</div>
            </div>
          ))}
        </div>
        {canChangeStatus && (
          <p className="mt-3 text-xs text-zinc-500">
            You can select any later status. The backend applies required intermediate lifecycle steps
            automatically, so inventory reservations and delivery completion remain consistent.
          </p>
        )}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_.8fr]">
        <div className="space-y-5">
          <section className="panel overflow-hidden">
            <div className="border-b border-zinc-100 p-5">
              <h2 className="font-semibold">Order Items</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU / Variant</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Discount</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((i) => (
                    <tr key={i.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          {i.image_snapshot ? (
                            <img src={mediaUrl(i.image_snapshot)} alt="" className="h-11 w-11 rounded-lg border border-zinc-100 object-cover" />
                          ) : (
                            <div className="h-11 w-11 rounded-lg bg-zinc-100" />
                          )}
                          <b className="max-w-64">{i.product_name_snapshot}</b>
                        </div>
                      </td>
                      <td>
                        <div>{i.sku_snapshot}</div>
                        <div className="text-xs text-zinc-400">
                          {i.variant_snapshot
                            ? Object.entries(i.variant_snapshot)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(' · ')
                            : 'Simple product'}
                        </div>
                      </td>
                      <td>{i.quantity}</td>
                      <td>{money(i.unit_price)}</td>
                      <td>{money(i.discount)}</td>
                      <td className="font-semibold">{money(i.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">After Sales</h2>
              <div className="flex gap-2">
                {order.order_status === 'delivered' && (
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setReturnQty(Object.fromEntries(order.items.map((i) => [i.id, 0])))
                      setReturnOpen(true)
                    }}
                  >
                    <RotateCcw size={16} />
                    Create Return
                  </button>
                )}
                {refundWrite && payment && ['paid', 'partial_refund'].includes(payment.status) && (
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setRefund({ payment: String(payment.id), amount: String(payment.amount), reason: '' })
                      setRefundOpen(true)
                    }}
                  >
                    <WalletCards size={16} />
                    Refund
                  </button>
                )}
              </div>
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              Returns and refunds remain separate controlled services; order history is never rewritten
              from mutable product data.
            </p>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="panel p-5">
            <h2 className="font-semibold">Customer</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex gap-3">
                <User size={17} className="text-zinc-400" />
                <div>
                  <b>{order.customer_name}</b>
                  <div className="text-zinc-400">Customer #{order.user}</div>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone size={17} className="text-zinc-400" />
                <span>{order.customer_phone}</span>
              </div>
              <div className="flex gap-3">
                <MapPin size={17} className="text-zinc-400" />
                <span>
                  {address.address}
                  <br />
                  {address.thana}, {address.district}
                </span>
              </div>
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="font-semibold">Payment & Totals</h2>
            <div className="mt-4 space-y-2 text-sm">
              {[
                ['Subtotal', money(order.subtotal)],
                ...(order.coupon_code_snapshot?[[`Coupon (${order.coupon_code_snapshot})`, couponEntry?.free_shipping?'Free shipping':`-${money(couponEntry?.discount??order.discount)}`]]:[]),
                ['Total Discount', `-${money(order.discount)}`],
                ['Shipping', money(order.shipping_charge)],
                ['Tax', money(order.tax)],
              ].map(([a, b]) => (
                <div key={a} className="flex justify-between">
                  <span className="text-zinc-500">{a}</span>
                  <span>{b}</span>
                </div>
              ))}
              <div className="mt-3 flex justify-between border-t border-zinc-200 pt-3 text-base font-bold">
                <span>Total</span>
                <span>{money(order.total)}</span>
              </div>
              <div className="mt-4 flex justify-between">
                <StatusBadge value={order.payment_status} />
                <span className="text-xs text-zinc-400">{payment?.method?.toUpperCase()}</span>
              </div>
            </div>
          </section>

          {order.shipments?.length ? (
            <section className="panel p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">Courier Shipment</h2>
                <Link to="/courier/shipments" className="text-xs font-semibold text-pink-700">View shipments</Link>
              </div>
              <div className="mt-4 space-y-3">
                {order.shipments.map((row) => (
                  <div key={row.id} className="rounded-xl border border-zinc-200 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <b>{titleCase(row.courier)}</b>
                      <StatusBadge value={row.status} />
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">Tracking: {row.tracking_code || row.external_id || 'Pending'}</div>
                    {row.provider_status && <div className="mt-1 text-xs text-zinc-400">Provider: {titleCase(row.provider_status)}</div>}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="panel p-5">
            <h2 className="font-semibold">Notes</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-500">
              {order.notes || 'No order note.'}
            </p>
          </section>
        </aside>
      </div>

      <Modal open={returnOpen} onClose={() => setReturnOpen(false)} title="Create Return">
        <div className="space-y-3">
          {order.items.map((i) => (
            <div key={i.id} className="grid grid-cols-[1fr_100px] gap-3 rounded-xl border border-zinc-200 p-3">
              <span className="text-sm">
                <b>{i.product_name_snapshot}</b>
                <small className="block text-zinc-400">
                  Purchased {i.quantity}, already returned {i.returned_quantity}
                </small>
              </span>
              <Input
                type="number"
                min="0"
                max={i.quantity - i.returned_quantity}
                value={returnQty[i.id] || 0}
                onChange={(e) => setReturnQty({ ...returnQty, [i.id]: Number(e.target.value) })}
              />
            </div>
          ))}
          <Field label="Reason">
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <button
            className="btn-brand w-full"
            onClick={async () => {
              try {
                await createReturn({
                  order: order.id,
                  reason,
                  items: Object.entries(returnQty)
                    .filter(([, q]) => q > 0)
                    .map(([id, q]) => ({ order_item: Number(id), quantity: q, reason, restock: true })),
                }).unwrap()
                dispatch(toast({ type: 'success', message: 'Return request created.' }))
                setReturnOpen(false)
              } catch (e) {
                dispatch(toast({ type: 'error', message: apiError(e) }))
              }
            }}
          >
            Create Return
          </button>
        </div>
      </Modal>

      <Modal open={refundOpen} onClose={() => setRefundOpen(false)} title="Create Refund">
        <div className="space-y-4">
          <Field label="Payment">
            <Select
              value={refund.payment}
              onChange={(e) => setRefund({ ...refund, payment: e.target.value })}
            >
              {order.payments.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.method.toUpperCase()} · {money(p.amount)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Amount">
            <Input
              type="number"
              min="0.01"
              step="0.01"
              value={refund.amount}
              onChange={(e) => setRefund({ ...refund, amount: e.target.value })}
            />
          </Field>
          <Field label="Reason">
            <Textarea
              value={refund.reason}
              onChange={(e) => setRefund({ ...refund, reason: e.target.value })}
            />
          </Field>
          <button
            className="btn-brand w-full"
            onClick={async () => {
              try {
                await createRefund({
                  payment: Number(refund.payment),
                  amount: refund.amount,
                  reason: refund.reason,
                }).unwrap()
                dispatch(toast({ type: 'success', message: 'Refund created for finance processing.' }))
                setRefundOpen(false)
              } catch (e) {
                dispatch(toast({ type: 'error', message: apiError(e) }))
              }
            }}
          >
            Create Refund
          </button>
        </div>
      </Modal>
    </>
  )
}
