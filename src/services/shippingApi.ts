import {baseApi,unwrap} from './baseApi'
import {rowsOf} from '../utils/data'
import type {CourierConfig,Shipment} from '../types'
const tr=(x:any)=>unwrap(x)
export const shippingApi=baseApi.injectEndpoints({endpoints:b=>({
  shippingMethods:b.query<any,void>({query:()=>'/admin/shipping/',transformResponse:tr,providesTags:['Shipping']}),
  createShippingMethod:b.mutation<any,any>({query:body=>({url:'/admin/shipping/',method:'POST',body}),transformResponse:tr,invalidatesTags:['Shipping']}),
  updateShippingMethod:b.mutation<any,{id:number;body:any}>({query:x=>({url:`/admin/shipping/${x.id}/`,method:'PATCH',body:x.body}),transformResponse:tr,invalidatesTags:['Shipping']}),
  shipments:b.query<any,Record<string,any>|void>({query:p=>({url:'/admin/shipments/',params:p||{}}),transformResponse:tr,providesTags:['Shipments']}),
  availableCouriers:b.query<any[],void>({query:()=>'/admin/shipments/available-couriers/',transformResponse:tr,providesTags:['CourierConfigs']}),
  bookShipment:b.mutation<Shipment,{order:number;provider:string;options?:Record<string,any>}>({query:body=>({url:'/admin/shipments/book/',method:'POST',body}),transformResponse:tr,invalidatesTags:['Shipments','Orders','Dashboard','Reports']}),
  trackShipment:b.mutation<Shipment,number>({query:id=>({url:`/admin/shipments/${id}/track/`,method:'POST'}),transformResponse:tr,invalidatesTags:['Shipments','Orders','Dashboard','Reports']}),
  cancelShipment:b.mutation<Shipment,{id:number;reason?:string}>({query:x=>({url:`/admin/shipments/${x.id}/cancel/`,method:'POST',body:{reason:x.reason||''}}),transformResponse:tr,invalidatesTags:['Shipments','Orders','Dashboard','Reports']}),
  requestShipmentReturn:b.mutation<any,{id:number;reason?:string}>({query:x=>({url:`/admin/shipments/${x.id}/request-return/`,method:'POST',body:{reason:x.reason||''}}),transformResponse:tr,invalidatesTags:['Shipments']}),
  shipmentHistory:b.query<any[],number>({query:id=>`/admin/shipments/${id}/history/`,transformResponse:tr}),
  courierConfigs:b.query<CourierConfig[],void>({query:()=>'/admin/courier-configs/',transformResponse:(x:any)=>rowsOf<CourierConfig>(tr(x)),providesTags:['CourierConfigs']}),
  updateCourierConfig:b.mutation<CourierConfig,{id:number;body:any}>({query:x=>({url:`/admin/courier-configs/${x.id}/`,method:'PATCH',body:x.body}),transformResponse:tr,invalidatesTags:['CourierConfigs','Shipments']}),
  testCourierConnection:b.mutation<any,number>({query:id=>({url:`/admin/courier-configs/${id}/test-connection/`,method:'POST'}),transformResponse:tr}),
})})
export const {useShippingMethodsQuery,useCreateShippingMethodMutation,useUpdateShippingMethodMutation,useShipmentsQuery,useAvailableCouriersQuery,useBookShipmentMutation,useTrackShipmentMutation,useCancelShipmentMutation,useRequestShipmentReturnMutation,useShipmentHistoryQuery,useLazyShipmentHistoryQuery,useCourierConfigsQuery,useUpdateCourierConfigMutation,useTestCourierConnectionMutation}=shippingApi
