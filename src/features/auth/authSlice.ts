import {createSlice,type PayloadAction} from '@reduxjs/toolkit'
import type {User} from '../../types'
type AuthState={user:User|null;access:string|null;refresh:string|null;hydrated:boolean}
const read=()=>{try{return JSON.parse(localStorage.getItem('beauty-admin-auth')||'null')}catch{return null}}
const saved=typeof window!=='undefined'?read():null
const initialState:AuthState={user:saved?.user||null,access:saved?.access||null,refresh:saved?.refresh||null,hydrated:true}
const persist=(s:AuthState)=>localStorage.setItem('beauty-admin-auth',JSON.stringify({user:s.user,access:s.access,refresh:s.refresh}))
const slice=createSlice({name:'auth',initialState,reducers:{setCredentials(s,a:PayloadAction<{user?:User|null;access:string;refresh?:string}>){if(a.payload.user!==undefined)s.user=a.payload.user;s.access=a.payload.access;if(a.payload.refresh)s.refresh=a.payload.refresh;persist(s)},setUser(s,a:PayloadAction<User|null>){s.user=a.payload;persist(s)},logout(s){s.user=null;s.access=null;s.refresh=null;localStorage.removeItem('beauty-admin-auth')}}})
export const {setCredentials,setUser,logout}=slice.actions
export default slice.reducer
