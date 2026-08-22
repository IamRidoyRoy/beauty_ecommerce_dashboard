import {baseApi,unwrap} from './baseApi';import type {DashboardData} from '../types'
export const dashboardApi=baseApi.injectEndpoints({endpoints:b=>({dashboard:b.query<DashboardData,Record<string,any>|void>({query:a=>({url:'/admin/dashboard/',params:a||{}}),transformResponse:unwrap,providesTags:['Dashboard']})})});export const {useDashboardQuery}=dashboardApi
