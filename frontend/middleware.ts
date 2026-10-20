import {NextResponse,type NextRequest} from "next/server";
export function middleware(request:NextRequest){
  // With a private admin address set, the plain /admin address does not exist.
  if(process.env.ADMIN_SLUG&&request.nextUrl.pathname.startsWith("/admin"))return new NextResponse("Not found",{status:404});
  const cookieName=process.env.SESSION_COOKIE_NAME||"pf_session";
  if(!request.cookies.has(cookieName)){const login=new URL("/login",request.url);login.searchParams.set("next",`${request.nextUrl.pathname}${request.nextUrl.search}`);return NextResponse.redirect(login)}
  return NextResponse.next()
}
export const config={matcher:["/dashboard/:path*","/admin/:path*","/admin","/projects/:path*","/welcome"]};
