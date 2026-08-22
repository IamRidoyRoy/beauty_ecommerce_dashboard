import {baseApi,unwrap} from './baseApi'

const reportResult=(response:any)=>{const data:any=unwrap(response);return data&&typeof data==='object'&&'results' in data?data.results:data}
const plain=(response:any)=>unwrap(response)

export const reportApi=baseApi.injectEndpoints({endpoints:b=>({
  report:b.query<any,{type:string;days?:number;[key:string]:any}>({query:p=>({url:`/admin/reports/${p.type}/`,params:Object.fromEntries(Object.entries(p).filter(([key,value])=>key!=='type'&&value!==undefined&&value!==''))}),transformResponse:reportResult,providesTags:['Reports']}),
  exports:b.query<any,void>({query:()=>'/admin/reports/exports/',transformResponse:plain,providesTags:['Reports'],keepUnusedDataFor:5}),
  createExport:b.mutation<any,{report:string;params:Record<string,any>}>({query:body=>({url:'/admin/reports/exports/',method:'POST',body}),transformResponse:plain,invalidatesTags:['Reports']}),
})})
export const {useReportQuery,useLazyReportQuery,useExportsQuery,useCreateExportMutation}=reportApi
