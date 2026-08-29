import {baseApi,unwrap} from './baseApi'
import type {PaymentGatewayConfig,PaymentMethodOption} from '../types'

const tr=(x:any)=>unwrap(x)

export const paymentGatewayApi=baseApi.injectEndpoints({
  endpoints:(builder)=>({
    availablePaymentMethods:builder.query<PaymentMethodOption[],void>({query:()=>'/payment-methods/',transformResponse:tr,providesTags:['Settings']}),
    paymentGatewayConfigs:builder.query<PaymentGatewayConfig[],void>({
      query:()=>'/admin/payment-gateways/',
      transformResponse:tr,
      providesTags:['Settings'],
    }),
    updatePaymentGatewayConfig:builder.mutation<PaymentGatewayConfig,{id:number;body:Record<string,unknown>}>({
      query:({id,body})=>({url:`/admin/payment-gateways/${id}/`,method:'PATCH',body}),
      transformResponse:tr,
      invalidatesTags:['Settings'],
    }),
  }),
})

export const {useAvailablePaymentMethodsQuery,usePaymentGatewayConfigsQuery,useUpdatePaymentGatewayConfigMutation}=paymentGatewayApi
