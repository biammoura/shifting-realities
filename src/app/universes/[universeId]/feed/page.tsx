
"use client";

import { useCallback, useEffect, useState } from "react";
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

export default function FeedPage() {
  const params = useParams<{ universeId: string }>();
  const universeId = params.universeId;

  const [universe, setUniverse] =
    useState<Universe | null>(null);
  const [characters, setCharacters] =
    useState<Character[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  const [authorId, setAuthorId] = useState("");
  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postError, setPostError] =
    useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const apiBase = `/api/universes/${encodeURIComponent(
    universeId
  )}`;

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [feedResponse, charactersResponse] =
        await Promise.all([
          fetch(
            `/api/universes/${encodeURIComponent(
              universeId
            )}/posts`,
            { cache: "no-store" }
          ),
          fetch(
            `/api/universes/${encodeURIComponent(
              universeId
            )}/characters`,
            { cache: "no-store" }
          ),
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

      setUniverse(feedData.universe);
      setPosts(feedData.posts || []);
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
          )?.id || loadedCharacters[0]?.id || ""
        );
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao carregar o feed."
      );
    } finally {
      setLoading(false);
    }
  }, [universeId]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  async function publishPost(
    event: React.FormEvent<HTMLFormElement>
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

      setPosts((current) => [
        data.post!,
        ...current,
      ]);

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
          borderBottom: "1px solid var(--sr-border)",
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
            alignItems: "center",
            justifyContent: "space-between",
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
              Seu feed <span>🌸</span>
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
              border: "1px solid var(--sr-border)",
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
              style={{ marginBottom: 12 }}
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
                    Publicar como
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
                      name={selectedCharacter?.name || ""}
                      image={selectedCharacter?.avatarUrl}
                    />

                    <select
                      id="post-author"
                      value={authorId}
                      onChange={(event) =>
                        setAuthorId(event.target.value)
                      }
                      style={{
                        flex: 1,
                        minWidth: 0,
                        padding: 12,
                        borderRadius: 12,
                        border:
                          "1px solid var(--sr-border)",
                        background: "var(--sr-surface)",
                        color: "var(--sr-text)",
                        fontSize: 16,
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
                      setContent(event.target.value)
                    }
                    maxLength={5000}
                    rows={4}
                    placeholder="Escreva algo que aconteceu na sua realidade... ♡"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: 14,
                      borderRadius: 14,
                      border:
                        "1px solid var(--sr-border)",
                      background: "var(--sr-surface)",
                      color: "var(--sr-text)",
                      fontFamily: "inherit",
                      fontSize: 16,
                      resize: "vertical",
                      lineHeight: 1.6,
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
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
                          <LoaderCircle size={17} />
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
                        marginTop: 12,
                      }}
                    >
                      {postError}
                    </p>
                  )}

                  {notice && (
                    <p
                      role="status"
                      style={{
                        color: "var(--sr-primary)",
                        fontSize: 13,
                        marginTop: 12,
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
                justifyContent: "space-between",
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
                  style={{ marginBottom: 13 }}
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
                  Ainda não existem publicações neste
                  universo. Escreva o primeiro post!
                </p>
              </section>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: 14,
                }}
              >
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="sr-card"
                    style={{ padding: 20 }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                        marginBottom: 15,
                      }}
                    >
                      <Link
                        href={`/universes/${universeId}/characters/${post.authorId}`}
                        style={{
                          textDecoration: "none",
                        }}
                      >
                        <Avatar
                          name={post.authorName}
                          image={post.authorAvatarUrl}
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
                            color: "var(--sr-text)",
                            fontWeight: 700,
                            textDecoration: "none",
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
                            overflowWrap: "anywhere",
                          }}
                        >
                          @{post.authorUsername}
                        </p>

                        <span
                          className="sr-muted"
                          style={{ fontSize: 11 }}
                        >
                          {formatDate(post.narrativeTime)}
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
                        whiteSpace: "pre-wrap",
                        overflowWrap: "anywhere",
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
                        color: "var(--sr-text-muted)",
                        fontSize: 12,
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                        title="Curtidas em desenvolvimento"
                      >
                        <Heart size={17} />
                        Curtir
                      </span>

                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                        title="Comentários em desenvolvimento"
                      >
                        <MessageCircle size={17} />
                        Comentar
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
