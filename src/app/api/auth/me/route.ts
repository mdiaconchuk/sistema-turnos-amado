import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";

export async function GET() {
  const auth = await requireRole(["secretaria", "facturista"]);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ user: { id: auth.userId, role: auth.role } });
}