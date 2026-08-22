import {Navigate,Outlet} from 'react-router';import {useAppSelector} from '../store/hooks'
export function ProtectedRoute(){const auth=useAppSelector(s=>s.auth);if(!auth.access)return <Navigate to="/login" replace/>;if(auth.user?.role==='customer')return <Navigate to="/login" replace/>;return <Outlet/>}
