export type Role='super_admin'|'admin'|'manager'|'product_manager'|'inventory_manager'|'order_manager'|'customer_support'|'marketing_manager'|'finance_manager'|'customer'
export type ApiEnvelope<T>={success:boolean;message:string;data:T;errors?:Record<string,unknown>}
export type Paginated<T>={count:number;next:string|null;previous:string|null;results:T[]}
export type User={id:number;uuid:string;full_name:string;email?:string|null;phone?:string|null;role:Role;is_active?:boolean;is_staff?:boolean;is_superuser?:boolean;created_at?:string;updated_at?:string}
export type Brand={id:number;name:string;slug:string;logo?:string|null;cover?:string|null;description?:string;country?:string;website?:string;featured:boolean;active:boolean;seo?:Record<string,unknown>}
export type Category={id:number;name:string;slug:string;parent?:number|null;image?:string|null;description?:string;active:boolean;order?:number;seo?:Record<string,unknown>}
export type Attribute={id:number;name:string;slug:string;display_order?:number;is_variant?:boolean;type?:string}
export type AttributeValue={id:number;attribute:number;value:string;slug:string;swatch?:string;metadata?:Record<string,unknown>}
export type ProductImage={id:number;product:number;variant?:number|null;image:string;image_type?:string;alt_text?:string;order:number;is_primary:boolean}
export type ProductVariant={id:number;uuid?:string;product:number;sku:string;barcode?:string;price_override?:string|null;cost_price?:string;weight?:string|null;is_active:boolean;available_stock?:number;attribute_value_ids?:number[];attributes?:Array<{id:number;attribute:string;value:string;slug:string;swatch?:string}>}
export type Product={id:number;uuid:string;name:string;slug:string;product_type:'simple'|'variable';sku?:string;barcode?:string;base_price:string;compare_at_price?:string|null;cost_price?:string;brand:number|Brand;category:number|Category;status:string;short_description?:string;description?:string;weight?:string|null;tax_class?:string;seo?:{title?:string;description?:string;[key:string]:unknown};featured:boolean;new_arrival:boolean;bestseller:boolean;trending:boolean;available_stock?:number;primary_image?:ProductImage|null;created_at?:string;updated_at?:string;published_at?:string|null;variants?:ProductVariant[];images?:ProductImage[]}
export type StockRow={id:number;stock_item:number;stock_item_detail:{id:number;product?:number|null;variant?:number|null;sku:string;name:string;variant_label?:string;retail_price?:string;cost_price?:string;category_id?:number;brand_id?:number};warehouse:number;warehouse_name:string;available_stock:number;reserved_stock:number;damaged_stock:number;incoming_stock:number;reorder_level:number;low_stock_threshold:number;updated_at:string}
export type Warehouse={id:number;name:string;code?:string;phone?:string;address?:string;warehouse_type?:number;is_active:boolean}
export type Supplier={id:number;name:string;contact_person?:string;phone?:string;email?:string;address?:string;payment_terms?:string;notes?:string;is_active:boolean}
export type PurchaseItem={id:number;purchase:number;product?:number|null;product_variant?:number|null;quantity:number;received_quantity:number;remaining_quantity:number;unit_cost:string;discount:string;tax:string;total:string;target_name?:string;target_sku?:string;target_image?:string|null;variant_label?:string}
export type Purchase={id:number;purchase_number:string;supplier:number;warehouse:number;supplier_invoice?:string;purchase_date?:string;expected_date?:string;subtotal:string;discount:string;tax:string;total:string;status:string;created_by?:number;approved_by?:number|null;received_by?:number|null;created_at:string;received_at?:string|null;items:PurchaseItem[]}
export type OrderItem={id:number;product:number;variant?:number|null;product_name_snapshot:string;sku_snapshot:string;variant_snapshot?:Record<string,string>|null;image_snapshot?:string;quantity:number;unit_price:string;discount:string;tax:string;total:string;cost_price_snapshot?:string;returned_quantity:number}
export type Payment={id:number;public_token?:string;order:number;order_number?:string;customer_name?:string;customer_phone?:string;method:string;currency?:string;transaction_id?:string;gateway_reference?:string;amount:string;status:string;initiated_at?:string|null;paid_at?:string|null;last_verified_at?:string|null;failure_code?:string;failure_message?:string;metadata?:Record<string,any>;created_at?:string;updated_at?:string}
export type Shipment={id:number;order:number;order_number?:string;customer_name?:string;customer_phone?:string;courier:string;courier_display?:string;environment?:'sandbox'|'live'|string;external_id?:string;tracking_code?:string;status:string;provider_status?:string;provider_message?:string;booking_source?:string;last_synced_at?:string|null;booked_at?:string|null;picked_up_at?:string|null;dispatched_at?:string|null;delivered_at?:string|null;cancelled_at?:string|null;can_cancel?:boolean;created_at?:string;updated_at?:string}

