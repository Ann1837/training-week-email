export function hasValidAdminSecret(request: Request) {
  const expectedSecret = process.env.ADMIN_SECRET;

  if (!expectedSecret) {
    return true;
  }

  const providedSecret =
    request.headers.get("x-admin-secret") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    new URL(request.url).searchParams.get("adminSecret");

  return providedSecret === expectedSecret;
}
