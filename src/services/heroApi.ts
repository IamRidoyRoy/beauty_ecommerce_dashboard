import {baseApi,unwrap} from './baseApi'
import type {HeroSlide,Paginated} from '../types'

export const heroApi=baseApi.injectEndpoints({endpoints:b=>({
  heroSlides:b.query<Paginated<HeroSlide>|HeroSlide[],void>({
    query:()=>'/admin/hero-slides/?page_size=200&ordering=order',
    transformResponse:unwrap,
    providesTags:['HeroSlides'],
  }),
  createHeroSlide:b.mutation<HeroSlide,FormData>({
    query:body=>({url:'/admin/hero-slides/',method:'POST',body}),
    transformResponse:unwrap,
    invalidatesTags:['HeroSlides'],
  }),
  updateHeroSlide:b.mutation<HeroSlide,{id:number;body:FormData|Record<string,unknown>}>({
    query:({id,body})=>({url:`/admin/hero-slides/${id}/`,method:'PATCH',body}),
    transformResponse:unwrap,
    invalidatesTags:['HeroSlides'],
  }),
  deleteHeroSlide:b.mutation<void,number>({
    query:id=>({url:`/admin/hero-slides/${id}/`,method:'DELETE'}),
    invalidatesTags:['HeroSlides'],
  }),
})})

export const {useHeroSlidesQuery,useCreateHeroSlideMutation,useUpdateHeroSlideMutation,useDeleteHeroSlideMutation}=heroApi
