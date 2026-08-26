import {createApi,fetchBaseQuery,type BaseQueryFn,type FetchArgs,type FetchBaseQueryError} from '@reduxjs/toolkit/query/react'
import type {RootState} from '../store/store'
import {logout,setCredentials} from '../features/auth/authSlice'
const API=(import.meta.env.VITE_API_URL||'http://127.0.0.1:8000/api/v1').replace(/\/$/,'')
const raw=fetchBaseQuery({baseUrl:API,prepareHeaders:(headers,{getState})=>{const token=(getState() as RootState).auth.access;if(token)headers.set('authorization',`Bearer ${token}`);headers.set('accept','application/json');return headers}})
let refreshPromise:Promise<any>|null=null
const baseQuery:BaseQueryFn<string|FetchArgs,unknown,FetchBaseQueryError>=async(args,api,extra)=>{
 let result=await raw(args,api,extra)
 if(result.error?.status===401){const refresh=(api.getState() as RootState).auth.refresh;if(!refresh){api.dispatch(logout());return result}
   refreshPromise??=(async()=>{const r=await raw({url:'/auth/refresh/',method:'POST',body:{refresh}},api,extra);if(r.data){const body=r.data as any;const access=body.access||body.data?.access;if(access){api.dispatch(setCredentials({access,refresh}));return access}}api.dispatch(logout());return null})().finally(()=>{refreshPromise=null})
   const access=await refreshPromise;if(access)result=await raw(args,api,extra)
 }
 return result
}
export const unwrap=<T>(response:any):T=>response?.data!==undefined&&response?.success!==undefined?response.data:response
export const baseApi=createApi({reducerPath:'commerceAdminApi',baseQuery,tagTypes:['Auth','Dashboard','Products','Variants','Categories','Brands','Attributes','Images','Inventory','Warehouses','Movements','Purchases','Suppliers','Orders','Customers','Coupons','Promotions','Payments','Shipping','Shipments','Delivery','Returns','Refunds','Reviews','Reports','Staff','Settings','HeroSlides','Announcements'],endpoints:()=>({})})
