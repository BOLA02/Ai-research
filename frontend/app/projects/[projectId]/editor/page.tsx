"use client";
import{useEffect}from"react";import{useParams,useRouter}from"next/navigation";import{useProjectContent}from"@/lib/project-content";
export default function Page(){const{projectId}=useParams<{projectId:string}>(),router=useRouter(),content=useProjectContent();useEffect(()=>{if(!content.loading)router.replace(content.chapters.length?`/projects/${projectId}/editor/${content.chapters[0].number}`:`/projects/${projectId}`)},[content.loading,content.chapters,projectId,router]);return <main className="content">Opening editor…</main>}
