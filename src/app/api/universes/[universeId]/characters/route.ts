
import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { characters, universes } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ universeId: string }>;
};

const uuidSchema = z.string().uuid();

const createCharacterSchema = z.object({
  name: z.string().trim().min(1).max(150),

  username: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "O usuário deve conter apenas letras, números e _."
    ),

  bio: z.string().trim().max(3000).optional(),

  appearance: z.string().trim().max(10000).optional(),

  background: z.string().trim().max(20000).optional(),

  personality: z.string().trim().max(10000).optional(),

  isAvatar: z.boolean().default(false),

  isMajor: z.boolean().default(false),

  isAiControlled: z.boolean().default(true),
});

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

async function universeExists(universeId: string) {
  const [universe] = await db
    .select({
      id: universes.id,
    })
    .from(universes)
    .where(eq(universes.id, universeId))
    .limit(1);

  return Boolean(universe);
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { universeId } = await context.params;

    if (!uuidSchema.safeParse(universeId).success) {
      return errorResponse(
        "Identificador de universo inválido.",
        400
      );
    }

    if (!(await universeExists(universeId))) {
      return errorResponse(
        "Universo não encontrado.",
        404
      );
    }

    const result = await db
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
      })
      .from(characters)
      .where(eq(characters.universeId, universeId))
      .orderBy(asc(characters.createdAt));

    return NextResponse.json(
      {
        characters: result,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro ao carregar personagens:",
      error
    );

    return errorResponse(
      "Não foi possível carregar os personagens.",
      500
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { universeId } = await context.params;

    if (!uuidSchema.safeParse(universeId).success) {
      return errorResponse(
        "Identificador de universo inválido.",
        400
      );
    }

    const contentLength = Number(
      request.headers.get("content-length") || "0"
    );

    if (contentLength > 50000) {
      return errorResponse(
        "Os dados enviados são muito grandes.",
        413
      );
    }

    if (!(await universeExists(universeId))) {
      return errorResponse(
        "Universo não encontrado.",
        404
      );
    }

    const body: unknown = await request.json();
    const parsed = createCharacterSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues[0]?.message ||
          "Confira os dados do personagem.",
        400
      );
    }

    const data = parsed.data;

    const [existingUsername] = await db
      .select({
        id: characters.id,
      })
      .from(characters)
      .where(eq(characters.universeId, universeId))
      .limit(1000);

    const [sameUsername] = await db
      .select({
        id: characters.id,
      })
      .from(characters)
      .where(
        eq(characters.universeId, universeId)
      )
      .orderBy(asc(characters.createdAt));

    // A verificação definitiva de nomes repetidos
    // é feita pelo índice único do banco de dados.
    void existingUsername;
    void sameUsername;

    const [character] = await db
      .insert(characters)
      .values({
        universeId,
        name: data.name,
        username: data.username.toLowerCase(),
        bio: data.bio || null,
        appearance: data.appearance || null,
        background: data.background || null,
        personality: data.personality
          ? { description: data.personality }
          : {},
        isAvatar: data.isAvatar,
        isMajor: data.isMajor,
        isAiControlled: data.isAvatar
          ? false
          : data.isAiControlled,
      })
      .returning({
        id: characters.id,
        universeId: characters.universeId,
        name: characters.name,
        username: characters.username,
        bio: characters.bio,
        appearance: characters.appearance,
        background: characters.background,
        personality: characters.personality,
        isAvatar: characters.isAvatar,
        isMajor: characters.isMajor,
        isAiControlled: characters.isAiControlled,
        createdAt: characters.createdAt,
      });

    return NextResponse.json(
      {
        character,
      },
      {
        status: 201,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro ao criar personagem:",
      error
    );

    if (error instanceof SyntaxError) {
      return errorResponse(
        "Formato dos dados inválido.",
        400
      );
    }

    if (
      error instanceof Error &&
      (
        error.message.includes(
          "characters_universe_username_idx"
        ) ||
        error.message.includes("duplicate key")
      )
    ) {
      return errorResponse(
        "Este @usuário já existe neste universo.",
        409
      );
    }

    return errorResponse(
      "Não foi possível criar o personagem.",
      500
    );
  }
}
