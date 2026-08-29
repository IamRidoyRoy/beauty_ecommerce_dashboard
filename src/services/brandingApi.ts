import {baseApi,unwrap} from './baseApi'
import type {SiteBranding} from '../types'

const tr=(x:any)=>unwrap(x)
export const brandingApi=baseApi.injectEndpoints({endpoints:b=>({
  siteBranding:b.query<SiteBranding,void>({query:()=>'/site-settings/',transformResponse:tr,providesTags:['Branding']}),
  adminSiteBranding:b.query<SiteBranding,void>({query:()=>'/admin/site-settings/',transformResponse:tr,providesTags:['Branding']}),
  updateSiteBranding:b.mutation<SiteBranding,FormData>({query:body=>({url:'/admin/site-settings/',method:'PATCH',body}),transformResponse:tr,invalidatesTags:['Branding']}),
})})
export const {useSiteBrandingQuery,useAdminSiteBrandingQuery,useUpdateSiteBrandingMutation}=brandingApi
