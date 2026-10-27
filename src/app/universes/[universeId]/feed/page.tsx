
"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Feather,
  Heart,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  Send,
  Sparkles,
  UserRound,
  Users,
} from "lucide-react";

type Character = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  isAvatar: boolean;
  isAiControlled: boolean;
};

type Post = {
  id: string;
  authorId: string;
  content: string;
  narrativeTime: string;
  createdAt: string;
  authorName: string;
  authorUsername: string;
  authorAvatarUrl: string | null;
  authorIsAvatar: boolean;
  authorIsAiControlled: boolean;
};

type Universe = {
  id: string;
  name: string;
};

type Comment = {
  id: string;
  characterId: string;
  characterName: string;
  characterUsername: string;
  characterAvatarUrl: string | null;
  content: string | null;
  createdAt: string;
};

type Interactions = {
  likeCount: number;
  commentCount: number;
  likedByCharacterIds: string[];
  comments: Comment[];
};

function Avatar({
  name,
  image,
  size = 46,
}: {
  name: string;
  image?: string | null;
  size?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--sr-primary-soft)",
        color: "var(--sr-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {image ? (
        <img
          src={image}
          alt={name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <UserRound size={size * 0.53} />
      )}
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: 13,
  borderRadius: 13,
  border: "1px solid var(--sr-border)",
  background: "var(--sr-surface)",
  color: "var(--sr-text)",
  fontFamily: "inherit",
  fontSize: 16,
};

const emptyInteractions: Interactions = {
  likeCount: 0,
  commentCount: 0,
  likedByCharacterIds: [],
  comments: [],
};

