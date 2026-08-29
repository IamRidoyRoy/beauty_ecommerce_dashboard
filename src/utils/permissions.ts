import type {Role,User} from '../types'

export const roleLabels:Record<Role,string>={super_admin:'Super Admin',admin:'Admin',manager:'Manager',product_manager:'Product Manager',inventory_manager:'Inventory Manager',order_manager:'Order Manager',customer_support:'Customer Support',marketing_manager:'Marketing Manager',finance_manager:'Finance Manager',customer:'Customer'}

const ALL_BY_ROLE:Partial<Record<Role,string[]>>={
 product_manager:['catalog_products','catalog_categories','catalog_brands','catalog_attributes','catalog_shades','catalog_images','reports'],
 inventory_manager:['inventory_stock','inventory_warehouses','inventory_movements','inventory_adjustments','inventory_transfers','procurement_purchases','procurement_suppliers','reports'],
 order_manager:['orders_view','orders_write','courier_orders','courier_shipments','courier_delivery_areas','returns','reports'],
 customer_support:['orders_view','customers','returns','reviews'],
 marketing_manager:['marketing_coupons','marketing_promotions','marketing_campaigns','marketing_homepage','settings_pixel_tracking','reports'],
 finance_manager:['payments','refunds','reports'],
 customer:[],
}

const managerDenied=new Set(['staff','settings_payment_gateways'])
const legacy:Record<string,string[]>={
 catalog:['catalog_products','catalog_categories','catalog_brands','catalog_attributes','catalog_shades','catalog_images'],
 inventory:['inventory_stock','inventory_warehouses','inventory_movements','inventory_adjustments','inventory_transfers'],
 procurement:['procurement_purchases','procurement_suppliers'],
 orders:['orders_view'],order_write:['orders_view','orders_write'],
 shipping:['courier_orders','courier_shipments','courier_delivery_areas'],
 marketing:['marketing_coupons','marketing_promotions','marketing_campaigns','marketing_homepage','settings_pixel_tracking'],
 settings:['settings_general','settings_branding'],payment_gateways:['settings_payment_gateways'],courier_gateways:['settings_courier_integrations'],
}

const roleCan=(role:Role|undefined,area:string)=>{
 if(!role)return false
 if(role==='super_admin'||role==='admin')return true
 if(role==='manager')return !managerDenied.has(area)
 return (ALL_BY_ROLE[role]||[]).includes(area)
}

const expandedModules=(modules:string[]|undefined)=>{
 const out=new Set<string>()
 for(const key of modules||[])for(const value of legacy[key]||[key])out.add(value)
 if(out.has('orders_write'))out.add('orders_view')
 return out
}

export const can=(subject:Role|User|undefined|null,area:string)=>{
 const role=typeof subject==='string'?subject:subject?.role
 if(!roleCan(role,area))return false
 if(typeof subject==='object'&&subject&&Array.isArray(subject.dashboard_modules)&&!subject.is_superuser)return expandedModules(subject.dashboard_modules).has(area)
 return true
}
