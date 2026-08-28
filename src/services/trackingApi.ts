import {baseApi,unwrap} from './baseApi'

export type TrackingSettings={
  id:number
  enabled:boolean
  browser_tracking_enabled:boolean
  server_tracking_enabled:boolean
  require_marketing_consent:boolean
  gtm_container_id:string
  meta_pixel_id:string
  meta_api_version:string
  has_access_token:boolean
  masked_access_token:string
  meta_test_event_code:string
  currency:string
  enabled_events:Record<string,boolean>
  last_tested_at?:string|null
  last_test_status?:string
  last_test_message?:string
  created_at?:string
  updated_at?:string
}

export type TrackingEventLog={
  id:number
  event_name:string
  event_id:string
  source:string
  status:string
  order_number?:string
  http_status?:number|null
  custom_data?:Record<string,unknown>
  response_data?:Record<string,unknown>
  error_message?:string
  created_at:string
}

const tr=(x:any)=>unwrap(x)
export const trackingApi=baseApi.injectEndpoints({endpoints:b=>({
  trackingSettings:b.query<TrackingSettings,void>({
    query:()=>'/admin/tracking/settings/',transformResponse:tr,providesTags:['Settings']
  }),
  updateTrackingSettings:b.mutation<TrackingSettings,Partial<TrackingSettings>&{meta_access_token?:string}>({
    query:body=>({url:'/admin/tracking/settings/',method:'PATCH',body}),transformResponse:tr,invalidatesTags:['Settings']
  }),
  trackingEvents:b.query<any,{page_size?:number;event_name?:string;status?:string}|void>({
    query:p=>({url:'/admin/tracking/events/',params:p||{page_size:25}}),transformResponse:tr,providesTags:['Settings']
  }),
  testTracking:b.mutation<any,{event_source_url?:string}|void>({
    query:body=>({url:'/admin/tracking/test/',method:'POST',body:body||{}}),transformResponse:tr,invalidatesTags:['Settings']
  }),
})})

export const {useTrackingSettingsQuery,useUpdateTrackingSettingsMutation,useTrackingEventsQuery,useTestTrackingMutation}=trackingApi
