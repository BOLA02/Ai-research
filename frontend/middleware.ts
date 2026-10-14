import {NextResponse,type NextRequest} from "next/server";
export function middleware(request:NextRequest){const cookieName=process.env.SESSION_COOKIE_NAME||"pf_session";if(!request.cookies.has(cookieName)){const login=new URL("/login",request.url);login.searchParams.set("next",`${request.nextUrl.pathname}${request.nextUrl.search}`);return NextResponse.redirect(login)}return NextResponse.next()}
export const config={matcher:["/dashboard/:path*","/projects/:path*","/example/:path*","/example","/welcome"]};
