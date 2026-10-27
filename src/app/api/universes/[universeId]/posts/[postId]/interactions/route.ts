
import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import {
  characters,
  posts,
  postInteractions,
} from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    universeId: string;
    postId: string;
  }>;
};

const createInteractionSchema = z
  .discriminatedUnion("type", [
    z.object({
      type: z.literal("like"),
      characterId: z.string().uuid(),
    }).strict(),
    z.object({
      type: z.literal("comment"),
      characterId: z.string().uuid(),
      content: z.string().trim().min(1).max(2000),
    }).strict(),
  ]);

const removeLikeSchema = z.object({
  characterId: z.string().uuid(),
}).strict();

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

async function getValidIds(context: RouteContext) {
  const { universeId, postId } = await context.params;

  if (
    !z.string().uuid().safeParse(universeId).success ||
    !z.string().uuid().safeParse(postId).success
  ) {
    return null;
  }

  return { universeId, postId };
}

async function postExists(
  universeId: string,
  postId: string
) {
  const [post] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(
      and(
        eq(posts.id, postId),
        eq(posts.universeId, universeId)
      )
    )
    .limit(1);

  return Boolean(post);
}

async function characterExists(
  universeId: string,
  characterId: string
) {
  const [character] = await db
    .select({ id: characters.id })
    .from(characters)
    .where(
      and(
        eq(characters.id, characterId),
        eq(characters.universeId, universeId)
      )
    )
    .limit(1);

  return Boolean(character);
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const ids = await getValidIds(context);

    if (!ids) {
      return errorResponse(
        "Identificador inválido.",
        400
      );
    }

    if (
      !(await postExists(ids.universeId, ids.postId))
    ) {
      return errorResponse(
        "Publicação não encontrada.",
        404
      );
    }

    const interactions = await db
      .select({
        id: postInteractions.id,
        type: postInteractions.type,
        content: postInteractions.content,
        characterId: postInteractions.characterId,
        createdAt: postInteractions.createdAt,
        characterName: characters.name,
        characterUsername: characters.username,
        characterAvatarUrl: characters.avatarUrl,
      })
      .from(postInteractions)
      .innerJoin(
        characters,
        eq(
          postInteractions.characterId,
          characters.id
        )
      )
      .where(
        eq(postInteractions.postId, ids.postId)
      )
      .orderBy(
        asc(postInteractions.createdAt)
      );

    const likes = interactions.filter(
      (item) => item.type === "like"
    );

    const comments = interactions.filter(
      (item) => item.type === "comment"
    );

    return NextResponse.json(
      {
        likeCount: likes.length,
        commentCount: comments.length,
        likedByCharacterIds: likes.map(
          (item) => item.characterId
        ),
        comments,
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    console.error(
      "Erro ao carregar interações:",
      error
    );

    return errorResponse(
      "Não foi possível carregar as interações.",
      500
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const ids = await getValidIds(context);

    if (!ids) {
      return errorResponse(
        "Identificador inválido.",
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

    const parsed =
      createInteractionSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues[0]?.message ||
          "Dados da interação inválidos.",
        400
      );
    }

    const data = parsed.data;

    if (
      !(await postExists(ids.universeId, ids.postId))
    ) {
      return errorResponse(
        "Publicação não encontrada.",
        404
      );
    }

    if (
      !(await characterExists(
        ids.universeId,
        data.characterId
      ))
    ) {
      return errorResponse(
        "Personagem não encontrado neste universo.",
        404
      );
    }

    if (data.type === "like") {
      const [existingLike] = await db
        .select({ id: postInteractions.id })
        .from(postInteractions)
        .where(
          and(
            eq(postInteractions.postId, ids.postId),
            eq(
              postInteractions.characterId,
              data.characterId
            ),
            eq(postInteractions.type, "like")
          )
        )
        .limit(1);

      if (existingLike) {
        return NextResponse.json({
          message: "Este personagem já curtiu o post.",
          alreadyLiked: true,
        });
      }

      const [interaction] = await db
        .insert(postInteractions)
        .values({
          postId: ids.postId,
          characterId: data.characterId,
          type: "like",
        })
        .returning();

      return NextResponse.json(
        {
          interaction,
          message: "Publicação curtida!",
        },
        { status: 201 }
      );
    }

    const [interaction] = await db
      .insert(postInteractions)
      .values({
        postId: ids.postId,
        characterId: data.characterId,
        type: "comment",
        content: data.content,
      })
      .returning();

    return NextResponse.json(
      {
        interaction,
        message: "Comentário publicado!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Erro ao criar interação:",
      error
    );

    return errorResponse(
      "Não foi possível salvar a interação.",
      500
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const ids = await getValidIds(context);

    if (!ids) {
      return errorResponse(
        "Identificador inválido.",
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

    const parsed = removeLikeSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "Personagem inválido.",
        400
      );
    }

    if (
      !(await postExists(ids.universeId, ids.postId))
    ) {
      return errorResponse(
        "Publicação não encontrada.",
        404
      );
    }

    if (
      !(await characterExists(
        ids.universeId,
        parsed.data.characterId
      ))
    ) {
      return errorResponse(
        "Personagem não encontrado neste universo.",
        404
      );
    }

    await db
      .delete(postInteractions)
      .where(
        and(
          eq(postInteractions.postId, ids.postId),
          eq(
            postInteractions.characterId,
            parsed.data.characterId
          ),
          eq(postInteractions.type, "like")
        )
      );

    return NextResponse.json({
      message: "Curtida removida!",
    });
  } catch (error) {
    console.error(
      "Erro ao remover curtida:",
      error
    );

    return errorResponse(
      "Não foi possível remover a curtida.",
      500
    );
  }
}
