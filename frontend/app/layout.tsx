import type { Metadata } from "next";
import "./globals.css";
import { ProjectProvider } from "@/lib/project-store";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = { title: "ProjectForge", description: "Academic project workspace for engineering students" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><AuthProvider><ProjectProvider>{children}</ProjectProvider></AuthProvider></body></html>; }
