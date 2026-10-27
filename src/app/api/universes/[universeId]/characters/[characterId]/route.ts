
import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
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

const updateCharacterSchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    username: z
      .string()
      .trim()
      .min(1)
      .max(80)
      .regex(
        /^[a-zA-Z0-9_.]+$/,
        "O @usuário pode conter letras, números, pontos e underscores."
      ),
    bio: z.string().max(3000),
    appearance: z.string().max(10000),
    personality: z.string().max(10000),
    background: z.string().max(20000),
    isAvatar: z.boolean(),
    isMajor: z.boolean(),
    isAiControlled: z.boolean(),
  })
  .strict();

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

async function getValidIds(context: RouteContext) {
  const { universeId, characterId } =
    await context.params;

  if (
    !z.string().uuid().safeParse(universeId).success ||
    !z.string().uuid().safeParse(characterId).success
  ) {
    return null;
  }

  return { universeId, characterId };
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const ids = await getValidIds(context);

    if (!ids) {
      return errorResponse("Identificador inválido.", 400);
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
          eq(characters.id, ids.characterId),
          eq(characters.universeId, ids.universeId)
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
          id: ids.universeId,
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

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const ids = await getValidIds(context);

    if (!ids) {
      return errorResponse("Identificador inválido.", 400);
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return errorResponse("JSON inválido.", 400);
    }

    const parsed = updateCharacterSchema.safeParse(body);

    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ||
        "Dados inválidos.";

      return errorResponse(message, 400);
    }

    const data = parsed.data;

    const [existingCharacter] = await db
      .select({
        id: characters.id,
        personality: characters.personality,
      })
      .from(characters)
      .where(
        and(
          eq(characters.id, ids.characterId),
          eq(characters.universeId, ids.universeId)
        )
      )
      .limit(1);

    if (!existingCharacter) {
      return errorResponse(
        "Personagem não encontrado neste universo.",
        404
      );
    }

    const normalizedUsername = data.username
      .toLowerCase();

    const [usernameInUse] = await db
      .select({ id: characters.id })
      .from(characters)
      .where(
        and(
          eq(characters.universeId, ids.universeId),
          eq(characters.username, normalizedUsername),
          ne(characters.id, ids.characterId)
        )
      )
      .limit(1);

    if (usernameInUse) {
      return errorResponse(
        "Este @usuário já está sendo usado neste universo.",
        409
      );
    }

    const previousPersonality =
      existingCharacter.personality;

    const personalityObject = {
      ...previousPersonality,
      description: data.personality,
    };

    const [updatedCharacter] = await db
      .update(characters)
      .set({
        name: data.name,
        username: normalizedUsername,
        bio: data.bio,
        appearance: data.appearance,
        background: data.background,
        personality: personalityObject,
        isAvatar: data.isAvatar,
        isMajor: data.isMajor,
        isAiControlled: data.isAvatar
          ? false
          : data.isAiControlled,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(characters.id, ids.characterId),
          eq(characters.universeId, ids.universeId)
        )
      )
      .returning();

    if (!updatedCharacter) {
      return errorResponse(
        "Não foi possível atualizar o personagem.",
        404
      );
    }

    return NextResponse.json(
      {
        character: updatedCharacter,
        message: "Personagem atualizado com sucesso!",
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro ao atualizar personagem:",
      error
    );

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    ) {
      return errorResponse(
        "Este @usuário já está sendo usado neste universo.",
        409
      );
    }

    return errorResponse(
      "Não foi possível salvar as alterações.",
      500
    );
  }
}
