
import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import {
  characters,
  characterMemories,
  posts,
  universes,
} from "@/db/schema";

import {
  generateCharacterPost,
} from "@/lib/ai/character-brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    universeId: string;
  }>;
};

const requestSchema = z.object({
  characterId: z.string().uuid(),
  instruction: z
    .string()
    .trim()
    .max(1000)
    .optional(),
}).strict();

function errorResponse(
  message: string,
  status: number
) {
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

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { universeId } = await context.params;

    if (
      !z.string().uuid().safeParse(universeId).success
    ) {
      return errorResponse(
        "Identificador de universo inválido.",
        400
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return errorResponse(
        "Dados inválidos.",
        400
      );
    }

    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "Selecione um personagem válido.",
        400
      );
    }

    const { characterId, instruction } =
      parsed.data;

    const [universe] = await db
      .select({
        id: universes.id,
        name: universes.name,
        description: universes.description,
        sourceCanon: universes.sourceCanon,
      })
      .from(universes)
      .where(eq(universes.id, universeId))
      .limit(1);

    if (!universe) {
      return errorResponse(
        "Universo não encontrado.",
        404
      );
    }

    const [character] = await db
      .select({
        id: characters.id,
        name: characters.name,
        username: characters.username,
        bio: characters.bio,
        personality: characters.personality,
        background: characters.background,
        privateNotes: characters.privateNotes,
        isAvatar: characters.isAvatar,
        isAiControlled: characters.isAiControlled,
      })
      .from(characters)
      .where(
        and(
          eq(characters.id, characterId),
          eq(characters.universeId, universeId)
        )
      )
      .limit(1);

    if (!character) {
      return errorResponse(
        "Personagem não encontrado neste universo.",
        404
      );
    }

    if (
      character.isAvatar ||
      !character.isAiControlled
    ) {
      return errorResponse(
        "Este personagem não está configurado para ser controlado pela IA.",
        400
      );
    }

    const memories = await db
      .select({
        content: characterMemories.content,
      })
      .from(characterMemories)
      .where(
        and(
          eq(
            characterMemories.universeId,
            universeId
          ),
          eq(
            characterMemories.characterId,
            characterId
          )
        )
      )
      .orderBy(
        desc(characterMemories.importance),
        desc(characterMemories.createdAt)
      )
      .limit(20);

    // Nesta primeira versão, os posts recentes
    // são usados apenas como contexto de teste.
    // Depois implementaremos visibilidade e
    // conhecimento individual dos personagens.
    const recentPosts = await db
      .select({
        author: characters.username,
        content: posts.content,
      })
      .from(posts)
      .innerJoin(
        characters,
        eq(posts.authorId, characters.id)
      )
      .where(eq(posts.universeId, universeId))
      .orderBy(desc(posts.createdAt))
      .limit(12);

    const generatedText =
      await generateCharacterPost({
        universe: {
          name: universe.name,
          description: universe.description,
          sourceCanon: universe.sourceCanon,
        },
        character: {
          name: character.name,
          username: character.username,
          bio: character.bio,
          personality: character.personality,
          background: character.background,
          privateNotes: character.privateNotes,
        },
        knownFacts: memories.map(
          (memory) => memory.content
        ),
        recentPosts,
        instruction,
      });

    return NextResponse.json(
      {
        success: true,
        character: {
          id: character.id,
          name: character.name,
          username: character.username,
        },
        draft: generatedText,
        published: false,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro ao gerar publicação com IA:",
      error
    );

    return errorResponse(
      "Não foi possível gerar a publicação com IA. Tente novamente.",
      500
    );
  }
}
