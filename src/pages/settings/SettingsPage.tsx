import {useEffect,useState} from 'react'
import {Activity,MapPinned,Plus,ShieldCheck,Truck,Route,Palette} from 'lucide-react'
import {Link} from 'react-router'
import {PageHeader} from '../../components/ui/PageHeader'
import {Field,Input,Switch} from '../../components/forms/FormField'
import {Modal} from '../../components/ui/Modal'
import {DataTable,type Column} from '../../components/ui/DataTable'
import {StatusBadge} from '../../components/ui/StatusBadge'
import {PageLoading} from '../../components/ui/Loading'
import {ErrorState} from '../../components/ui/ErrorState'
import {useSettingsQuery,useUpdateSettingsMutation} from '../../services/settingsApi'
import {useShippingMethodsQuery,useCreateShippingMethodMutation,useUpdateShippingMethodMutation} from '../../services/shippingApi'
import {rowsOf,apiError} from '../../utils/data'
import {money} from '../../utils/format'
import {useAppDispatch} from '../../store/hooks'
import {toast} from '../../features/ui/uiSlice'

export default function SettingsPage(){
  const dispatch=useAppDispatch(); const q=useSettingsQuery(); const [updateSettings]=useUpdateSettingsMutation(); const shippingQ=useShippingMethodsQuery(); const [createShipping]=useCreateShippingMethodMutation(); const [updateShipping]=useUpdateShippingMethodMutation(); const [verify,setVerify]=useState(true); const [open,setOpen]=useState(false); const [shipping,setShipping]=useState<any>({name:'',code:'',base_charge:'0',estimated_days:'',free_threshold:'',active:true})
  useEffect(()=>{if(q.data)setVerify(q.data.existing_customer_otp_verification)},[q.data])
  const save=async()=>{try{await updateSettings({existing_customer_otp_verification:verify}).unwrap();dispatch(toast({type:'success',message:'Checkout verification setting saved.'}))}catch(e){dispatch(toast({type:'error',message:apiError(e)}))}}
  const cols:Column<any>[]=[{key:'name',header:'Shipping method',render:r=><div><b>{r.name}</b><div className="text-xs text-zinc-400">{r.code}</div></div>},{key:'charge',header:'Base charge',render:r=>money(r.base_charge)},{key:'free',header:'Free over',render:r=>r.free_threshold?money(r.free_threshold):'—'},{key:'eta',header:'ETA',render:r=>r.estimated_days||'—'},{key:'status',header:'Status',render:r=><StatusBadge value={r.active?'active':'inactive'}/>},{key:'action',header:'',render:r=><button className="btn-secondary py-2" onClick={()=>updateShipping({id:r.id,body:{active:!r.active}})}>Turn {r.active?'off':'on'}</button>}]
  if(q.isLoading)return <PageLoading/>; if(q.isError)return <ErrorState onRetry={q.refetch}/>
  return <>
    <PageHeader title="Settings" description="Branding, checkout security, integrations, delivery areas and shipping methods." actions={<button className="btn-brand" onClick={save}>Save Settings</button>}/>
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
      <section className="panel p-6"><div className="mb-5 flex items-center gap-3"><span className="rounded-xl bg-violet-50 p-2.5 text-violet-700"><ShieldCheck size={19}/></span><div><h2 className="font-semibold">Existing customer verification</h2><p className="text-xs text-zinc-400">Controls the checkout OTP journey.</p></div></div><div className="rounded-xl border border-zinc-200 p-4"><Switch checked={verify} onChange={setVerify} label="Require OTP before existing-customer account access"/></div><p className="mt-3 text-xs leading-5 text-zinc-500">When enabled, an existing phone places the order and then verifies OTP for account access. Development-only bypass behavior remains controlled by the backend safety configuration.</p></section>
      <section className="panel p-6"><div className="mb-5 flex items-center gap-3"><span className="rounded-xl bg-pink-50 p-2.5 text-pink-700"><MapPinned size={19}/></span><div><h2 className="font-semibold">Delivery pricing</h2><p className="text-xs text-zinc-400">District defaults and thana-level subarea overrides.</p></div></div><Link className="btn-secondary" to="/courier/delivery-areas">Manage Delivery Areas</Link></section>
      <section className="panel p-6"><div className="mb-5 flex items-center gap-3"><span className="rounded-xl bg-sky-50 p-2.5 text-sky-700"><Route size={19}/></span><div><h2 className="font-semibold">Courier integrations</h2><p className="text-xs text-zinc-400">Configure Pathao, Steadfast, RedX and CarryBee, including sandbox/live mode and auto-booking.</p></div></div><Link className="btn-secondary" to="/settings/courier-integrations">Manage Courier Integrations</Link></section>
      <section className="panel p-6"><div className="mb-5 flex items-center gap-3"><span className="rounded-xl bg-pink-50 p-2.5 text-pink-700"><Activity size={19}/></span><div><h2 className="font-semibold">Pixel & Tracking</h2><p className="text-xs text-zinc-400">Manage GTM, Meta Pixel, CAPI and tracking controls from Settings.</p></div></div><Link className="btn-secondary" to="/settings/pixel-tracking">Manage Pixel & Tracking</Link></section>
      <section className="panel p-6"><div className="mb-5 flex items-center gap-3"><span className="rounded-xl bg-amber-50 p-2.5 text-amber-700"><Palette size={19}/></span><div><h2 className="font-semibold">Branding & Theme</h2><p className="text-xs text-zinc-400">Website/dashboard logo or text identity plus storefront primary and secondary colors.</p></div></div><Link className="btn-secondary" to="/settings/branding">Manage Branding</Link></section>
    </div>
    <section className="mt-6"><PageHeader title="Shipping Methods" description="Checkout delivery services and free-shipping thresholds." actions={<button className="btn-secondary" onClick={()=>setOpen(true)}><Plus size={15}/>Add Method</button>}/>{shippingQ.isError?<ErrorState onRetry={shippingQ.refetch}/>:<DataTable rows={rowsOf<any>(shippingQ.data)} columns={cols} getKey={r=>r.id}/>}</section>
    <Modal open={open} onClose={()=>setOpen(false)} title="Add shipping method"><div className="space-y-4"><Field label="Name"><Input value={shipping.name} onChange={e=>setShipping({...shipping,name:e.target.value})}/></Field><Field label="Code"><Input value={shipping.code} onChange={e=>setShipping({...shipping,code:e.target.value.toLowerCase().replace(/\s+/g,'_')})}/></Field><div className="grid grid-cols-2 gap-3"><Field label="Base charge"><Input type="number" min="0" value={shipping.base_charge} onChange={e=>setShipping({...shipping,base_charge:e.target.value})}/></Field><Field label="Free threshold"><Input type="number" min="0" value={shipping.free_threshold} onChange={e=>setShipping({...shipping,free_threshold:e.target.value})}/></Field></div><Field label="Estimated days"><Input placeholder="1-3 business days" value={shipping.estimated_days} onChange={e=>setShipping({...shipping,estimated_days:e.target.value})}/></Field><button className="btn-brand w-full" onClick={async()=>{try{await createShipping({...shipping,free_threshold:shipping.free_threshold||null}).unwrap();setOpen(false);dispatch(toast({type:'success',message:'Shipping method created.'}))}catch(e){dispatch(toast({type:'error',message:apiError(e)}))}}}><Truck size={16}/>Create Method</button></div></Modal>
  </>
}
