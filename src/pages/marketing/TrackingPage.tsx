import {useEffect,useMemo,useState} from 'react'
import {Activity,CheckCircle2,Code2,ExternalLink,KeyRound,ServerCog,Tag,TestTube2} from 'lucide-react'
import {PageHeader} from '../../components/ui/PageHeader'
import {Field,Input,Switch} from '../../components/forms/FormField'
import {DataTable,type Column} from '../../components/ui/DataTable'
import {StatusBadge} from '../../components/ui/StatusBadge'
import {PageLoading} from '../../components/ui/Loading'
import {ErrorState} from '../../components/ui/ErrorState'
import {useTrackingEventsQuery,useTrackingSettingsQuery,useTestTrackingMutation,useUpdateTrackingSettingsMutation,type TrackingEventLog} from '../../services/trackingApi'
import {apiError,rowsOf} from '../../utils/data'
import {useAppDispatch} from '../../store/hooks'
import {toast} from '../../features/ui/uiSlice'

const EVENTS=['PageView','ViewContent','Search','AddToCart','AddToWishlist','InitiateCheckout','Purchase'] as const

export default function TrackingPage(){
  const dispatch=useAppDispatch()
  const q=useTrackingSettingsQuery()
  const eventsQ=useTrackingEventsQuery({page_size:25})
  const [save,{isLoading:saving}]=useUpdateTrackingSettingsMutation()
  const [test,{isLoading:testing}]=useTestTrackingMutation()
  const [form,setForm]=useState<any>({
    enabled:false,browser_tracking_enabled:true,server_tracking_enabled:true,require_marketing_consent:false,
    gtm_container_id:'',meta_pixel_id:'',meta_api_version:'v26.0',meta_access_token:'',meta_test_event_code:'',currency:'BDT',enabled_events:{}
  })

  useEffect(()=>{if(q.data)setForm({...q.data,meta_access_token:''})},[q.data])
  const configured=Boolean(form.gtm_container_id&&form.meta_pixel_id&&(q.data?.has_access_token||form.meta_access_token))

  const update=(key:string,value:any)=>setForm((current:any)=>({...current,[key]:value}))
  const toggleEvent=(name:string,value:boolean)=>setForm((current:any)=>({...current,enabled_events:{...(current.enabled_events||{}),[name]:value}}))

  const submit=async()=>{
    const body:any={...form}
    if(!body.meta_access_token)delete body.meta_access_token
    try{
      await save(body).unwrap()
      setForm((current:any)=>({...current,meta_access_token:''}))
      dispatch(toast({type:'success',message:'Tracking settings saved. Storefront configuration updates without a rebuild.'}))
    }catch(e){dispatch(toast({type:'error',message:apiError(e)}))}
  }

  const runTest=async()=>{
    try{
      await test({event_source_url:window.location.origin}).unwrap()
      dispatch(toast({type:'success',message:'Meta Conversions API test event sent. Check Test Events in Meta Events Manager.'}))
    }catch(e){dispatch(toast({type:'error',message:apiError(e)}))}
  }

  const cols:Column<TrackingEventLog>[] = useMemo(()=>[
    {key:'event',header:'Event',render:r=><div><b className="text-zinc-900">{r.event_name}</b><div className="max-w-[260px] truncate text-xs text-zinc-400" title={r.event_id}>{r.event_id}</div></div>},
    {key:'order',header:'Order',render:r=>r.order_number||'—'},
    {key:'status',header:'Status',render:r=><StatusBadge value={r.status}/>},
    {key:'http',header:'HTTP',render:r=>r.http_status??'—'},
    {key:'time',header:'Time',render:r=>new Date(r.created_at).toLocaleString()},
    {key:'message',header:'Message',render:r=><span className="block max-w-[300px] truncate text-xs text-zinc-500" title={r.error_message||''}>{r.error_message||'—'}</span>},
  ],[])

  if(q.isLoading)return <PageLoading/>
  if(q.isError)return <ErrorState onRetry={q.refetch}/>

  return <>
    <PageHeader
      title="Pixel & Conversion Tracking"
      description="Control Google Tag Manager browser Pixel events and Meta Conversions API server-side tracking from BEAUTYOPS."
      actions={<>
        <button className="btn-secondary" disabled={!configured||testing} onClick={()=>void runTest()}><TestTube2 size={16}/>{testing?'Sending…':'Send CAPI Test'}</button>
        <button className="btn-brand" disabled={saving} onClick={()=>void submit()}><CheckCircle2 size={16}/>{saving?'Saving…':'Save Tracking'}</button>
      </>}
    />

    <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <div className="space-y-5">
        <section className="panel p-6">
          <div className="mb-5 flex items-center gap-3"><span className="rounded-xl bg-pink-50 p-2.5 text-pink-700"><Activity size={19}/></span><div><h2 className="font-semibold">Tracking controls</h2><p className="text-xs text-zinc-400">One switch can pause all marketing tracking without a code deployment.</p></div></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 p-4"><Switch checked={Boolean(form.enabled)} onChange={v=>update('enabled',v)} label="Enable marketing tracking"/></div>
            <div className="rounded-xl border border-zinc-200 p-4"><Switch checked={Boolean(form.require_marketing_consent)} onChange={v=>update('require_marketing_consent',v)} label="Require marketing consent"/></div>
            <div className="rounded-xl border border-zinc-200 p-4"><Switch checked={Boolean(form.browser_tracking_enabled)} onChange={v=>update('browser_tracking_enabled',v)} label="Browser events through GTM"/></div>
            <div className="rounded-xl border border-zinc-200 p-4"><Switch checked={Boolean(form.server_tracking_enabled)} onChange={v=>update('server_tracking_enabled',v)} label="Server events through Meta CAPI"/></div>
          </div>
        </section>

        <section className="panel p-6">
          <div className="mb-5 flex items-center gap-3"><span className="rounded-xl bg-violet-50 p-2.5 text-violet-700"><Tag size={19}/></span><div><h2 className="font-semibold">Google Tag Manager + Meta Pixel</h2><p className="text-xs text-zinc-400">The storefront loads this GTM web container dynamically and pushes deduplicated Meta event payloads into dataLayer.</p></div></div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="GTM Web Container ID" hint="Example: GTM-ABC1234"><Input value={form.gtm_container_id||''} onChange={e=>update('gtm_container_id',e.target.value.toUpperCase())} placeholder="GTM-XXXXXXX"/></Field>
            <Field label="Meta Pixel ID"><Input value={form.meta_pixel_id||''} onChange={e=>update('meta_pixel_id',e.target.value.replace(/\D/g,''))} placeholder="123456789012345"/></Field>
            <Field label="Graph API Version" hint="Pinned so an API release cannot silently change production behavior."><Input value={form.meta_api_version||'v26.0'} onChange={e=>update('meta_api_version',e.target.value)} placeholder="v26.0"/></Field>
            <Field label="Currency"><Input value={form.currency||'BDT'} maxLength={8} onChange={e=>update('currency',e.target.value.toUpperCase())}/></Field>
          </div>
        </section>

        <section className="panel p-6">
          <div className="mb-5 flex items-center gap-3"><span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><ServerCog size={19}/></span><div><h2 className="font-semibold">Meta Conversions API</h2><p className="text-xs text-zinc-400">Access token is encrypted at rest and never returned to the dashboard or public storefront API.</p></div></div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Conversions API Access Token" hint={q.data?.has_access_token?'A token is already configured. Leave blank to keep it.':'Paste the token generated in Meta Events Manager.'}>
              <Input type="password" autoComplete="new-password" value={form.meta_access_token||''} onChange={e=>update('meta_access_token',e.target.value)} placeholder={q.data?.masked_access_token||'Paste token'}/>
            </Field>
            <Field label="Test Event Code" hint="Optional. Use while validating Events Manager → Test Events."><Input value={form.meta_test_event_code||''} onChange={e=>update('meta_test_event_code',e.target.value)} placeholder="TEST12345"/></Field>
          </div>
          <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs leading-5 text-zinc-600">
            <b>Purchase tracking is authoritative on the Django server.</b> Browser GTM fires the same <code>event_id</code>, allowing Meta to deduplicate Pixel and CAPI events instead of double-counting one order.
          </div>
        </section>

        <section className="panel p-6">
          <div className="mb-4"><h2 className="font-semibold">Tracked commerce events</h2><p className="mt-1 text-xs text-zinc-400">Disable an event here to stop both its browser Pixel and server CAPI delivery.</p></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EVENTS.map(name=><div key={name} className="rounded-xl border border-zinc-200 p-4"><Switch checked={form.enabled_events?.[name]!==false} onChange={v=>toggleEvent(name,v)} label={name}/></div>)}
          </div>
        </section>
      </div>

      <div className="space-y-5">
        <section className="panel p-6">
          <div className="mb-4 flex items-center gap-3"><span className="rounded-xl bg-zinc-100 p-2.5 text-zinc-700"><Code2 size={19}/></span><div><h2 className="font-semibold">Connection status</h2><p className="text-xs text-zinc-400">Production readiness at a glance.</p></div></div>
          <div className="space-y-3 text-sm">
            <Row label="Master tracking" value={form.enabled?'Enabled':'Disabled'} ok={Boolean(form.enabled)}/>
            <Row label="GTM container" value={form.gtm_container_id||'Not configured'} ok={Boolean(form.gtm_container_id)}/>
            <Row label="Meta Pixel" value={form.meta_pixel_id||'Not configured'} ok={Boolean(form.meta_pixel_id)}/>
            <Row label="CAPI token" value={q.data?.has_access_token?'Configured':'Not configured'} ok={Boolean(q.data?.has_access_token)}/>
            <Row label="Last CAPI test" value={q.data?.last_test_status||'Not tested'} ok={q.data?.last_test_status==='success'}/>
          </div>
          {q.data?.last_test_message&&<p className="mt-4 rounded-xl bg-zinc-50 p-3 text-xs leading-5 text-zinc-600">{q.data.last_test_message}</p>}
        </section>

        <section className="panel p-6">
          <div className="flex items-start gap-3"><KeyRound size={18} className="mt-0.5 text-pink-700"/><div><h3 className="font-semibold">One-time GTM setup</h3><p className="mt-1 text-xs leading-5 text-zinc-500">Create a Custom Event trigger named <b>meta_event</b> and configure your Meta Pixel tag to read the dataLayer variables provided by the storefront: <code>meta_pixel_id</code>, <code>meta_event_name</code>, <code>event_id</code>, and <code>custom_data</code>.</p><a className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-pink-700 hover:underline" href="https://tagmanager.google.com/" target="_blank" rel="noreferrer">Open Google Tag Manager <ExternalLink size={12}/></a></div></div>
        </section>
      </div>
    </div>

    <section className="mt-6">
      <PageHeader title="Recent server events" description="CAPI delivery log. It intentionally excludes raw customer identifiers and the access token." actions={<button className="btn-secondary" onClick={()=>eventsQ.refetch()}>Refresh</button>}/>
      {eventsQ.isError?<ErrorState onRetry={eventsQ.refetch}/>:<DataTable rows={rowsOf<TrackingEventLog>(eventsQ.data)} columns={cols} getKey={r=>r.id}/>} 
    </section>
  </>
}

function Row({label,value,ok}:{label:string;value:string;ok:boolean}){return <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-3 py-2.5"><span className="text-zinc-500">{label}</span><span className={`font-semibold ${ok?'text-emerald-700':'text-zinc-700'}`}>{value}</span></div>}
