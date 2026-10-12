"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {PageHeader} from "@/components/ui";
import {useProjects} from "@/lib/project-store";import {api,ApiError} from "@/lib/api";

const initial={title:"",institution:"",department:"Electrical & Electronic Engineering",programme:"HND",projectType:"Design & Construction"};
export function NewProjectPage(){
 const router=useRouter(),{addProject}=useProjects();
 const[form,setForm]=useState(initial),[submitting,setSubmitting]=useState(false),[error,setError]=useState("");
 const update=(key:keyof typeof initial,value:string)=>setForm(current=>({...current,[key]:value}));
 const create=async()=>{setSubmitting(true);setError("");try{const data=await api<{project:{id:string}}>("/projects",{method:"POST",body:JSON.stringify({...form,referenceStyle:"IEEE"})});const project=addProject({...form,id:data.project.id});router.push(`/projects/${project.id}`)}catch(reason){setError(reason instanceof ApiError?reason.message:"Unable to create the project.")}finally{setSubmitting(false)}};
 return <div className="content narrow-content"><PageHeader eyebrow="New project" title="Set up your academic project"/>{error&&<p className="settings-error" role="alert">{error}</p>}<div className="card form-card"><div className="formgrid">{(Object.keys(form) as Array<keyof typeof initial>).map(key=><label key={key}><span className="label">{key.replace(/([A-Z])/g," $1")}</span><input className="field" value={form[key]} onChange={event=>update(key,event.target.value)}/></label>)}</div><div className="modal-actions"><button className="btn btn-primary" onClick={create} disabled={!form.title||submitting}>{submitting?"Creating…":"Create project"}</button></div></div></div>
}
