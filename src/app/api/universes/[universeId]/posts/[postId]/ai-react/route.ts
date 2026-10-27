
import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import {
  characters,
  characterMemories,
  postInteractions,
  posts,
  relationships,
  universes,
} from "@/db/schema";

import {
  decideCharacterReactions,
  type ReactionCharacter,
} from "@/lib/ai/character-reactions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    universeId: string;
    postId: string;
  }>;
};

function respond(
  data: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { universeId, postId } =
      await context.params;

    if (
      !z.string().uuid().safeParse(universeId).success ||
      !z.string().uuid().safeParse(postId).success
    ) {
      return respond(
        { error: "Identificador inválido." },
        400
      );
    }

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
      return respond(
        { error: "Universo não encontrado." },
        404
      );
    }

    const [post] = await db
      .select({
        id: posts.id,
        authorId: posts.authorId,
        content: posts.content,
        authorName: characters.name,
      })
      .from(posts)
      .innerJoin(
        characters,
        eq(posts.authorId, characters.id)
      )
      .where(
        and(
          eq(posts.id, postId),
          eq(posts.universeId, universeId)
        )
      )
      .limit(1);

    if (!post) {
      return respond(
        { error: "Publicação não encontrada." },
        404
      );
    }

    // Selecionar somente personagens
    // controlados pela IA, nunca o avatar.
    const candidates = await db
      .select({
        id: characters.id,
        name: characters.name,
        username: characters.username,
        bio: characters.bio,
        background: characters.background,
        personality: characters.personality,
      })
      .from(characters)
      .where(
        and(
          eq(characters.universeId, universeId),
          eq(characters.isAiControlled, true),
          eq(characters.isAvatar, false)
        )
      )
      .limit(30);

    const eligible = candidates.filter(
      (character) =>
        character.id !== post.authorId
    );

    if (eligible.length === 0) {
      return respond({
        success: true,
        reactions: [],
        message:
          "Nenhum personagem disponível para reagir.",
      });
    }

    // Evitar repetir interações automáticas
    // de personagens que já reagiram.
    const previousInteractions = await db
      .select({
        characterId: postInteractions.characterId,
      })
      .from(postInteractions)
      .where(eq(postInteractions.postId, postId));

    const alreadyReacted = new Set(
      previousInteractions.map(
        (interaction) => interaction.characterId
      )
    );

    const available = eligible
      .filter(
        (character) =>
          !alreadyReacted.has(character.id)
      )
      .slice(0, 8);

    if (available.length === 0) {
      return respond({
        success: true,
        reactions: [],
        message:
          "Os personagens disponíveis já reagiram.",
      });
    }

    const candidateIds = available.map(
      (character) => character.id
    );

    const memories = await db
      .select({
        characterId: characterMemories.characterId,
        content: characterMemories.content,
      })
      .from(characterMemories)
      .where(
        and(
          eq(
            characterMemories.universeId,
            universeId
          ),
          inArray(
            characterMemories.characterId,
            candidateIds
          )
        )
      )
      .orderBy(
        desc(characterMemories.importance)
      )
      .limit(80);

    const relationshipData = await db
      .select({
        sourceCharacterId:
          relationships.sourceCharacterId,
        targetCharacterId:
          relationships.targetCharacterId,
        relationshipType:
          relationships.relationshipType,
        affection: relationships.affection,
        trust: relationships.trust,
        attraction: relationships.attraction,
        tension: relationships.tension,
      })
      .from(relationships)
      .where(
        and(
          eq(relationships.universeId, universeId),
          eq(
            relationships.targetCharacterId,
            post.authorId
          ),
          inArray(
            relationships.sourceCharacterId,
            candidateIds
          )
        )
      );

    const reactionCharacters: ReactionCharacter[] =
      available.map((character) => {
        const relation = relationshipData.find(
          (item) =>
            item.sourceCharacterId === character.id
        );

        const relationshipWithAuthor = relation
          ? [
              `Tipo: ${
                relation.relationshipType ||
                "não definido"
              }`,
              `Afeto: ${relation.affection}`,
              `Confiança: ${relation.trust}`,
              `Atração: ${relation.attraction}`,
              `Tensão: ${relation.tension}`,
            ].join("; ")
          : "Relação ainda não registrada.";

        return {
          id: character.id,
          name: character.name,
          username: character.username,
          bio: character.bio,
          background: character.background,
          personality: character.personality,
          relationshipWithAuthor,
          knownFacts: memories
            .filter(
              (memory) =>
                memory.characterId === character.id
            )
            .slice(0, 10)
            .map((memory) => memory.content),
        };
      });

    const decisions =
      await decideCharacterReactions({
        universeName: universe.name,
        universeDescription:
          universe.description,
        sourceCanon: universe.sourceCanon,
        post: {
          authorId: post.authorId,
          authorName: post.authorName,
          content: post.content,
        },
        characters: reactionCharacters,
      });

    const savedReactions: Array<{
      characterId: string;
      action: "like" | "comment";
      comment?: string;
    }> = [];

    for (const decision of decisions) {
      if (alreadyReacted.has(decision.characterId)) {
        continue;
      }

      if (
        !candidateIds.includes(
          decision.characterId
        )
      ) {
        continue;
      }

      if (decision.action === "ignore") {
        continue;
      }

      if (decision.action === "like") {
        await db.insert(postInteractions).values({
          postId,
          characterId: decision.characterId,
          type: "like",
        });

        savedReactions.push({
          characterId: decision.characterId,
          action: "like",
        });

        continue;
      }

      if (
        decision.action === "comment" &&
        decision.comment?.trim()
      ) {
        const comment = decision.comment
          .trim()
          .slice(0, 350);

        await db.insert(postInteractions).values({
          postId,
          characterId: decision.characterId,
          type: "comment",
          content: comment,
        });

        savedReactions.push({
          characterId: decision.characterId,
          action: "comment",
          comment,
        });
      }
    }

    return respond({
      success: true,
      reactions: savedReactions,
      message:
        savedReactions.length > 0
          ? "Os personagens reagiram à publicação!"
          : "Os personagens decidiram não reagir desta vez.",
    });
  } catch (error) {
    console.error(
      "Erro nas reações automáticas:",
      error
    );

    return respond(
      {
        error:
          "Não foi possível processar as reações automáticas.",
      },
      500
    );
  }
}
