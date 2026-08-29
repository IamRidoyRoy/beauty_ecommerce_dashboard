import {useEffect,useMemo,useState} from 'react'
import {CreditCard,KeyRound,LockKeyhole,Save,ShieldCheck,TestTube2} from 'lucide-react'
import {PageHeader} from '../../components/ui/PageHeader'
import {Field,Input,Switch,Textarea} from '../../components/forms/FormField'
import {PageLoading} from '../../components/ui/Loading'
import {ErrorState} from '../../components/ui/ErrorState'
import {usePaymentGatewayConfigsQuery,useUpdatePaymentGatewayConfigMutation} from '../../services/paymentGatewayApi'
import {useAppDispatch} from '../../store/hooks'
import {toast} from '../../features/ui/uiSlice'
import {apiError} from '../../utils/data'
import type {PaymentGatewayConfig,PaymentGatewayField} from '../../types'

const emptyValues=(fields:PaymentGatewayField[],saved:Record<string,string>)=>Object.fromEntries(fields.map(f=>[f.key,saved?.[f.key]??f.default??'']))

function EnvironmentEditor({title,environment,fields,values,setValues,status,configured}:{
  title:string;environment:'sandbox'|'live';fields:PaymentGatewayField[];values:Record<string,string>;
  setValues:(v:Record<string,string>)=>void;status:Record<string,boolean>;configured:boolean
}){
  return <div className={`rounded-2xl border p-4 ${environment==='sandbox'?'border-amber-200 bg-amber-50/40':'border-zinc-200 bg-white'}`}>
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 font-semibold">{environment==='sandbox'?<TestTube2 size={17}/>:<ShieldCheck size={17}/>} {title}</div>
        <p className="mt-1 text-xs text-zinc-500">{environment==='sandbox'?'Test transactions only. No real settlement.':'Production credentials for real customer payments.'}</p>
      </div>
      <span className={`badge ring-1 ring-inset ${configured?'bg-emerald-50 text-emerald-700 ring-emerald-600/20':'bg-zinc-100 text-zinc-600 ring-zinc-400/20'}`}>{configured?'Configured':'Not configured'}</span>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      {fields.map(field=>{
        const saved=status?.[field.key]
        const common={
          value:values[field.key]??'',
          onChange:(e:any)=>setValues({...values,[field.key]:e.target.value}),
          placeholder:field.secret&&saved?'Saved securely — leave blank to keep':field.placeholder||field.default||'',
          autoComplete:'new-password',
        }
        return <Field key={field.key} label={field.label} required={field.required} hint={field.secret&&saved?'A saved encrypted value already exists. Enter a new value only to replace it.':undefined}>
          {field.multiline?<Textarea {...common} rows={5}/>:<Input {...common} type={field.secret?'password':'text'}/>} 
        </Field>
      })}
    </div>
  </div>
}

