import { useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Pagination } from '../../components/ui/Pagination'
import { LoadingRows } from '../../components/ui/Loading'
import { ErrorState } from '../../components/ui/ErrorState'
import { usePaymentsQuery, useReconcilePaymentMutation } from '../../services/paymentApi'
import { rowsOf, countOf, apiError } from '../../utils/data'
import { money, date, titleCase } from '../../utils/format'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useAppDispatch } from '../../store/hooks'
import { toast } from '../../features/ui/uiSlice'
import type { Payment } from '../../types'

const ONLINE_METHODS = new Set(['sslcommerz', 'card', 'bkash', 'nagad'])

export default function PaymentsPage() {
  const dispatch = useAppDispatch()
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [method, setMethod] = useState('')
  const [search, setSearch] = useState('')
  const [reconcilingId, setReconcilingId] = useState<number | null>(null)
  const debounced = useDebouncedValue(search, 300)
  const q = usePaymentsQuery({
    page,
    page_size: 50,
    search: debounced || undefined,
    status: status || undefined,
    method: method || undefined,
  })
  const [reconcile] = useReconcilePaymentMutation()

  const runReconciliation = async (payment: Payment) => {
    setReconcilingId(payment.id)
    try {
      const result = await reconcile(payment.id).unwrap()
      dispatch(toast({
        type: 'success',
        message: `Gateway reconciliation completed: ${titleCase(result.status)}.`,
      }))
    } catch (error) {
      dispatch(toast({ type: 'error', message: apiError(error) }))
    } finally {
      setReconcilingId(null)
    }
  }

  const cols: Column<Payment>[] = [
    {
      key: 'txn',
      header: 'Transaction',
      render: (r) => (
        <div>
          <b>{r.transaction_id || `Payment #${r.id}`}</b>
          <div className="text-xs text-zinc-400">{r.gateway_reference || 'No gateway reference'}</div>
          {r.failure_message && <div className="mt-1 max-w-xs text-xs text-red-600">{r.failure_message}</div>}
        </div>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      render: (r) => (
        <div>
          <b>{r.order_number || `#${r.order}`}</b>
          {(r.customer_name || r.customer_phone) && (
            <div className="text-xs text-zinc-400">{r.customer_name || 'Customer'}{r.customer_phone ? ` · ${r.customer_phone}` : ''}</div>
          )}
        </div>
      ),
    },
    { key: 'amount', header: 'Amount', render: (r) => <b>{money(r.amount)}</b> },
    { key: 'method', header: 'Method', render: (r) => <span className="font-medium">{String(r.method || '').toUpperCase()}</span> },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.status} /> },
    {
      key: 'verified',
      header: 'Last verified',
      render: (r) => r.last_verified_at ? date(r.last_verified_at, true) : '—',
    },
    { key: 'date', header: 'Created', render: (r) => date(r.created_at, true) },
    {
      key: 'action',
      header: '',
      render: (r) => ONLINE_METHODS.has(r.method) ? (
        <button
          className="btn-secondary py-2"
          disabled={reconcilingId === r.id}
          onClick={(event) => {
            event.stopPropagation()
            void runReconciliation(r)
          }}
        >
          <RefreshCw size={15} className={reconcilingId === r.id ? 'animate-spin' : ''} />
          {reconcilingId === r.id ? 'Checking…' : 'Reconcile'}
        </button>
      ) : <span className="text-xs text-zinc-400">COD</span>,
    },
  ]

  const change = (setter: (value: string) => void) => (value: string) => {
    setter(value)
    setPage(1)
  }

  return <>
    <PageHeader
      title="Payments"
      description="Gateway statuses are read-only. Reconcile verifies the transaction directly with the provider before changing payment state."
    />
    <div className="mb-4 grid gap-2 md:grid-cols-3">
      <label className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input className="input pl-9" value={search} onChange={(e) => change(setSearch)(e.target.value)} placeholder="Transaction, order, customer, phone…" />
      </label>
      <select className="input" value={method} onChange={(e) => change(setMethod)(e.target.value)}>
        <option value="">All methods</option>
        {['cod', 'sslcommerz', 'bkash', 'nagad', 'card'].map((x) => <option key={x} value={x}>{x.toUpperCase()}</option>)}
      </select>
      <select className="input" value={status} onChange={(e) => change(setStatus)(e.target.value)}>
        <option value="">All statuses</option>
        {['pending', 'authorized', 'paid', 'failed', 'cancelled', 'partial_refund', 'refunded'].map((x) => <option key={x} value={x}>{titleCase(x)}</option>)}
      </select>
    </div>
    {q.isLoading
      ? <LoadingRows />
      : q.isError
        ? <ErrorState onRetry={() => q.refetch()} />
        : <><DataTable rows={rowsOf<Payment>(q.data)} columns={cols} getKey={(r) => r.id} /><Pagination count={countOf(q.data)} page={page} onPage={setPage} /></>}
  </>
}
