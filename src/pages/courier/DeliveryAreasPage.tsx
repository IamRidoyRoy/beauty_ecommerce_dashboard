import {useMemo,useState} from 'react'
import {MapPinned,Search,Truck} from 'lucide-react'
import {PageHeader} from '../../components/ui/PageHeader'
import {DataTable,type Column} from '../../components/ui/DataTable'
import {StatusBadge} from '../../components/ui/StatusBadge'
import {Field,Input,Select} from '../../components/forms/FormField'
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

  const moduleCols:Column<DeliveryModule>[]=[
    {key:'name',header:'Delivery module',render:r=><div><b>{r.name}</b><div className="text-xs text-zinc-400">{r.code}</div></div>},
    {key:'charge',header:'Charge',render:r=><b>{money(r.charge)}</b>},
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
      {modules.map(m=><div key={m.id} className="panel flex items-center justify-between p-4"><div><div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">{m.name}</div><div className="mt-1 text-2xl font-bold">{money(m.charge)}</div></div><span className="rounded-xl bg-pink-50 p-2.5 text-pink-700"><Truck size={19}/></span></div>)}
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
      {tab==='modules'&&<DataTable rows={modules} columns={moduleCols} getKey={r=>r.id}/>}      
      {tab==='districts'&&<DataTable rows={districts} columns={districtCols} getKey={r=>r.id}/>}      
      {tab==='thanas'&&<DataTable rows={thanas} columns={thanaCols} getKey={r=>r.id}/>}      
      {tab==='thanas'&&<div className="mt-4 flex items-start gap-2 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-500"><MapPinned size={16} className="mt-0.5 shrink-0"/><span>Leave a thana override empty to inherit its district delivery module. Assign the Subarea module only to the specific thanas that should charge the subarea rate.</span></div>}
    </div>
  </>
}
