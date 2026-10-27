
import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { profiles } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createProfileSchema = z.object({
  name: z.string().trim().min(1).max(100),
  avatarUrl: z.string().url().max(2048).nullable().optional(),
});

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

export async function GET() {
  try {
    const result = await db
      .select({
        id: profiles.id,
        name: profiles.name,
        avatarUrl: profiles.avatarUrl,
        hasPin: profiles.pinHash,
      })
      .from(profiles)
      .orderBy(asc(profiles.createdAt));

    return NextResponse.json(
      {
        profiles: result.map((profile) => ({
          id: profile.id,
          name: profile.name,
          avatarUrl: profile.avatarUrl,
          hasPin: Boolean(profile.hasPin),
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro ao carregar perfis:", error);
    return errorResponse("Não foi possível carregar os perfis.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentLength = Number(
      request.headers.get("content-length") || "0"
    );

    if (contentLength > 10000) {
      return errorResponse("Dados enviados são muito grandes.", 413);
    }

    const body: unknown = await request.json();
    const parsed = createProfileSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "Informe um nome válido de até 100 caracteres.",
        400
      );
    }

    const [profile] = await db
      .insert(profiles)
      .values({
        name: parsed.data.name,
        avatarUrl: parsed.data.avatarUrl ?? null,
      })
      .returning({
        id: profiles.id,
        name: profiles.name,
        avatarUrl: profiles.avatarUrl,
      });

    return NextResponse.json(
      {
        profile: {
          ...profile,
          hasPin: false,
        },
      },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro ao criar perfil:", error);

    if (error instanceof SyntaxError) {
      return errorResponse("Formato dos dados inválido.", 400);
    }

    return errorResponse("Não foi possível criar o perfil.", 500);
  }
}
