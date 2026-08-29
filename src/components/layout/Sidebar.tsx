import {NavLink} from 'react-router'
import {LayoutDashboard,Package,Boxes,ShoppingCart,Users,Tags,RotateCcw,BarChart3,UserCog,Settings,ChevronDown,X,ShoppingBasket} from 'lucide-react'
import {useState} from 'react'
import {useAppDispatch,useAppSelector} from '../../store/hooks'
import {toggleSidebar} from '../../features/ui/uiSlice'
import {can} from '../../utils/permissions'

type NavItem={label:string;to?:string;icon?:any;area?:string;children?:NavItem[]}

// Operational priority: Dashboard first, Sales second. The remaining business
// modules follow the normal catalog -> stock -> procurement workflow.
const nav:NavItem[]=[
  {label:'Dashboard',to:'/',icon:LayoutDashboard},
  {label:'Sales',icon:ShoppingCart,children:[
    {label:'Orders',to:'/sales/orders',area:'orders'},
    {label:'Payments',to:'/sales/payments',area:'payments'},
    {label:'Shipments',to:'/sales/shipments',area:'shipping'},
    {label:'Delivery Areas',to:'/sales/delivery',area:'shipping'},
  ]},
  {label:'Catalog',icon:Package,area:'catalog',children:[
    {label:'Products',to:'/catalog/products'},
    {label:'Categories',to:'/catalog/categories'},
    {label:'Brands',to:'/catalog/brands'},
    {label:'Attributes',to:'/catalog/attributes'},
    {label:'Shades',to:'/catalog/shades'},
    {label:'Product Images',to:'/catalog/images'},
  ]},
  {label:'Inventory',icon:Boxes,area:'inventory',children:[
    {label:'Stock',to:'/inventory/stock'},
    {label:'Warehouses',to:'/inventory/warehouses'},
    {label:'Stock Movements',to:'/inventory/movements'},
    {label:'Adjustments',to:'/inventory/adjustments'},
    {label:'Transfers',to:'/inventory/transfers'},
  ]},
  {label:'Procurement',icon:ShoppingBasket,area:'procurement',children:[
    {label:'Purchases',to:'/procurement/purchases'},
    {label:'Suppliers',to:'/procurement/suppliers'},
  ]},
  {label:'Customers',to:'/customers',icon:Users,area:'customers'},
  {label:'Marketing',icon:Tags,area:'marketing',children:[
    {label:'Coupons',to:'/marketing/coupons'},
    {label:'Promotions',to:'/marketing/promotions'},
    {label:'Campaigns',to:'/marketing/campaigns'},
    {label:'Pixel & Tracking',to:'/marketing/tracking'},
  ]},
  {label:'After Sales',icon:RotateCcw,children:[
    {label:'Reviews',to:'/after-sales/reviews',area:'reviews'},
    {label:'Returns',to:'/after-sales/returns',area:'returns'},
    {label:'Refunds',to:'/after-sales/refunds',area:'refunds'},
  ]},
  {label:'Reports',to:'/reports',icon:BarChart3,area:'reports'},
  {label:'Users & Roles',to:'/staff',icon:UserCog,area:'staff'},
  {label:'Settings',icon:Settings,children:[
    {label:'General',to:'/settings',area:'settings'},
    {label:'Payment Gateways',to:'/settings/payment-gateways',area:'payment_gateways'},
    {label:'Courier Integrations',to:'/settings/courier-integrations',area:'courier_gateways'},
  ]},
]

function allowed(role:any,item:NavItem,parentArea?:string){return !item.area&&!parentArea||can(role,item.area||parentArea!)}

function Group({item,role}:{item:NavItem;role:any}){
  const [open,setOpen]=useState(true)
  if(item.children){
    const children=item.children.filter(c=>allowed(role,c,item.area))
    if(!children.length)return null
    return <div>
      <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100" onClick={()=>setOpen(!open)}>
        {item.icon&&<item.icon size={18}/>}<span className="flex-1 text-left">{item.label}</span><ChevronDown size={15} className={`transition ${open?'rotate-180':''}`}/>
      </button>
      {open&&<div className="ml-5 border-l border-zinc-200 pl-3">
        {children.map(c=><NavLink key={c.to} to={c.to!} className={({isActive})=>`my-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive?'bg-pink-50 font-semibold text-pink-800':'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'}`}>
          {c.icon&&<c.icon size={15}/>} {c.label}
        </NavLink>)}
      </div>}
    </div>
  }
  if(!allowed(role,item))return null
  // Standalone navigation uses the same soft active treatment as child links.
  return <NavLink to={item.to!} className={({isActive})=>`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${isActive?'bg-pink-50 font-semibold text-pink-800':'text-zinc-600 hover:bg-zinc-100'}`}>
    {item.icon&&<item.icon size={18}/>} {item.label}
  </NavLink>
}

export function Sidebar(){
  const role=useAppSelector(s=>s.auth.user?.role),mobile=useAppSelector(s=>s.ui.sidebarOpen),dispatch=useAppDispatch()
  return <>
    <div className={`no-print fixed inset-0 z-40 bg-zinc-950/30 lg:hidden ${mobile?'block':'hidden'}`} onClick={()=>dispatch(toggleSidebar(false))}/>
    <aside className={`no-print fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-zinc-200 bg-white transition-transform lg:translate-x-0 ${mobile?'translate-x-0':'-translate-x-full'}`}>
      <div className="flex h-18 items-center justify-between border-b border-zinc-100 px-5"><div><div className="text-lg font-black tracking-tight text-zinc-950">BEAUTY<span className="text-pink-700">OPS</span></div><div className="text-[10px] font-semibold uppercase tracking-[.24em] text-zinc-400">Commerce Control</div></div><button className="rounded-lg p-2 hover:bg-zinc-100 lg:hidden" onClick={()=>dispatch(toggleSidebar(false))}><X size={18}/></button></div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">{nav.map(n=><Group key={n.label} item={n} role={role}/>)}</nav>
      <div className="border-t border-zinc-100 p-4 text-xs leading-5 text-zinc-400">Operational dashboard<br/>DRF management API</div>
    </aside>
  </>
}
