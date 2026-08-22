import {baseApi,unwrap} from './baseApi'
import type {CheckoutSettings,SearchResult,User} from '../types'
const tr=(x:any)=>unwrap(x)
export const settingsApi=baseApi.injectEndpoints({endpoints:b=>({
  settings:b.query<CheckoutSettings,void>({query:()=>'/admin/checkout-settings/',transformResponse:tr,providesTags:['Settings']}),
  updateSettings:b.mutation<CheckoutSettings,Record<string,any>>({query:body=>({url:'/admin/checkout-settings/',method:'PATCH',body}),transformResponse:tr,invalidatesTags:['Settings']}),
  globalSearch:b.query<SearchResult[],string>({query:q=>({url:'/admin/global-search/',params:{q}}),transformResponse:tr}),
  staff:b.query<any,Record<string,any>|void>({query:p=>({url:'/admin/staff-users/',params:p||{}}),transformResponse:tr,providesTags:['Staff']}),
  createStaff:b.mutation<User,any>({query:body=>({url:'/admin/staff-users/',method:'POST',body}),transformResponse:tr,invalidatesTags:['Staff']}),
  updateStaff:b.mutation<User,{id:number;body:any}>({query:x=>({url:`/admin/staff-users/${x.id}/`,method:'PATCH',body:x.body}),transformResponse:tr,invalidatesTags:['Staff']}),
  deleteStaff:b.mutation<void,number>({query:id=>({url:`/admin/staff-users/${id}/`,method:'DELETE'}),invalidatesTags:['Staff']}),
})})
export const {useSettingsQuery,useUpdateSettingsMutation,useLazyGlobalSearchQuery,useStaffQuery,useCreateStaffMutation,useUpdateStaffMutation,useDeleteStaffMutation}=settingsApi
