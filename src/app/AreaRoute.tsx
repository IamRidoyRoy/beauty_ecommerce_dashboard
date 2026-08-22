import type {ReactNode} from 'react';import {Navigate} from 'react-router';import {useAppSelector} from '../store/hooks';import {can} from '../utils/permissions';
export function AreaRoute({area,children}:{area:string;children:ReactNode}){const role=useAppSelector(s=>s.auth.user?.role);return can(role,area)?children:<Navigate to="/" replace/>}
