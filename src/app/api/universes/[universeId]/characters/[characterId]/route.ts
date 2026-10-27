
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { characters, universes } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    universeId: string;
    characterId: string;
  }>;
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
    const { universeId, characterId } =
      await context.params;

    const validUniverse = z
      .string()
      .uuid()
      .safeParse(universeId);

    const validCharacter = z
      .string()
      .uuid()
      .safeParse(characterId);

    if (
      !validUniverse.success ||
      !validCharacter.success
    ) {
      return errorResponse(
        "Identificador inválido.",
        400
      );
    }

    const [result] = await db
      .select({
        id: characters.id,
        universeId: characters.universeId,
        name: characters.name,
        username: characters.username,
        avatarUrl: characters.avatarUrl,
        bio: characters.bio,
        appearance: characters.appearance,
        background: characters.background,
        personality: characters.personality,
        isAvatar: characters.isAvatar,
        isMajor: characters.isMajor,
        isAiControlled: characters.isAiControlled,
        createdAt: characters.createdAt,
        universeName: universes.name,
      })
      .from(characters)
      .innerJoin(
        universes,
        eq(characters.universeId, universes.id)
      )
      .where(
        and(
          eq(characters.id, characterId),
          eq(characters.universeId, universeId)
        )
      )
      .limit(1);

    if (!result) {
      return errorResponse(
        "Personagem não encontrado neste universo.",
        404
      );
    }

    return NextResponse.json(
      {
        character: {
          id: result.id,
          universeId: result.universeId,
          name: result.name,
          username: result.username,
          avatarUrl: result.avatarUrl,
          bio: result.bio,
          appearance: result.appearance,
          background: result.background,
          personality: result.personality,
          isAvatar: result.isAvatar,
          isMajor: result.isMajor,
          isAiControlled: result.isAiControlled,
          createdAt: result.createdAt,
        },
        universe: {
          id: universeId,
          name: result.universeName,
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
      "Erro ao carregar perfil do personagem:",
      error
    );

    return errorResponse(
      "Não foi possível carregar o personagem.",
      500
    );
  }
}
