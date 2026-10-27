
import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import {
  characters,
  posts,
  universes,
} from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    universeId: string;
  }>;
};

const createPostSchema = z
  .object({
    authorId: z.string().uuid(),
    content: z.string().trim().min(1).max(5000),
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

async function getUniverseId(
  context: RouteContext
) {
  const { universeId } = await context.params;

  if (
    !z.string().uuid().safeParse(universeId).success
  ) {
    return null;
  }

  return universeId;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const universeId = await getUniverseId(context);

    if (!universeId) {
      return errorResponse(
        "Identificador de universo inválido.",
        400
      );
    }

    const [universe] = await db
      .select({
        id: universes.id,
        name: universes.name,
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

    const feed = await db
      .select({
        id: posts.id,
        universeId: posts.universeId,
        authorId: posts.authorId,
        content: posts.content,
        media: posts.media,
        narrativeTime: posts.narrativeTime,
        createdAt: posts.createdAt,
        authorName: characters.name,
        authorUsername: characters.username,
        authorAvatarUrl: characters.avatarUrl,
        authorIsAvatar: characters.isAvatar,
        authorIsAiControlled:
          characters.isAiControlled,
      })
      .from(posts)
      .innerJoin(
        characters,
        eq(posts.authorId, characters.id)
      )
      .where(eq(posts.universeId, universeId))
      .orderBy(
        desc(posts.narrativeTime),
        desc(posts.createdAt)
      )
      .limit(100);

    return NextResponse.json(
      {
        universe,
        posts: feed,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro ao carregar publicações:",
      error
    );

    return errorResponse(
      "Não foi possível carregar as publicações.",
      500
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const universeId = await getUniverseId(context);

    if (!universeId) {
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
        "Dados da publicação inválidos.",
        400
      );
    }

    const parsed = createPostSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues[0]?.message ||
          "Preencha os dados da publicação.",
        400
      );
    }

    const { authorId, content } = parsed.data;

    const [universe] = await db
      .select({
        id: universes.id,
        narrativeTime: universes.narrativeTime,
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

    const [author] = await db
      .select({
        id: characters.id,
        name: characters.name,
        username: characters.username,
        avatarUrl: characters.avatarUrl,
        isAvatar: characters.isAvatar,
        isAiControlled: characters.isAiControlled,
      })
      .from(characters)
      .where(
        and(
          eq(characters.id, authorId),
          eq(characters.universeId, universeId)
        )
      )
      .limit(1);

    if (!author) {
      return errorResponse(
        "Este personagem não pertence ao universo.",
        404
      );
    }

    const [newPost] = await db
      .insert(posts)
      .values({
        universeId,
        authorId,
        content,
        narrativeTime: universe.narrativeTime,
      })
      .returning();

    return NextResponse.json(
      {
        post: {
          ...newPost,
          authorName: author.name,
          authorUsername: author.username,
          authorAvatarUrl: author.avatarUrl,
          authorIsAvatar: author.isAvatar,
          authorIsAiControlled:
            author.isAiControlled,
        },
        message: "Publicação criada com sucesso!",
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
      "Erro ao criar publicação:",
      error
    );

    return errorResponse(
      "Não foi possível criar a publicação.",
      500
    );
  }
}