function GatewayCard({gateway}:{gateway:PaymentGatewayConfig}){
  const dispatch=useAppDispatch()
  const [update,{isLoading}]=useUpdatePaymentGatewayConfigMutation()
  const [displayName,setDisplayName]=useState(gateway.display_name)
  const [active,setActive]=useState(gateway.is_active)
  const [sandboxMode,setSandboxMode]=useState(gateway.sandbox_mode)
  const [sortOrder,setSortOrder]=useState(String(gateway.sort_order))
  const [sandboxValues,setSandboxValues]=useState<Record<string,string>>(()=>emptyValues(gateway.schema.fields,gateway.sandbox_values))
  const [liveValues,setLiveValues]=useState<Record<string,string>>(()=>emptyValues(gateway.schema.fields,gateway.live_values))

  useEffect(()=>{
    setDisplayName(gateway.display_name);setActive(gateway.is_active);setSandboxMode(gateway.sandbox_mode);setSortOrder(String(gateway.sort_order))
    setSandboxValues(emptyValues(gateway.schema.fields,gateway.sandbox_values));setLiveValues(emptyValues(gateway.schema.fields,gateway.live_values))
  },[gateway])

  const selectedConfigured=sandboxMode?gateway.sandbox_configured:gateway.live_configured
  const environment=sandboxMode?'Sandbox':'Live'
  const save=async()=>{
    try{
      await update({id:gateway.id,body:{display_name:displayName,is_active:active,sandbox_mode:sandboxMode,sort_order:Number(sortOrder||0),sandbox_config:sandboxValues,live_config:liveValues}}).unwrap()
      dispatch(toast({type:'success',message:`${displayName} configuration saved.`}))
    }catch(e){dispatch(toast({type:'error',message:apiError(e)}))}
  }

  return <section className="panel overflow-hidden">
    <div className="border-b border-zinc-100 p-5 md:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-3">
          <span className="rounded-2xl bg-pink-50 p-3 text-pink-800"><CreditCard size={21}/></span>
          <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold">{gateway.schema.label}</h2><span className={`badge ring-1 ring-inset ${active?'bg-emerald-50 text-emerald-700 ring-emerald-600/20':'bg-zinc-100 text-zinc-600 ring-zinc-400/20'}`}>{active?'Active':'Inactive'}</span>{sandboxMode&&<span className="badge bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 ring-inset">Sandbox</span>}</div><p className="mt-1 max-w-2xl text-sm text-zinc-500">{gateway.schema.description}</p></div>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <Switch checked={sandboxMode} onChange={setSandboxMode} label="Sandbox mode"/>
          <Switch checked={active} onChange={setActive} label="Available at checkout"/>
          <button className="btn-brand" disabled={isLoading} onClick={save}><Save size={16}/>{isLoading?'Saving…':'Save gateway'}</button>
        </div>
      </div>
      {active&&!selectedConfigured&&<div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{environment} credentials are incomplete. Saving with Active enabled will be rejected until all required fields are configured.</div>}
      {sandboxMode&&active&&gateway.sandbox_configured&&<div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"><b>Test mode is active.</b> New checkout payments will go to the provider sandbox, not real settlement.</div>}
    </div>
    <div className="grid gap-4 p-5 md:p-6 xl:grid-cols-[260px_1fr]">
      <div className="space-y-4">
        <Field label="Checkout display name"><Input value={displayName} onChange={e=>setDisplayName(e.target.value)}/></Field>
        <Field label="Display order" hint="Lower numbers appear first at checkout."><Input type="number" min={0} value={sortOrder} onChange={e=>setSortOrder(e.target.value)}/></Field>
        <div className="rounded-2xl border border-zinc-200 p-4 text-xs leading-5 text-zinc-500"><div className="mb-2 flex items-center gap-2 font-semibold text-zinc-800"><LockKeyhole size={15}/>Credential security</div>Secret fields are encrypted before database storage and are never returned to the browser after saving.</div>
      </div>
      <div className="grid gap-4 2xl:grid-cols-2">
        <EnvironmentEditor title="Sandbox credentials" environment="sandbox" fields={gateway.schema.fields} values={sandboxValues} setValues={setSandboxValues} status={gateway.sandbox_field_status} configured={gateway.sandbox_configured}/>
        <EnvironmentEditor title="Live credentials" environment="live" fields={gateway.schema.fields} values={liveValues} setValues={setLiveValues} status={gateway.live_field_status} configured={gateway.live_configured}/>
      </div>
    </div>
  </section>
}

export default function PaymentGatewaysPage(){
  const q=usePaymentGatewayConfigsQuery()
  const gateways=useMemo(()=>q.data||[],[q.data])
  if(q.isLoading)return <PageLoading/>
  if(q.isError)return <ErrorState onRetry={()=>q.refetch()}/>
  return <>
    <PageHeader title="Payment Gateways" description="Configure sandbox and live credentials, switch environments, and control which gateways customers can use at checkout."/>
    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800"><KeyRound size={18} className="mt-0.5 shrink-0"/><div><b>Production security:</b> set a stable <code>PAYMENT_CONFIG_ENCRYPTION_KEY</code> on the backend before entering live credentials. Sandbox credentials can be configured and tested independently.</div></div>
    <div className="space-y-5">{gateways.map(g=><GatewayCard key={g.id} gateway={g}/>)}</div>
  </>
}
