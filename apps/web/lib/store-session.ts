import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);

export async function signStoreToken(payload: { storeId: string }) {
  return await new SignJWT({ storeId: payload.storeId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifyStoreToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  const storeId = String(payload.storeId || "");
  if (!storeId) throw new Error("Invalid token payload");
  return { storeId };
}