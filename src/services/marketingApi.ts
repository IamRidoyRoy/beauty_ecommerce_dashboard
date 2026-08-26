import {baseApi,unwrap} from './baseApi'
const tr=(x:any)=>unwrap(x)
export const marketingApi=baseApi.injectEndpoints({endpoints:b=>({
  coupons:b.query<any,Record<string,any>|void>({query:p=>({url:'/admin/coupons/',params:p||{}}),transformResponse:tr,providesTags:['Coupons']}),
  createCoupon:b.mutation<any,any>({query:body=>({url:'/admin/coupons/',method:'POST',body}),transformResponse:tr,invalidatesTags:['Coupons']}),
  updateCoupon:b.mutation<any,{id:number;body:any}>({query:x=>({url:`/admin/coupons/${x.id}/`,method:'PATCH',body:x.body}),transformResponse:tr,invalidatesTags:['Coupons']}),
  deleteCoupon:b.mutation<void,number>({query:id=>({url:`/admin/coupons/${id}/`,method:'DELETE'}),invalidatesTags:['Coupons']}),
  promotions:b.query<any,Record<string,any>|void>({query:p=>({url:'/admin/promotions/',params:p||{}}),transformResponse:tr,providesTags:['Promotions']}),
  createPromotion:b.mutation<any,any>({query:body=>({url:'/admin/promotions/',method:'POST',body}),transformResponse:tr,invalidatesTags:['Promotions']}),
  updatePromotion:b.mutation<any,{id:number;body:any}>({query:x=>({url:`/admin/promotions/${x.id}/`,method:'PATCH',body:x.body}),transformResponse:tr,invalidatesTags:['Promotions']}),
  deletePromotion:b.mutation<void,number>({query:id=>({url:`/admin/promotions/${id}/`,method:'DELETE'}),invalidatesTags:['Promotions']}),
  announcementMessages:b.query<any,Record<string,any>|void>({query:p=>({url:'/admin/announcement-messages/',params:p||{page_size:200,ordering:'order'}}),transformResponse:tr,providesTags:['Announcements']}),
  createAnnouncementMessage:b.mutation<any,any>({query:body=>({url:'/admin/announcement-messages/',method:'POST',body}),transformResponse:tr,invalidatesTags:['Announcements']}),
  updateAnnouncementMessage:b.mutation<any,{id:number;body:any}>({query:x=>({url:`/admin/announcement-messages/${x.id}/`,method:'PATCH',body:x.body}),transformResponse:tr,invalidatesTags:['Announcements']}),
  deleteAnnouncementMessage:b.mutation<void,number>({query:id=>({url:`/admin/announcement-messages/${id}/`,method:'DELETE'}),invalidatesTags:['Announcements']}),
})})
export const {useCouponsQuery,useCreateCouponMutation,useUpdateCouponMutation,useDeleteCouponMutation,usePromotionsQuery,useCreatePromotionMutation,useUpdatePromotionMutation,useDeletePromotionMutation,useAnnouncementMessagesQuery,useCreateAnnouncementMessageMutation,useUpdateAnnouncementMessageMutation,useDeleteAnnouncementMessageMutation}=marketingApi
