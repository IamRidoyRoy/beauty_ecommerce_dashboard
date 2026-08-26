import {setupListeners} from '@reduxjs/toolkit/query';import {configureStore} from '@reduxjs/toolkit';import {baseApi} from '../services/baseApi';import auth from '../features/auth/authSlice';import ui from '../features/ui/uiSlice'
export const store=configureStore({reducer:{auth,ui,[baseApi.reducerPath]:baseApi.reducer},middleware:g=>g().concat(baseApi.middleware)});setupListeners(store.dispatch)
export type RootState=ReturnType<typeof store.getState>;export type AppDispatch=typeof store.dispatch
