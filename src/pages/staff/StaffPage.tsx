import { useState } from 'react'
import { Plus, Search, ShieldCheck, UserCog, X } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Field, Input, Select, Switch } from '../../components/forms/FormField'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { PageLoading } from '../../components/ui/Loading'
import { ErrorState } from '../../components/ui/ErrorState'
import {
  useStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
} from '../../services/settingsApi'
import { rowsOf, apiError } from '../../utils/data'
import { date, titleCase } from '../../utils/format'
import { roleLabels } from '../../utils/permissions'
import { useAppDispatch, useAppSelector } from '../../store/hooks'
import { toast } from '../../features/ui/uiSlice'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'

const roles = [
  'super_admin',
  'admin',
  'manager',
  'product_manager',
  'inventory_manager',
  'order_manager',
  'customer_support',
  'marketing_manager',
  'finance_manager',
] as const

const emptyForm = {
  full_name: '',
  phone: '',
  email: '',
  role: 'manager',
  password: '',
  is_active: true,
  is_staff: true,
}

export default function StaffPage() {
  const dispatch = useAppDispatch()
  const me = useAppSelector((s) => s.auth.user)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  const q = useStaffQuery({
    search: debouncedSearch || undefined,
    role: role || undefined,
    is_active: status === '' ? undefined : status,
    page_size: 100,
  })
  const [create] = useCreateStaffMutation()
  const [update] = useUpdateStaffMutation()
  const [remove] = useDeleteStaffMutation()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [del, setDel] = useState<any>(null)
  const [form, setForm] = useState<any>(emptyForm)

  const begin = (row?: any) => {
    setEditing(row || null)
    setForm(row ? { ...row, password: '' } : emptyForm)
    setOpen(true)
  }

  const save = async () => {
    try {
      const body: any = {
        ...form,
        phone: form.phone || null,
        email: form.email || null,
      }
      if (!body.password) delete body.password
      if (editing) await update({ id: editing.id, body }).unwrap()
      else await create(body).unwrap()
      setOpen(false)
      dispatch(toast({ type: 'success', message: 'Staff user saved.' }))
    } catch (error) {
      dispatch(toast({ type: 'error', message: apiError(error) }))
    }
  }

  const clearFilters = () => {
    setSearch('')
    setRole('')
    setStatus('')
  }

  const columns: Column<any>[] = [
    {
      key: 'staff',
      header: 'Staff',
      render: (row) => (
        <button className="text-left" onClick={() => begin(row)}>
          <b>{row.full_name}</b>
          <div className="text-xs text-zinc-400">{row.email || row.phone || 'No contact'}</div>
        </button>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
          <ShieldCheck size={13} />
          {roleLabels[row.role as keyof typeof roleLabels] || titleCase(row.role)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge value={row.is_active ? 'active' : 'inactive'} />,
    },
    {
      key: 'access',
      header: 'Access',
      render: (row) => (row.is_superuser ? 'Superuser' : row.is_staff ? 'Dashboard' : 'No staff access'),
    },
    { key: 'created', header: 'Created', render: (row) => date(row.created_at) },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex gap-2">
          <button className="btn-secondary py-2" onClick={() => begin(row)}>Edit</button>
          <button
            disabled={row.id === me?.id}
            className="btn-danger py-2"
            onClick={() => setDel(row)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  if (q.isLoading) return <PageLoading />
  if (q.isError) return <ErrorState onRetry={() => q.refetch()} />

  return (
    <>
      <PageHeader
        title="Users & Roles"
        description="Create operational staff accounts and assign least-privilege roles. Django remains the final permission authority."
        actions={(
          <button className="btn-brand" onClick={() => begin()}>
            <Plus size={16} /> Add Staff
          </button>
        )}
      />

      <div className="mb-4 grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 md:grid-cols-[minmax(240px,1fr)_220px_180px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <Input
            className="pl-9"
            placeholder="Search name, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          {roles.map((item) => <option key={item} value={item}>{roleLabels[item]}</option>)}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
        {(search || role || status) && (
          <button className="btn-secondary" onClick={clearFilters}>
            <X size={16} /> Clear
          </button>
        )}
      </div>

      <DataTable rows={rowsOf<any>(q.data)} columns={columns} getKey={(row) => row.id} />

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit staff user' : 'Create staff user'}>
        <div className="space-y-4">
          <Field label="Full name">
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Phone">
              <Input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
          </div>
          <Field label="Role">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {roles.map((item) => <option key={item} value={item}>{roleLabels[item]}</option>)}
            </Select>
          </Field>
          <Field label={editing ? 'New password (optional)' : 'Password'}>
            <Input
              type="password"
              minLength={8}
              value={form.password || ''}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <div className="rounded-xl border border-zinc-200 p-4">
            <Switch
              checked={!!form.is_active}
              onChange={(value) => setForm({ ...form, is_active: value })}
              label="Active account"
            />
          </div>
          <button
            disabled={!form.full_name || (!editing && !form.password)}
            className="btn-brand w-full"
            onClick={save}
          >
            <UserCog size={16} /> {editing ? 'Save Changes' : 'Create Staff User'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!del}
        onClose={() => setDel(null)}
        danger
        title={`Delete ${del?.full_name || 'staff user'}?`}
        onConfirm={async () => {
          try {
            await remove(del.id).unwrap()
            setDel(null)
            dispatch(toast({ type: 'success', message: 'Staff user deleted.' }))
          } catch (error) {
            dispatch(toast({ type: 'error', message: apiError(error) }))
          }
        }}
      />
    </>
  )
}
