
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

const uuidSchema = z.string().uuid();

const createInteractionSchema = z.discriminatedUnion(
  "type",
  [
    z
      .object({
        type: z.literal("like"),
        characterId: uuidSchema,
      })
      .strict(),

    z
      .object({
        type: z.literal("comment"),
        characterId: uuidSchema,
        content: z
          .string()
          .trim()
          .min(1)
          .max(2000),
        parentCommentId: uuidSchema
          .nullable()
          .optional(),
      })
      .strict(),
  ]
);

const removeLikeSchema = z
  .object({
    characterId: uuidSchema,
  })
  .strict();

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

function successResponse(
  data: unknown,
  status = 200
) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

async function getValidIds(
  context: RouteContext
) {
  const { universeId, postId } =
    await context.params;

  if (
    !uuidSchema.safeParse(universeId).success ||
    !uuidSchema.safeParse(postId).success
  ) {
    return null;
  }

  return {
    universeId,
    postId,
  };
}

async function postExists(
  universeId: string,
  postId: string
) {
  const [post] = await db
    .select({
      id: posts.id,
    })
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
    .select({
      id: characters.id,
    })
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

async function parentCommentExists(
  postId: string,
  parentCommentId: string
) {
  const [comment] = await db
    .select({
      id: postInteractions.id,
    })
    .from(postInteractions)
    .where(
      and(
        eq(
          postInteractions.id,
          parentCommentId
        ),
        eq(
          postInteractions.postId,
          postId
        ),
        eq(
          postInteractions.type,
          "comment"
        )
      )
    )
    .limit(1);

  return Boolean(comment);
}

// CARREGAR CURTIDAS E COMENTÁRIOS

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

    const exists = await postExists(
      ids.universeId,
      ids.postId
    );

    if (!exists) {
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
        characterId:
          postInteractions.characterId,
        parentCommentId:
          postInteractions.parentCommentId,
        createdAt:
          postInteractions.createdAt,
        characterName: characters.name,
        characterUsername:
          characters.username,
        characterAvatarUrl:
          characters.avatarUrl,
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
        eq(
          postInteractions.postId,
          ids.postId
        )
      )
      .orderBy(
        asc(postInteractions.createdAt),
        asc(postInteractions.id)
      );

    const likes = interactions.filter(
      (item) => item.type === "like"
    );

    const comments = interactions.filter(
      (item) => item.type === "comment"
    );

    return successResponse({
      likeCount: likes.length,
      commentCount: comments.length,
      likedByCharacterIds: likes.map(
        (item) => item.characterId
      ),
      comments,
    });
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

// CRIAR CURTIDAS E COMENTÁRIOS

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

    const exists = await postExists(
      ids.universeId,
      ids.postId
    );

    if (!exists) {
      return errorResponse(
        "Publicação não encontrada.",
        404
      );
    }

    const validCharacter =
      await characterExists(
        ids.universeId,
        data.characterId
      );

    if (!validCharacter) {
      return errorResponse(
        "Personagem não encontrado neste universo.",
        404
      );
    }

    // CURTIDAS

    if (data.type === "like") {
      const [existingLike] = await db
        .select({
          id: postInteractions.id,
        })
        .from(postInteractions)
        .where(
          and(
            eq(
              postInteractions.postId,
              ids.postId
            ),
            eq(
              postInteractions.characterId,
              data.characterId
            ),
            eq(
              postInteractions.type,
              "like"
            )
          )
        )
        .limit(1);

      if (existingLike) {
        return successResponse({
          message:
            "Este personagem já curtiu o post.",
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

      return successResponse(
        {
          interaction,
          message: "Publicação curtida!",
        },
        201
      );
    }

    // COMENTÁRIOS E RESPOSTAS

    const parentCommentId =
      data.parentCommentId ?? null;

    if (parentCommentId) {
      const validParent =
        await parentCommentExists(
          ids.postId,
          parentCommentId
        );

      if (!validParent) {
        return errorResponse(
          "O comentário que você está tentando responder não foi encontrado nesta publicação.",
          404
        );
      }
    }

    const [interaction] = await db
      .insert(postInteractions)
      .values({
        postId: ids.postId,
        characterId: data.characterId,
        type: "comment",
        content: data.content,
        parentCommentId,
      })
      .returning();

    return successResponse(
      {
        interaction,
        message: parentCommentId
          ? "Resposta publicada!"
          : "Comentário publicado!",
      },
      201
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

// REMOVER CURTIDAS

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

    const parsed =
      removeLikeSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "Personagem inválido.",
        400
      );
    }

    const exists = await postExists(
      ids.universeId,
      ids.postId
    );

    if (!exists) {
      return errorResponse(
        "Publicação não encontrada.",
        404
      );
    }

    const validCharacter =
      await characterExists(
        ids.universeId,
        parsed.data.characterId
      );

    if (!validCharacter) {
      return errorResponse(
        "Personagem não encontrado neste universo.",
        404
      );
    }

    await db
      .delete(postInteractions)
      .where(
        and(
          eq(
            postInteractions.postId,
            ids.postId
          ),
          eq(
            postInteractions.characterId,
            parsed.data.characterId
          ),
          eq(
            postInteractions.type,
            "like"
          )
        )
      );

    return successResponse({
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
