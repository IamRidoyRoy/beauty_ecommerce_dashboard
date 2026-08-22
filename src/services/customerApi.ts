import {baseApi,unwrap} from './baseApi'
const tr=(x:any)=>unwrap(x)

export const customerApi=baseApi.injectEndpoints({
  endpoints:b=>({
    customers:b.query<any,Record<string,any>|void>({
      query:p=>({url:'/admin/customers/',params:p||{}}),
      transformResponse:tr,
      providesTags:['Customers'],
    }),
    customer:b.query<any,number>({
      query:id=>`/admin/customers/${id}/`,
      transformResponse:tr,
      providesTags:(_,e,id)=>[{type:'Customers',id}],
    }),
    updateStatus:b.mutation<any,{id:number;is_active:boolean}>({
      query:x=>({url:`/admin/customers/${x.id}/status/`,method:'PATCH',body:{is_active:x.is_active}}),
      transformResponse:tr,
      invalidatesTags:['Customers'],
    }),
  }),
})

export const {useCustomersQuery,useCustomerQuery,useUpdateStatusMutation}=customerApi
