
import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { profiles, universes } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ profileId: string }>;
};

const profileIdSchema = z.string().uuid();

const createUniverseSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional(),
  sourceCanon: z.string().trim().max(2000).optional(),
});

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

async function findProfile(profileId: string) {
  const [profile] = await db
    .select({
      id: profiles.id,
      name: profiles.name,
    })
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);

  return profile;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { profileId } = await context.params;

    if (!profileIdSchema.safeParse(profileId).success) {
      return errorResponse("Identificador de perfil inválido.", 400);
    }

    const profile = await findProfile(profileId);

    if (!profile) {
      return errorResponse("Perfil não encontrado.", 404);
    }

    const result = await db
      .select({
        id: universes.id,
        profileId: universes.profileId,
        name: universes.name,
        description: universes.description,
        sourceCanon: universes.sourceCanon,
        createdAt: universes.createdAt,
      })
      .from(universes)
      .where(eq(universes.profileId, profileId))
      .orderBy(asc(universes.createdAt));

    return NextResponse.json(
      {
        profile,
        universes: result,
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Erro ao carregar universos:", error);

    return errorResponse(
      "Não foi possível carregar os universos.",
      500
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { profileId } = await context.params;

    if (!profileIdSchema.safeParse(profileId).success) {
      return errorResponse("Identificador de perfil inválido.", 400);
    }

    const contentLength = Number(
      request.headers.get("content-length") || "0"
    );

    if (contentLength > 12000) {
      return errorResponse("Dados enviados são muito grandes.", 413);
    }

    const profile = await findProfile(profileId);

    if (!profile) {
      return errorResponse("Perfil não encontrado.", 404);
    }

    const body: unknown = await request.json();
    const parsed = createUniverseSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "Informe um nome válido e confira os demais campos.",
        400
      );
    }

    const [universe] = await db
      .insert(universes)
      .values({
        profileId,
        name: parsed.data.name,
        description: parsed.data.description || null,
        sourceCanon: parsed.data.sourceCanon || null,
      })
      .returning({
        id: universes.id,
        profileId: universes.profileId,
        name: universes.name,
        description: universes.description,
        sourceCanon: universes.sourceCanon,
        createdAt: universes.createdAt,
      });

    return NextResponse.json(
      { universe },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error("Erro ao criar universo:", error);

    if (error instanceof SyntaxError) {
      return errorResponse("Formato dos dados inválido.", 400);
    }

    return errorResponse(
      "Não foi possível criar o universo.",
      500
    );
  }
}
