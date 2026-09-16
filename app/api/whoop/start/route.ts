import { NextResponse } from "next/server";
export async function GET(request: Request) {
  const url = new URL("/api/whoop/login", request.url);
  url.search = new URL(request.url).search;
  return NextResponse.redirect(url);
}
