"use client";
import {createContext,useCallback,useContext,useEffect,useMemo,useState} from "react";
import {api} from "./api";
import type {Chapter,PreliminaryPage,Section} from "./fixtures";

type ApiDocument={id:string;type:string;title:string;content:string;position:number;isEnabled:boolean;updatedAt:string};
type ApiSection={id:string;chapterId:string;parentSectionId:string|null;title:string;content:string;position:number};
type ApiChapter={id:string;number:number;title:string;position:number;sections:ApiSection[]};
type ContentContext={documents:PreliminaryPage[];chapters:Chapter[];loading:boolean;error:string|null;reload:()=>Promise<void>;createDocument:(title:string)=>Promise<string>;patchDocument:(id:string,input:{title?:string;content?:string;position?:number;isEnabled?:boolean})=>Promise<void>;deleteDocument:(id:string)=>Promise<void>;createChapter:(title:string)=>Promise<void>;patchChapter:(id:string,input:{title?:string;position?:number})=>Promise<void>;deleteChapter:(id:string)=>Promise<void>;createSection:(chapterId:string,input:{title:string;content?:string;parentSectionId?:string|null})=>Promise<void>;patchSection:(chapterId:string,id:string,input:{title?:string;content?:string;position?:number;parentSectionId?:string|null})=>Promise<void>;deleteSection:(chapterId:string,id:string)=>Promise<void>};
const Context=createContext<ContentContext|null>(null);
const slugs:Record<string,string>={COVER_PAGE:"cover-page",TITLE_PAGE:"title-page",CERTIFICATION:"certification",DECLARATION:"declaration",DEDICATION:"dedication",ACKNOWLEDGEMENT:"acknowledgement",ABSTRACT:"abstract",TABLE_OF_CONTENTS:"table-of-contents",LIST_OF_FIGURES:"list-of-figures",LIST_OF_TABLES:"list-of-tables",APPENDIX:"appendix"};
const page=(row:ApiDocument):PreliminaryPage=>({id:row.id,type:slugs[row.type]||`custom-${row.id}`,title:row.title,content:row.content,pageType:row.type==="CUSTOM"?"custom":"preliminary",numbering:["COVER_PAGE","TITLE_PAGE"].includes(row.type)?"none":row.type==="CUSTOM"?"arabic":"roman",protected:!["CUSTOM","APPENDIX"].includes(row.type)});
const mapChapters=(rows:ApiChapter[]):Chapter[]=>rows.map(chapter=>({...chapter,status:"not_started",sections:chapter.sections.map((section,index)=>({...section,number:`${chapter.number}.${index+1}`}))}));

export function ProjectContentProvider({projectId,children}:{projectId:string;children:React.ReactNode}){
 const[documents,setDocuments]=useState<PreliminaryPage[]>([]),[chapters,setChapters]=useState<Chapter[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null);
 const reload=useCallback(async()=>{setLoading(true);setError(null);try{const[docs,chs]=await Promise.all([api<{documents:ApiDocument[]}>(`/projects/${projectId}/documents`),api<{chapters:ApiChapter[]}>(`/projects/${projectId}/chapters`)]);setDocuments(docs.documents.map(page));setChapters(mapChapters(chs.chapters))}catch(e){setError(e instanceof Error?e.message:"Unable to load project documents")}finally{setLoading(false)}},[projectId]);
 useEffect(()=>{void reload()},[reload]);
 const value=useMemo<ContentContext>(()=>({documents,chapters,loading,error,reload,
  async createDocument(title){const data=await api<{document:ApiDocument}>(`/projects/${projectId}/documents`,{method:"POST",body:JSON.stringify({title,type:"CUSTOM"})});setDocuments(rows=>[...rows,page(data.document)]);return data.document.id},
  async patchDocument(id,input){const data=await api<{document:ApiDocument}>(`/projects/${projectId}/documents/${id}`,{method:"PATCH",body:JSON.stringify(input)});if(input.position!==undefined)await reload();else setDocuments(rows=>rows.map(row=>row.id===id?page(data.document):row))},
  async deleteDocument(id){await api(`/projects/${projectId}/documents/${id}`,{method:"DELETE"});setDocuments(rows=>rows.filter(row=>row.id!==id))},
  async createChapter(title){await api(`/projects/${projectId}/chapters`,{method:"POST",body:JSON.stringify({title})});await reload()},
  async patchChapter(id,input){await api(`/projects/${projectId}/chapters/${id}`,{method:"PATCH",body:JSON.stringify(input)});await reload()},
  async deleteChapter(id){await api(`/projects/${projectId}/chapters/${id}`,{method:"DELETE"});await reload()},
  async createSection(chapterId,input){await api(`/projects/${projectId}/chapters/${chapterId}/sections`,{method:"POST",body:JSON.stringify(input)});await reload()},
  async patchSection(chapterId,id,input){const data=await api<{section:ApiSection}>(`/projects/${projectId}/chapters/${chapterId}/sections/${id}`,{method:"PATCH",body:JSON.stringify(input)});if(input.position!==undefined||input.parentSectionId!==undefined)await reload();else setChapters(rows=>rows.map(ch=>ch.id!==chapterId?ch:{...ch,sections:ch.sections.map(section=>section.id===id?{...section,...data.section}:section)}))},
  async deleteSection(chapterId,id){await api(`/projects/${projectId}/chapters/${chapterId}/sections/${id}`,{method:"DELETE"});await reload()}
 }),[documents,chapters,loading,error,reload,projectId]);
 return <Context.Provider value={value}>{children}</Context.Provider>
}
export function useProjectContent(){const value=useContext(Context);if(!value)throw new Error("ProjectContentProvider missing");return value}