export default function FeedPage() {
  const params = useParams<{ universeId: string }>();
  const universeId = params.universeId;

  const apiBase = `/api/universes/${encodeURIComponent(
    universeId
  )}`;

  const [universe, setUniverse] =
    useState<Universe | null>(null);
  const [characters, setCharacters] =
    useState<Character[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  const [authorId, setAuthorId] = useState("");
  const [content, setContent] = useState("");

  const [interactions, setInteractions] = useState<
    Record<string, Interactions>
  >({});

  const [openComments, setOpenComments] = useState<
    Record<string, boolean>
  >({});

  const [commentDrafts, setCommentDrafts] = useState<
    Record<string, string>
  >({});

  const [busyPosts, setBusyPosts] = useState<
    Record<string, boolean>
  >({});

  const [interactionErrors, setInteractionErrors] =
    useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postError, setPostError] =
    useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(
    null
  );

  const interactionUrl = useCallback(
    (postId: string) =>
      `${apiBase}/posts/${encodeURIComponent(
        postId
      )}/interactions`,
    [apiBase]
  );

  const loadInteractions = useCallback(
    async (postId: string): Promise<Interactions> => {
      const response = await fetch(
        interactionUrl(postId),
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Não foi possível carregar as interações."
        );
      }

      return data as Interactions;
    },
    [interactionUrl]
  );

  const refreshInteractions = useCallback(
    async (postId: string) => {
      const data = await loadInteractions(postId);

      setInteractions((current) => ({
        ...current,
        [postId]: data,
      }));
    },
    [loadInteractions]
  );

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [feedResponse, charactersResponse] =
        await Promise.all([
          fetch(`${apiBase}/posts`, {
            cache: "no-store",
          }),
          fetch(`${apiBase}/characters`, {
            cache: "no-store",
          }),
        ]);

      const feedData: {
        universe?: Universe;
        posts?: Post[];
        error?: string;
      } = await feedResponse.json();

      const charactersData: {
        characters?: Character[];
        error?: string;
      } = await charactersResponse.json();

      if (!feedResponse.ok || !feedData.universe) {
        throw new Error(
          feedData.error ||
            "Não foi possível carregar o feed."
        );
      }

      if (!charactersResponse.ok) {
        throw new Error(
          charactersData.error ||
            "Não foi possível carregar os personagens."
        );
      }

      const loadedCharacters =
        charactersData.characters || [];

      const loadedPosts = feedData.posts || [];

      setUniverse(feedData.universe);
      setPosts(loadedPosts);
      setCharacters(loadedCharacters);

      setAuthorId((current) => {
        if (
          current &&
          loadedCharacters.some(
            (character) => character.id === current
          )
        ) {
          return current;
        }

        return (
          loadedCharacters.find(
            (character) => character.isAvatar
          )?.id ||
          loadedCharacters[0]?.id ||
          ""
        );
      });

      const results = await Promise.allSettled(
        loadedPosts.map(async (post) => ({
          postId: post.id,
          data: await loadInteractions(post.id),
        }))
      );

      const nextInteractions: Record<
        string,
        Interactions
      > = {};

      const nextErrors: Record<string, string> = {};

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          nextInteractions[result.value.postId] =
            result.value.data;
        } else {
          nextErrors[loadedPosts[index].id] =
            "Não foi possível carregar as interações.";
        }
      });

      setInteractions(nextInteractions);
      setInteractionErrors(nextErrors);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao carregar o feed."
      );
    } finally {
      setLoading(false);
    }
  }, [apiBase, loadInteractions]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  async function publishPost(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!authorId || !content.trim() || publishing) {
      return;
    }

    setPublishing(true);
    setPostError(null);
    setNotice(null);

    try {
      const response = await fetch(
        `${apiBase}/posts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            authorId,
            content: content.trim(),
          }),
        }
      );

      const data: {
        post?: Post;
        error?: string;
      } = await response.json();

      if (!response.ok || !data.post) {
        throw new Error(
          data.error ||
            "Não foi possível publicar o post."
        );
      }

      const newPost = data.post;

      setPosts((current) => [
        newPost,
        ...current,
      ]);

      setInteractions((current) => ({
        ...current,
        [newPost.id]: { ...emptyInteractions },
      }));

      setContent("");
      setNotice("Publicado com sucesso! ♡");
    } catch (err) {
      setPostError(
        err instanceof Error
          ? err.message
          : "Erro ao publicar."
      );
    } finally {
      setPublishing(false);
    }
  }

  async function toggleLike(postId: string) {
    if (!authorId || busyPosts[postId]) return;

    const current = interactions[postId];

    if (!current) {
      setInteractionErrors((previous) => ({
        ...previous,
        [postId]:
          "Atualize as interações antes de curtir.",
      }));
      return;
    }

    const liked =
      current.likedByCharacterIds.includes(authorId);

    setBusyPosts((previous) => ({
      ...previous,
      [postId]: true,
    }));

    setInteractionErrors((previous) => ({
      ...previous,
      [postId]: "",
    }));

    try {
      const response = await fetch(
        interactionUrl(postId),
        {
          method: liked ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            liked
              ? { characterId: authorId }
              : {
                  type: "like",
                  characterId: authorId,
                }
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Não foi possível atualizar a curtida."
        );
      }

      await refreshInteractions(postId);
    } catch (err) {
      setInteractionErrors((previous) => ({
        ...previous,
        [postId]:
          err instanceof Error
            ? err.message
            : "Erro ao atualizar curtida.",
      }));
    } finally {
      setBusyPosts((previous) => ({
        ...previous,
        [postId]: false,
      }));
    }
  }

  async function submitComment(
    event: FormEvent<HTMLFormElement>,
    postId: string
  ) {
    event.preventDefault();

    const comment = (
      commentDrafts[postId] || ""
    ).trim();

    if (
      !authorId ||
      !comment ||
      busyPosts[postId]
    ) {
      return;
    }

    setBusyPosts((previous) => ({
      ...previous,
      [postId]: true,
    }));

    setInteractionErrors((previous) => ({
      ...previous,
      [postId]: "",
    }));

    try {
      const response = await fetch(
        interactionUrl(postId),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "comment",
            characterId: authorId,
            content: comment,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Não foi possível publicar o comentário."
        );
      }

      setCommentDrafts((previous) => ({
        ...previous,
        [postId]: "",
      }));

      await refreshInteractions(postId);
    } catch (err) {
      setInteractionErrors((previous) => ({
        ...previous,
        [postId]:
          err instanceof Error
            ? err.message
            : "Erro ao comentar.",
      }));
    } finally {
      setBusyPosts((previous) => ({
        ...previous,
        [postId]: false,
      }));
    }
  }

  const selectedCharacter = characters.find(
    (character) => character.id === authorId
  );

  return (
    <main
      className="sr-page"
      style={{
        minHeight: "100vh",
        background: "var(--sr-background)",
        paddingBottom: 80,
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "var(--sr-surface)",
          borderBottom:
            "1px solid var(--sr-border)",
          padding: "15px 16px",
        }}
      >
        <div
          className="sr-container"
          style={{
            maxWidth: 650,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Link
            href={`/universes/${universeId}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              color: "var(--sr-text)",
              textDecoration: "none",
              fontSize: 13,
            }}
          >
            <ArrowLeft size={19} />
            Universo
          </Link>

          <strong
            style={{
              color: "var(--sr-primary)",
              fontSize: 18,
            }}
          >
            Shifting Realities
          </strong>

          <Sparkles
            size={22}
            color="var(--sr-primary)"
          />
        </div>
      </header>

      <div
        className="sr-container sr-animate-in"
        style={{
          maxWidth: 650,
          margin: "0 auto",
          paddingTop: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 27,
                fontWeight: 800,
                marginBottom: 5,
              }}
            >
              Seu feed 🌸
            </h1>

            <p
              className="sr-muted"
              style={{
                fontSize: 13,
                margin: 0,
              }}
            >
              {universe?.name ||
                "Acompanhe sua realidade"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadFeed()}
            disabled={loading}
            aria-label="Atualizar feed"
            style={{
              border:
                "1px solid var(--sr-border)",
              borderRadius: 13,
              background: "var(--sr-surface)",
              color: "var(--sr-primary)",
              padding: 11,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={19} />
          </button>
        </div>

        {loading ? (
          <section
            className="sr-card"
            style={{
              padding: 40,
              textAlign: "center",
            }}
          >
            <LoaderCircle
              size={29}
              color="var(--sr-primary)"
            />
            <p className="sr-muted">
              Carregando sua realidade...
            </p>
          </section>
        ) : error ? (
          <section
            className="sr-card"
            role="alert"
            style={{
              padding: 25,
              textAlign: "center",
            }}
          >
            <p>{error}</p>
            <button
              type="button"
              className="sr-button"
              onClick={() => void loadFeed()}
            >
              Tentar novamente
            </button>
          </section>
        ) : (
          <>
            <section
              className="sr-card"
              style={{
                padding: 20,
                marginBottom: 21,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 17,
                }}
              >
                <Feather
                  size={21}
                  color="var(--sr-primary)"
                />
                <h2
                  style={{
                    fontSize: 17,
                    margin: 0,
                  }}
                >
                  Nova publicação
                </h2>
              </div>

              {characters.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 16,
                    background:
                      "var(--sr-surface-secondary)",
                    borderRadius: 14,
                  }}
                >
                  <Users
                    size={25}
                    color="var(--sr-primary)"
                  />
                  <p
                    className="sr-muted"
                    style={{
                      fontSize: 13,
                      margin: "12px 0",
                    }}
                  >
                    Crie um personagem para começar a
                    publicar.
                  </p>
                  <Link
                    className="sr-button"
                    href={`/universes/${universeId}/characters`}
                  >
                    Criar personagem
                  </Link>
                </div>
              ) : (
                <form onSubmit={publishPost}>
                  <label
                    htmlFor="post-author"
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 9,
                    }}
                  >
                    Interagir como
                  </label>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 16,
                    }}
                  >
                    <Avatar
                      name={
                        selectedCharacter?.name || ""
                      }
                      image={
                        selectedCharacter?.avatarUrl
                      }
                    />

                    <select
                      id="post-author"
                      value={authorId}
                      onChange={(event) =>
                        setAuthorId(
                          event.target.value
                        )
                      }
                      style={{
                        ...inputStyle,
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {characters.map((character) => (
                        <option
                          key={character.id}
                          value={character.id}
                        >
                          {character.name}
                          {character.isAvatar
                            ? " (meu avatar)"
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label
                    htmlFor="post-content"
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 9,
                    }}
                  >
                    O que está acontecendo?
                  </label>

                  <textarea
                    id="post-content"
                    value={content}
                    onChange={(event) =>
                      setContent(
                        event.target.value
                      )
                    }
                    maxLength={5000}
                    rows={4}
                    placeholder="Escreva algo que aconteceu na sua realidade... ♡"
                    style={{
                      ...inputStyle,
                      resize: "vertical",
                      lineHeight: 1.6,
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      gap: 12,
                      marginTop: 12,
                    }}
                  >
                    <span
                      className="sr-muted"
                      style={{ fontSize: 12 }}
                    >
                      {content.length}/5000
                    </span>

                    <button
                      type="submit"
                      className="sr-button"
                      disabled={
                        publishing ||
                        !authorId ||
                        !content.trim()
                      }
                    >
                      {publishing ? (
                        <>
                          <LoaderCircle
                            size={17}
                          />
                          Publicando...
                        </>
                      ) : (
                        <>
                          <Send size={17} />
                          Publicar
                        </>
                      )}
                    </button>
                  </div>

                  {postError && (
                    <p
                      role="alert"
                      style={{
                        color: "#b91c1c",
                        fontSize: 13,
                      }}
                    >
                      {postError}
                    </p>
                  )}

                  {notice && (
                    <p
                      role="status"
                      style={{
                        color:
                          "var(--sr-primary)",
                        fontSize: 13,
                      }}
                    >
                      {notice}
                    </p>
                  )}
                </form>
              )}
            </section>

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: 15,
              }}
            >
              <h2
                style={{
                  fontSize: 19,
                  margin: 0,
                }}
              >
                Publicações
              </h2>

              <span className="sr-badge">
                {posts.length} posts
              </span>
            </div>

            {posts.length === 0 ? (
              <section
                className="sr-card"
                style={{
                  padding: 35,
                  textAlign: "center",
                }}
              >
                <Sparkles
                  size={35}
                  color="var(--sr-primary)"
                />
                <p
                  style={{
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  Sua história começa aqui! ♡
                </p>
                <p
                  className="sr-muted"
                  style={{
                    fontSize: 13,
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  Ainda não existem publicações.
                  Escreva o primeiro post!
                </p>
              </section>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: 14,
                }}
              >
                {posts.map((post) => {
                  const info =
                    interactions[post.id];

                  const liked = Boolean(
                    authorId &&
                      info?.likedByCharacterIds.includes(
                        authorId
                      )
                  );

                  const commentsOpen =
                    Boolean(
                      openComments[post.id]
                    );

                  const busy =
                    Boolean(busyPosts[post.id]);

                  return (
                    <article
                      key={post.id}
                      className="sr-card"
                      style={{ padding: 20 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems:
                            "flex-start",
                          gap: 12,
                          marginBottom: 15,
                        }}
                      >
                        <Link
                          href={`/universes/${universeId}/characters/${post.authorId}`}
                          style={{
                            textDecoration:
                              "none",
                          }}
                        >
                          <Avatar
                            name={
                              post.authorName
                            }
                            image={
                              post.authorAvatarUrl
                            }
                          />
                        </Link>

                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <Link
                            href={`/universes/${universeId}/characters/${post.authorId}`}
                            style={{
                              color:
                                "var(--sr-text)",
                              fontWeight: 700,
                              textDecoration:
                                "none",
                              fontSize: 14,
                            }}
                          >
                            {post.authorName}
                          </Link>

                          <p
                            className="sr-muted"
                            style={{
                              fontSize: 12,
                              margin: "3px 0",
                              overflowWrap:
                                "anywhere",
                            }}
                          >
                            @{post.authorUsername}
                          </p>

                          <span
                            className="sr-muted"
                            style={{
                              fontSize: 11,
                            }}
                          >
                            {formatDate(
                              post.narrativeTime
                            )}
                          </span>
                        </div>

                        {post.authorIsAvatar && (
                          <span className="sr-badge">
                            Meu avatar
                          </span>
                        )}
                      </div>

                      <p
                        style={{
                          fontSize: 15,
                          lineHeight: 1.8,
                          whiteSpace:
                            "pre-wrap",
                          overflowWrap:
                            "anywhere",
                          marginBottom: 18,
                        }}
                      >
                        {post.content}
                      </p>

                      <div
                        style={{
                          borderTop:
                            "1px solid var(--sr-border)",
                          paddingTop: 13,
                          display: "flex",
                          gap: 22,
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          disabled={
                            busy ||
                            !authorId ||
                            !info
                          }
                          onClick={() =>
                            void toggleLike(
                              post.id
                            )
                          }
                          aria-pressed={liked}
                          style={{
                            border: "none",
                            background:
                              "transparent",
                            color: liked
                              ? "#e85b91"
                              : "var(--sr-text-muted)",
                            display: "flex",
                            alignItems:
                              "center",
                            gap: 7,
                            cursor: "pointer",
                            fontSize: 13,
                            padding: 4,
                          }}
                        >
                          <Heart
                            size={19}
                            fill={
                              liked
                                ? "currentColor"
                                : "none"
                            }
                          />
                          {info?.likeCount ??
                            "—"}{" "}
                          Curtidas
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setOpenComments(
                              (previous) => ({
                                ...previous,
                                [post.id]:
                                  !previous[
                                    post.id
                                  ],
                              })
                            )
                          }
                          style={{
                            border: "none",
                            background:
                              "transparent",
                            color:
                              "var(--sr-text-muted)",
                            display: "flex",
                            alignItems:
                              "center",
                            gap: 7,
                            cursor: "pointer",
                            fontSize: 13,
                            padding: 4,
                          }}
                        >
                          <MessageCircle
                            size={19}
                          />
                          {info?.commentCount ??
                            "—"}{" "}
                          Comentários
                        </button>
                      </div>

                      {interactionErrors[
                        post.id
                      ] && (
                        <div
                          role="alert"
                          style={{
                            marginTop: 12,
                            color: "#b91c1c",
                            fontSize: 12,
                          }}
                        >
                          {
                            interactionErrors[
                              post.id
                            ]
                          }
                          <button
                            type="button"
                            onClick={() =>
                              void refreshInteractions(
                                post.id
                              ).then(() =>
                                setInteractionErrors(
                                  (previous) => ({
                                    ...previous,
                                    [post.id]: "",
                                  })
                                )
                              ).catch(() => {
                                setInteractionErrors(
                                  (previous) => ({
                                    ...previous,
                                    [post.id]:
                                      "Não foi possível atualizar.",
                                  })
                                );
                              })
                            }
                            style={{
                              marginLeft: 8,
                              color:
                                "var(--sr-primary)",
                              background:
                                "transparent",
                              border: "none",
                              textDecoration:
                                "underline",
                              cursor: "pointer",
                            }}
                          >
                            Tentar novamente
                          </button>
                        </div>
                      )}

                      {commentsOpen && (
                        <section
                          style={{
                            marginTop: 18,
                            paddingTop: 15,
                            borderTop:
                              "1px solid var(--sr-border)",
                          }}
                        >
                          <h3
                            style={{
                              fontSize: 15,
                              marginBottom: 15,
                            }}
                          >
                            Comentários ♡
                          </h3>

                          {!info ? (
                            <p
                              className="sr-muted"
                              style={{
                                fontSize: 13,
                              }}
                            >
                              Carregando
                              comentários...
                            </p>
                          ) : info.comments.length ===
                            0 ? (
                            <p
                              className="sr-muted"
                              style={{
                                fontSize: 13,
                              }}
                            >
                              Seja o primeiro a
                              comentar!
                            </p>
                          ) : (
                            <div
                              style={{
                                display: "grid",
                                gap: 15,
                                marginBottom: 20,
                              }}
                            >
                              {info.comments.map(
                                (comment) => (
                                  <div
                                    key={
                                      comment.id
                                    }
                                    style={{
                                      display:
                                        "flex",
                                      alignItems:
                                        "flex-start",
                                      gap: 10,
                                    }}
                                  >
                                    <Link
                                      href={`/universes/${universeId}/characters/${comment.characterId}`}
                                    >
                                      <Avatar
                                        name={
                                          comment.characterName
                                        }
                                        image={
                                          comment.characterAvatarUrl
                                        }
                                        size={35}
                                      />
                                    </Link>

                                    <div
                                      style={{
                                        flex: 1,
                                        minWidth: 0,
                                      }}
                                    >
                                      <Link
                                        href={`/universes/${universeId}/characters/${comment.characterId}`}
                                        style={{
                                          fontSize: 13,
                                          fontWeight: 700,
                                          color:
                                            "var(--sr-text)",
                                          textDecoration:
                                            "none",
                                        }}
                                      >
                                        {
                                          comment.characterName
                                        }
                                      </Link>

                                      <span
                                        className="sr-muted"
                                        style={{
                                          fontSize: 11,
                                          marginLeft: 6,
                                        }}
                                      >
                                        @
                                        {
                                          comment.characterUsername
                                        }
                                      </span>

                                      <p
                                        style={{
                                          fontSize: 13,
                                          lineHeight: 1.6,
                                          margin:
                                            "5px 0",
                                          whiteSpace:
                                            "pre-wrap",
                                          overflowWrap:
                                            "anywhere",
                                        }}
                                      >
                                        {
                                          comment.content
                                        }
                                      </p>

                                      <span
                                        className="sr-muted"
                                        style={{
                                          fontSize: 10,
                                        }}
                                      >
                                        {formatDate(
                                          comment.createdAt
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          )}

                          <form
                            onSubmit={(event) =>
                              void submitComment(
                                event,
                                post.id
                              )
                            }
                          >
                            <label
                              htmlFor={`comment-${post.id}`}
                              style={{
                                display: "block",
                                fontSize: 12,
                                fontWeight: 600,
                                marginBottom: 8,
                              }}
                            >
                              Comentando como{" "}
                              {selectedCharacter?.name ||
                                "personagem"}
                            </label>

                            <textarea
                              id={`comment-${post.id}`}
                              rows={2}
                              maxLength={2000}
                              value={
                                commentDrafts[
                                  post.id
                                ] || ""
                              }
                              onChange={(
                                event
                              ) =>
                                setCommentDrafts(
                                  (previous) => ({
                                    ...previous,
                                    [post.id]:
                                      event.target.value,
                                  })
                                )
                              }
                              placeholder="Escreva um comentário..."
                              style={{
                                ...inputStyle,
                                resize:
                                  "vertical",
                              }}
                            />

                            <div
                              style={{
                                display: "flex",
                                justifyContent:
                                  "flex-end",
                                marginTop: 10,
                              }}
                            >
                              <button
                                type="submit"
                                className="sr-button"
                                disabled={
                                  busy ||
                                  !authorId ||
                                  !(
                                    commentDrafts[
                                      post.id
                                    ] || ""
                                  ).trim()
                                }
                              >
                                <Send
                                  size={15}
                                />
                                {busy
                                  ? "Enviando..."
                                  : "Comentar"}
                              </button>
                            </div>
                          </form>
                        </section>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
