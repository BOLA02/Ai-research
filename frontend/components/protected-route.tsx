"use client";
import {useEffect} from "react";import {usePathname,useRouter} from "next/navigation";import {useAuth} from "@/lib/auth";
export function ProtectedRoute({children}:{children:React.ReactNode}){const{user,loading}=useAuth(),router=useRouter(),pathname=usePathname();useEffect(()=>{if(!loading&&!user)router.replace(`/login?next=${encodeURIComponent(pathname)}`)},[loading,user,router,pathname]);if(loading||!user)return <main className="auth-loading" aria-live="polite">Checking your session…</main>;return <>{children}</>}
