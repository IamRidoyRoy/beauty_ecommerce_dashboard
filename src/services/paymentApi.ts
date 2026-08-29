import { baseApi, unwrap } from './baseApi'
import type { Payment } from '../types'

const tr = (x: any) => unwrap(x)

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    payments: builder.query<any, Record<string, any> | void>({
      query: (params) => ({ url: '/admin/payments/', params: params || {} }),
      transformResponse: tr,
      providesTags: ['Payments'],
    }),
    reconcilePayment: builder.mutation<Payment, number>({
      query: (id) => ({ url: `/admin/payments/${id}/reconcile/`, method: 'POST' }),
      transformResponse: tr,
      invalidatesTags: ['Payments', 'Orders', 'Dashboard', 'Reports'],
    }),
    paymentReconciliations: builder.query<any[], number>({
      query: (id) => ({ url: `/admin/payments/${id}/reconciliations/` }),
      transformResponse: tr,
    }),
  }),
})

export const {
  usePaymentsQuery,
  useReconcilePaymentMutation,
  usePaymentReconciliationsQuery,
} = paymentApi
