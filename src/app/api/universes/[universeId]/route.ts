
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { profiles, universes } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ universeId: string }>;
};

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { universeId } = await context.params;

    if (!z.string().uuid().safeParse(universeId).success) {
      return errorResponse(
        "Identificador de universo inválido.",
        400
      );
    }

    const [result] = await db
      .select({
        id: universes.id,
        profileId: universes.profileId,
        name: universes.name,
        description: universes.description,
        sourceCanon: universes.sourceCanon,
        narrativeTime: universes.narrativeTime,
        createdAt: universes.createdAt,
        profileName: profiles.name,
      })
      .from(universes)
      .innerJoin(
        profiles,
        eq(universes.profileId, profiles.id)
      )
      .where(eq(universes.id, universeId))
      .limit(1);

    if (!result) {
      return errorResponse(
        "Universo não encontrado.",
        404
      );
    }

    return NextResponse.json(
      {
        universe: {
          id: result.id,
          profileId: result.profileId,
          name: result.name,
          description: result.description,
          sourceCanon: result.sourceCanon,
          narrativeTime: result.narrativeTime,
          createdAt: result.createdAt,
        },
        profile: {
          id: result.profileId,
          name: result.profileName,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro ao carregar informações do universo:",
      error
    );

    return errorResponse(
      "Não foi possível carregar o universo.",
      500
    );
  }
}
