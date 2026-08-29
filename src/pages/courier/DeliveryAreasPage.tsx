import {useMemo,useState} from 'react'
import {Check,MapPinned,Pencil,Search,Truck,X} from 'lucide-react'
import {PageHeader} from '../../components/ui/PageHeader'
import {DataTable,type Column} from '../../components/ui/DataTable'
import {StatusBadge} from '../../components/ui/StatusBadge'
import {Input,Select} from '../../components/forms/FormField'
import {PageLoading} from '../../components/ui/Loading'
import {ErrorState} from '../../components/ui/ErrorState'
import {rowsOf,apiError} from '../../utils/data'
import {money} from '../../utils/format'
import {useAppDispatch} from '../../store/hooks'
import {toast} from '../../features/ui/uiSlice'
import {
  useDeliveryModulesQuery,
  useDistrictsQuery,
  useThanasQuery,
  useUpdateDeliveryModuleMutation,
  useUpdateDistrictMutation,
  useUpdateThanaMutation,
  type DeliveryModule,
  type District,
  type Thana,
} from '../../services/deliveryApi'

type Tab='modules'|'districts'|'thanas'

export default function DeliveryAreasPage(){
  const dispatch=useAppDispatch()
  const [tab,setTab]=useState<Tab>('modules')
  const [search,setSearch]=useState('')
  const [districtFilter,setDistrictFilter]=useState('')
  const [editingChargeId,setEditingChargeId]=useState<number|null>(null)
  const [chargeDraft,setChargeDraft]=useState('')
  const [savingChargeId,setSavingChargeId]=useState<number|null>(null)
  const modulesQ=useDeliveryModulesQuery()
  const districtsQ=useDistrictsQuery(tab==='districts'?{search:search||undefined,page_size:200}:{page_size:200})
  const allDistrictsQ=useDistrictsQuery({page_size:200})
  const thanasQ=useThanasQuery({...(search?{search}:{}),...(districtFilter?{city:districtFilter}:{}),page_size:1000})
  const [updateModule]=useUpdateDeliveryModuleMutation()
  const [updateDistrict]=useUpdateDistrictMutation()
  const [updateThana]=useUpdateThanaMutation()
  const modules=rowsOf<DeliveryModule>(modulesQ.data)
  const districts=rowsOf<District>(districtsQ.data)
  const allDistricts=rowsOf<District>(allDistrictsQ.data)
  const thanas=rowsOf<Thana>(thanasQ.data)
  const moduleMap=useMemo(()=>new Map(modules.map(m=>[m.id,m])),[modules])
  const districtMap=useMemo(()=>new Map(allDistricts.map(d=>[d.id,d])),[allDistricts])
  const fail=(e:any)=>dispatch(toast({type:'error',message:apiError(e)}))
  const ok=(message:string)=>dispatch(toast({type:'success',message}))

  const startChargeEdit=(row:DeliveryModule)=>{
    setEditingChargeId(row.id)
    setChargeDraft(String(row.charge??''))
  }
  const cancelChargeEdit=()=>{
    setEditingChargeId(null)
    setChargeDraft('')
  }
  const saveCharge=async(row:DeliveryModule)=>{
    const value=Number(chargeDraft)
    if(chargeDraft.trim()===''||!Number.isFinite(value)||value<0){
      dispatch(toast({type:'error',message:'Enter a valid delivery charge of 0 or more.'}))
      return
    }
    try{
      setSavingChargeId(row.id)
      await updateModule({id:row.id,body:{charge:value.toFixed(2)}}).unwrap()
      cancelChargeEdit()
      ok(`${row.name} delivery charge updated to ${money(value)}.`)
    }catch(e){fail(e)}finally{setSavingChargeId(null)}
  }

  const moduleCols:Column<DeliveryModule>[]=[
    {key:'name',header:'Delivery module',render:r=><div><b>{r.name}</b><div className="text-xs text-zinc-400">{r.code}</div></div>},
    {key:'charge',header:'Charge',render:r=>editingChargeId===r.id?
      <div className="flex min-w-[230px] items-center gap-2">
        <div className="relative w-36">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500">BDT</span>
          <Input
            autoFocus
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={chargeDraft}
            onChange={e=>setChargeDraft(e.target.value)}
            onKeyDown={e=>{
              if(e.key==='Enter')void saveCharge(r)
              if(e.key==='Escape')cancelChargeEdit()
            }}
            className="pl-12"
            aria-label={`Delivery charge for ${r.name}`}
          />
        </div>
        <button type="button" className="rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50" disabled={savingChargeId===r.id} onClick={()=>void saveCharge(r)} title="Save charge" aria-label={`Save ${r.name} charge`}><Check size={16}/></button>
        <button type="button" className="rounded-lg border border-zinc-200 bg-white p-2 text-zinc-600 hover:bg-zinc-50" disabled={savingChargeId===r.id} onClick={cancelChargeEdit} title="Cancel" aria-label="Cancel editing charge"><X size={16}/></button>
      </div>
      :<button type="button" className="group inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-left font-bold hover:bg-zinc-50" onClick={()=>startChargeEdit(r)} title={`Edit ${r.name} delivery charge`}>
        <span>{money(r.charge)}</span><Pencil size={14} className="text-zinc-400 transition group-hover:text-pink-700"/>
      </button>},
    {key:'order',header:'Order',render:r=>r.sort_order},
    {key:'status',header:'Status',render:r=><StatusBadge value={r.active?'active':'inactive'}/>},
    {key:'action',header:'',render:r=><button className="btn-secondary py-2" onClick={async()=>{try{await updateModule({id:r.id,body:{active:!r.active}}).unwrap();ok('Delivery module updated.')}catch(e){fail(e)}}}>Turn {r.active?'off':'on'}</button>},
  ]

  const districtCols:Column<District>[]=[
    {key:'name',header:'District',render:r=><div><b>{r.name}</b>{r.source_id&&<div className="text-xs text-zinc-400">Source #{r.source_id}</div>}</div>},
    {key:'module',header:'Default delivery',render:r=><Select value={r.delivery_module??''} onChange={async e=>{try{await updateDistrict({id:r.id,body:{delivery_module:e.target.value?Number(e.target.value):null}}).unwrap();ok(`${r.name} delivery module updated.`)}catch(err){fail(err)}}}><option value="">No module</option>{modules.map(m=><option key={m.id} value={m.id}>{m.name} — {money(m.charge)}</option>)}</Select>},
    {key:'status',header:'Status',render:r=><StatusBadge value={r.active?'active':'inactive'}/>},
    {key:'action',header:'',render:r=><button className="btn-secondary py-2" onClick={async()=>{try{await updateDistrict({id:r.id,body:{active:!r.active}}).unwrap();ok('District updated.')}catch(e){fail(e)}}}>Turn {r.active?'off':'on'}</button>},
  ]

  const thanaCols:Column<Thana>[]=[
    {key:'name',header:'Thana',render:r=><div><b>{r.name}</b><div className="text-xs text-zinc-400">{districtMap.get(r.city)?.name||`District #${r.city}`}</div></div>},
    {key:'override',header:'Delivery override',render:r=><Select value={r.delivery_module??''} onChange={async e=>{try{await updateThana({id:r.id,body:{delivery_module:e.target.value?Number(e.target.value):null}}).unwrap();ok(`${r.name} delivery override updated.`)}catch(err){fail(err)}}}><option value="">Use district default</option>{modules.map(m=><option key={m.id} value={m.id}>{m.name} — {money(m.charge)}</option>)}</Select>},
    {key:'effective',header:'Effective charge',render:r=>{const own=r.delivery_module?moduleMap.get(r.delivery_module):null;const inherited=moduleMap.get(districtMap.get(r.city)?.delivery_module||-1);const m=own||inherited;return m?<div><b>{money(m.charge)}</b><div className="text-xs text-zinc-400">{m.name}</div></div>:'—'}},
    {key:'status',header:'Status',render:r=><StatusBadge value={r.active?'active':'inactive'}/>},
    {key:'action',header:'',render:r=><button className="btn-secondary py-2" onClick={async()=>{try{await updateThana({id:r.id,body:{active:!r.active}}).unwrap();ok('Thana updated.')}catch(e){fail(e)}}}>Turn {r.active?'off':'on'}</button>},
  ]

  const currentQ=tab==='modules'?modulesQ:tab==='districts'?districtsQ:thanasQ
  if(currentQ.isLoading)return <PageLoading/>
  if(currentQ.isError)return <ErrorState onRetry={()=>currentQ.refetch()}/>

  return <>
    <PageHeader title="Delivery Areas" description="Control Dhaka, subarea and outside-Dhaka delivery pricing, district defaults and thana overrides."/>
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      {modules.map(m=><button type="button" key={m.id} onClick={()=>{setTab('modules');startChargeEdit(m)}} className="panel group flex items-center justify-between p-4 text-left transition hover:border-pink-200 hover:bg-pink-50/30" title={`Edit ${m.name} charge`}><div><div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{m.name}</div><div className="mt-1 flex items-center gap-2 text-2xl font-bold"><span>{money(m.charge)}</span><Pencil size={15} className="text-zinc-300 transition group-hover:text-pink-700"/></div></div><span className="rounded-xl bg-pink-50 p-2.5 text-pink-700"><Truck size={19}/></span></button>)}
    </div>
    <div className="panel p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 overflow-x-auto">
          {([['modules','Modules'],['districts','Districts'],['thanas','Thanas']] as const).map(([key,label])=><button key={key} onClick={()=>setTab(key)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tab===key?'bg-zinc-950 text-white':'bg-zinc-100 text-zinc-600'}`}>{label}</button>)}
        </div>
        {tab!=='modules'&&<div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative"><Search size={15} className="absolute left-3 top-3 text-zinc-400"/><Input className="pl-9" placeholder={`Search ${tab}...`} value={search} onChange={e=>setSearch(e.target.value)}/></div>
          {tab==='thanas'&&<Select value={districtFilter} onChange={e=>setDistrictFilter(e.target.value)}><option value="">All districts</option>{allDistricts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</Select>}
        </div>}
      </div>
      {tab==='modules'&&<><div className="mb-3 rounded-xl border border-pink-100 bg-pink-50/50 px-3 py-2 text-xs text-zinc-600">Click any delivery charge or summary card to edit it. Changes are used immediately by delivery quote and checkout calculations.</div><DataTable rows={modules} columns={moduleCols} getKey={r=>r.id}/></>}
      {tab==='districts'&&<DataTable rows={districts} columns={districtCols} getKey={r=>r.id}/>}      
      {tab==='thanas'&&<DataTable rows={thanas} columns={thanaCols} getKey={r=>r.id}/>}      
      {tab==='thanas'&&<div className="mt-4 flex items-start gap-2 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-500"><MapPinned size={16} className="mt-0.5 shrink-0"/><span>Leave a thana override empty to inherit its district delivery module. Assign the Subarea module only to the specific thanas that should charge the subarea rate.</span></div>}
    </div>
  </>
}
