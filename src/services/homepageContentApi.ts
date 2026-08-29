import {baseApi,unwrap} from './baseApi'
import {rowsOf} from '../utils/data'
import type {AnnouncementItem,HeroSlide,HomepageBanner} from '../types'

const listResponse=<T,>(response:any):T[]=>rowsOf<T>(unwrap<any>(response))

export const homepageContentApi=baseApi.injectEndpoints({endpoints:b=>({
  homepageBanners:b.query<HomepageBanner[],void>({query:()=>'/admin/homepage-banners/',transformResponse:(response:any)=>listResponse<HomepageBanner>(response),providesTags:['HomepageContent']}),
  updateHomepageBanner:b.mutation<HomepageBanner,{id:number;body:FormData}>({query:x=>({url:`/admin/homepage-banners/${x.id}/`,method:'PATCH',body:x.body}),transformResponse:unwrap,invalidatesTags:['HomepageContent']}),
  announcementItems:b.query<AnnouncementItem[],void>({query:()=>'/admin/announcement-items/',transformResponse:(response:any)=>listResponse<AnnouncementItem>(response),providesTags:['HomepageContent']}),
  createAnnouncementItem:b.mutation<AnnouncementItem,Partial<AnnouncementItem>>({query:body=>({url:'/admin/announcement-items/',method:'POST',body}),transformResponse:unwrap,invalidatesTags:['HomepageContent']}),
  updateAnnouncementItem:b.mutation<AnnouncementItem,{id:number;body:Partial<AnnouncementItem>}>({query:x=>({url:`/admin/announcement-items/${x.id}/`,method:'PATCH',body:x.body}),transformResponse:unwrap,invalidatesTags:['HomepageContent']}),
  deleteAnnouncementItem:b.mutation<void,number>({query:id=>({url:`/admin/announcement-items/${id}/`,method:'DELETE'}),invalidatesTags:['HomepageContent']}),
  heroSlides:b.query<HeroSlide[],void>({query:()=>'/admin/hero-slides/?page_size=100',transformResponse:(response:any)=>listResponse<HeroSlide>(response),providesTags:['HomepageContent']}),
  createHeroSlide:b.mutation<HeroSlide,FormData>({query:body=>({url:'/admin/hero-slides/',method:'POST',body}),transformResponse:unwrap,invalidatesTags:['HomepageContent']}),
  updateHeroSlide:b.mutation<HeroSlide,{id:number;body:FormData}>({query:x=>({url:`/admin/hero-slides/${x.id}/`,method:'PATCH',body:x.body}),transformResponse:unwrap,invalidatesTags:['HomepageContent']}),
  deleteHeroSlide:b.mutation<void,number>({query:id=>({url:`/admin/hero-slides/${id}/`,method:'DELETE'}),invalidatesTags:['HomepageContent']}),
})})

export const {useHomepageBannersQuery,useUpdateHomepageBannerMutation,useAnnouncementItemsQuery,useCreateAnnouncementItemMutation,useUpdateAnnouncementItemMutation,useDeleteAnnouncementItemMutation,useHeroSlidesQuery,useCreateHeroSlideMutation,useUpdateHeroSlideMutation,useDeleteHeroSlideMutation}=homepageContentApi
