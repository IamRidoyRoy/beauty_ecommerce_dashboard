import {baseApi,unwrap} from './baseApi'

export type DeliveryModule = {
  id:number
  name:string
  code:string
  charge:string
  active:boolean
  sort_order:number
}

export type District = {
  id:number
  source_id?:number|null
  name:string
  delivery_module:number|null
  active:boolean
}

export type Thana = {
  id:number
  source_id?:number|null
  city:number
  name:string
  delivery_module:number|null
  active:boolean
}

const tr=(x:any)=>unwrap(x)

export const deliveryApi=baseApi.injectEndpoints({
  endpoints:b=>({
    deliveryModules:b.query<any,Record<string,any>|void>({
      query:p=>({url:'/admin/delivery/modules/',params:p||{}}),
      transformResponse:tr,
      providesTags:['Delivery'],
    }),
    createDeliveryModule:b.mutation<DeliveryModule,Partial<DeliveryModule>>({
      query:body=>({url:'/admin/delivery/modules/',method:'POST',body}),
      transformResponse:tr,
      invalidatesTags:['Delivery'],
    }),
    updateDeliveryModule:b.mutation<DeliveryModule,{id:number;body:Partial<DeliveryModule>}>({
      query:x=>({url:`/admin/delivery/modules/${x.id}/`,method:'PATCH',body:x.body}),
      transformResponse:tr,
      invalidatesTags:['Delivery'],
    }),
    districts:b.query<any,Record<string,any>|void>({
      query:p=>({url:'/admin/delivery/districts/',params:p||{}}),
      transformResponse:tr,
      providesTags:['Delivery'],
    }),
    updateDistrict:b.mutation<District,{id:number;body:Partial<District>}>({
      query:x=>({url:`/admin/delivery/districts/${x.id}/`,method:'PATCH',body:x.body}),
      transformResponse:tr,
      invalidatesTags:['Delivery'],
    }),
    thanas:b.query<any,Record<string,any>|void>({
      query:p=>({url:'/admin/delivery/thanas/',params:p||{}}),
      transformResponse:tr,
      providesTags:['Delivery'],
    }),
    updateThana:b.mutation<Thana,{id:number;body:Partial<Thana>}>({
      query:x=>({url:`/admin/delivery/thanas/${x.id}/`,method:'PATCH',body:x.body}),
      transformResponse:tr,
      invalidatesTags:['Delivery'],
    }),
  }),
})

export const {
  useDeliveryModulesQuery,
  useCreateDeliveryModuleMutation,
  useUpdateDeliveryModuleMutation,
  useDistrictsQuery,
  useUpdateDistrictMutation,
  useThanasQuery,
  useUpdateThanaMutation,
}=deliveryApi