export type CourierDispatchOrder={
  id:number;order_number:string;customer_name:string;customer_phone:string;shipping_address_snapshot:Record<string,string>;
  total:string;order_status:'packed'|'shipped'|string;payment_status:string;item_count:number;submitted_courier:string;
  submitted_courier_display:string;tracking_code:string;shipment_status:string;shipment_id?:number|null;can_submit:boolean;
  created_at:string;updated_at:string;
}

export type CourierField={key:string;label:string;required:boolean;secret:boolean;multiline?:boolean;placeholder?:string;default?:string}
export type CourierSchema={label:string;description:string;fields:CourierField[];supports_sandbox:boolean;supports_cancel:boolean;sandbox_base_url?:string;live_base_url?:string}
export type CourierConfig={id:number;provider:'pathao'|'steadfast'|'redx'|'carrybee'|string;display_name:string;is_active:boolean;sandbox_mode:boolean;sort_order:number;auto_book_enabled:boolean;auto_book_order_status:string;cancel_api_enabled:boolean;schema:CourierSchema;sandbox_values:Record<string,string>;live_values:Record<string,string>;sandbox_field_status:Record<string,boolean>;live_field_status:Record<string,boolean>;sandbox_configured:boolean;live_configured:boolean;current_environment:'sandbox'|'live';current_environment_configured:boolean;updated_by_name?:string;created_at?:string;updated_at?:string}
export type Order={id:number;uuid:string;order_number:string;user?:number|null;customer_name:string;customer_phone:string;shipping_address_snapshot:Record<string,string>;shipping_method:number;shipping_method_name?:string;coupon_code_snapshot?:string;promotion_snapshot?:Array<Record<string,any>>;subtotal:string;discount:string;shipping_charge:string;tax:string;total:string;order_status:string;payment_status:string;fulfillment_status:string;notes?:string;items:OrderItem[];payments:Payment[];shipments?:Shipment[];created_at:string;updated_at:string}
export type ReturnRequest={id:number;order:number;user:number;reason:string;status:string;notes?:string;items:Array<{id:number;order_item:number;quantity:number;reason:string;restock:boolean}>;created_at:string;updated_at:string}
export type Refund={id:number;order:number;payment:number;amount:string;reason?:string;status:string;gateway_reference?:string;created_at:string;completed_at?:string|null}
export type Review={id:number;user:number;product:number;order_item?:number|null;rating:number;title?:string;comment:string;status:string;verified_purchase:boolean;images:Array<{id:number;image:string;order:number}>;created_at:string}
export type DashboardData={orders:number;revenue:string|number;aov:string|number;units_sold:number;gross_profit:string|number;customers:number;pending_orders:number;return_requests:number;low_stock_rows:number;out_of_stock_rows:number}
export type SearchResult={type:string;id:number;title:string;subtitle:string;url:string}
export type CheckoutSettings={id:number;existing_customer_otp_verification:boolean;created_at?:string;updated_at?:string}
export type BusinessSettings=CheckoutSettings
export type PaymentGatewayField={key:string;label:string;required:boolean;secret:boolean;multiline?:boolean;placeholder?:string;default?:string}
export type PaymentGatewaySchema={label:string;description:string;fields:PaymentGatewayField[];sandbox_base_url?:string;live_base_url?:string}
export type PaymentGatewayConfig={
  id:number;provider:'sslcommerz'|'bkash'|'nagad'|string;display_name:string;is_active:boolean;sandbox_mode:boolean;sort_order:number;
  schema:PaymentGatewaySchema;sandbox_values:Record<string,string>;live_values:Record<string,string>;
  sandbox_field_status:Record<string,boolean>;live_field_status:Record<string,boolean>;
  sandbox_configured:boolean;live_configured:boolean;current_environment:'sandbox'|'live';current_environment_configured:boolean;
  updated_by?:number|null;updated_by_name?:string;created_at?:string;updated_at?:string
}
export type PaymentMethodOption={code:string;display_name:string;provider:string;environment:string;sort_order:number}

export type SiteBranding={
  id:number;
  website_brand_mode:'text'|'logo';website_name:string;website_tagline:string;website_logo?:string|null;
  dashboard_brand_mode:'text'|'logo';dashboard_name:string;dashboard_tagline:string;dashboard_logo?:string|null;
  primary_color:string;secondary_color:string;created_at?:string;updated_at?:string;
}
