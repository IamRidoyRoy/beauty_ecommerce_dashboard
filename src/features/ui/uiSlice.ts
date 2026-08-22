import {createSlice,type PayloadAction} from '@reduxjs/toolkit'

type Toast={id:string;type:'success'|'error'|'info';message:string}
type UIState={sidebarOpen:boolean;toasts:Toast[]}

const initialState:UIState={sidebarOpen:false,toasts:[]}

const slice=createSlice({
  name:'ui',
  initialState,
  reducers:{
    toggleSidebar(s,a:PayloadAction<boolean|undefined>){
      s.sidebarOpen=a.payload??!s.sidebarOpen
    },
    toast(s,a:PayloadAction<Omit<Toast,'id'>>){
      // Do not stack identical messages from repeated/parallel actions.
      s.toasts=s.toasts.filter(t=>!(t.type===a.payload.type&&t.message===a.payload.message))
      s.toasts.push({...a.payload,id:crypto.randomUUID()})
      if(s.toasts.length>4)s.toasts=s.toasts.slice(-4)
    },
    dismissToast(s,a:PayloadAction<string>){
      s.toasts=s.toasts.filter(t=>t.id!==a.payload)
    },
    clearToasts(s){
      s.toasts=[]
    },
  },
})

export const {toggleSidebar,toast,dismissToast,clearToasts}=slice.actions
export default slice.reducer
