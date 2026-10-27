
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Bot,
  Crown,
  Heart,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  Sparkles,
  UserRound,
  WandSparkles,
} from "lucide-react";

type Character = {
  id: string;
  universeId: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  appearance: string | null;
  background: string | null;
  personality: unknown;
  isAvatar: boolean;
  isMajor: boolean;
  isAiControlled: boolean;
  createdAt: string;
};

type Universe = {
  id: string;
  name: string;
};

type CharacterResponse = {
  character?: Character;
  universe?: Universe;
  error?: string;
};

function getPersonalityText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    const data = value as Record<string, unknown>;

    if (typeof data.description === "string") {
      return data.description;
    }

    const details = Object.entries(data)
      .filter(
        ([, item]) =>
          typeof item === "string" ||
          typeof item === "number" ||
          typeof item === "boolean"
      )
      .map(([key, item]) => `${key}: ${String(item)}`);

    return details.join("\n");
  }

  return "";
}

function InfoSection({
  title,
  content,
  emoji,
}: {
  title: string;
  content: string;
  emoji: string;
}) {
  return (
    <section
      className="sr-card"
      style={{
        padding: 22,
        marginBottom: 16,
      }}
    >
      <h2
        style={{
          fontSize: 17,
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 9,
        }}
      >
        <span>{emoji}</span>
        {title}
      </h2>

      <p
        className="sr-muted"
        style={{
          fontSize: 14,
          lineHeight: 1.8,
          margin: 0,
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
        }}
      >
        {content}
      </p>
    </section>
  );
}

export default function CharacterProfilePage() {
  const params = useParams<{
    universeId: string;
    characterId: string;
  }>();

  const { universeId, characterId } = params;

  const [character, setCharacter] =
    useState<Character | null>(null);

  const [universe, setUniverse] =
    useState<Universe | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadCharacter = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/universes/${encodeURIComponent(
          universeId
        )}/characters/${encodeURIComponent(characterId)}`,
        {
          cache: "no-store",
        }
      );

      const data: CharacterResponse =
        await response.json();

      if (
        !response.ok ||
        !data.character ||
        !data.universe
      ) {
        throw new Error(
          data.error ||
            "Não foi possível carregar este personagem."
        );
      }

      setCharacter(data.character);
      setUniverse(data.universe);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar o personagem."
      );
    } finally {
      setLoading(false);
    }
  }, [universeId, characterId]);

  useEffect(() => {
    void loadCharacter();
  }, [loadCharacter]);

  const personality = character
    ? getPersonalityText(character.personality)
    : "";

  const backHref =
    `/universes/${universeId}/characters`;

  return (
    <main
      className="sr-page"
      style={{
        minHeight: "100vh",
        background: "var(--sr-background)",
        paddingBottom: 70,
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "var(--sr-surface)",
          borderBottom: "1px solid var(--sr-border)",
          padding: "15px 18px",
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
            href={backHref}
            style={{
              color: "var(--sr-text)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 13,
            }}
          >
            <ArrowLeft size={19} />
            Voltar
          </Link>

          <strong
            style={{
              color: "var(--sr-primary)",
              fontSize: 17,
            }}
          >
            Shifting Realities
          </strong>

          <WandSparkles
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
        {loading ? (
          <div
            className="sr-card"
            style={{
              padding: 45,
              textAlign: "center",
            }}
          >
            <LoaderCircle
              size={32}
              color="var(--sr-primary)"
              style={{ marginBottom: 14 }}
            />

            <p className="sr-muted">
              Carregando perfil...
            </p>
          </div>
        ) : error ? (
          <div
            className="sr-card"
            role="alert"
            style={{
              padding: 28,
              textAlign: "center",
            }}
          >
            <h1
              style={{
                fontSize: 21,
                marginBottom: 12,
              }}
            >
              Não conseguimos abrir este perfil
            </h1>

            <p
              className="sr-muted"
              style={{ marginBottom: 20 }}
            >
              {error}
            </p>

            <button
              type="button"
              className="sr-button"
              onClick={() => void loadCharacter()}
            >
              <RefreshCw size={17} />
              Tentar novamente
            </button>
          </div>
        ) : character ? (
          <>
            <section
              className="sr-card"
              style={{
                overflow: "hidden",
                padding: 0,
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  height: 135,
                  background:
                    "linear-gradient(120deg, #fbcfe8, #f5d0fe, #ddd6fe)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 18,
                    right: 20,
                    color: "#ffffff",
                    opacity: 0.9,
                  }}
                >
                  <Sparkles size={30} />
                </div>
              </div>

              <div
                style={{
                  padding: "0 23px 25px",
                }}
              >
                <div
                  style={{
                    width: 102,
                    height: 102,
                    borderRadius: "50%",
                    border:
                      "5px solid var(--sr-surface)",
                    background:
                      "var(--sr-primary-soft)",
                    marginTop: -51,
                    marginBottom: 15,
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    color: "var(--sr-primary)",
                  }}
                >
                  {character.avatarUrl ? (
                    <img
                      src={character.avatarUrl}
                      alt={`Foto de ${character.name}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <UserRound size={49} />
                  )}
                </div>

                <h1
                  style={{
                    fontSize:
                      "clamp(24px, 6vw, 30px)",
                    fontWeight: 800,
                    marginBottom: 4,
                    overflowWrap: "anywhere",
                  }}
                >
                  {character.name}
                </h1>

                <p
                  style={{
                    color: "var(--sr-primary)",
                    fontSize: 14,
                    marginBottom: 16,
                    overflowWrap: "anywhere",
                  }}
                >
                  @{character.username}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: 18,
                  }}
                >
                  {character.isAvatar && (
                    <span className="sr-badge">
                      <Heart size={13} />
                      Meu avatar
                    </span>
                  )}

                  {character.isMajor && (
                    <span className="sr-badge">
                      <Crown size={13} />
                      Personagem principal
                    </span>
                  )}

                  {character.isAiControlled && (
                    <span className="sr-badge">
                      <Bot size={13} />
                      Controlado por IA
                    </span>
                  )}
                </div>

                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.8,
                    marginBottom: 18,
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                  }}
                >
                  {character.bio ||
                    "Este personagem ainda não possui uma biografia."}
                </p>

                {universe && (
                  <div
                    style={{
                      background:
                        "var(--sr-primary-soft)",
                      borderRadius: 14,
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      fontSize: 13,
                    }}
                  >
                    <Sparkles
                      size={17}
                      color="var(--sr-primary)"
                    />

                    <span>
                      Universo:{" "}
                      <strong>{universe.name}</strong>
                    </span>
                  </div>
                )}
              </div>
            </section>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <div
                className="sr-card"
                style={{
                  padding: 17,
                  textAlign: "center",
                }}
              >
                <BookOpen
                  size={22}
                  color="var(--sr-primary)"
                  style={{ marginBottom: 8 }}
                />

                <strong
                  style={{
                    display: "block",
                    fontSize: 14,
                  }}
                >
                  Minha história
                </strong>

                <span
                  className="sr-muted"
                  style={{ fontSize: 12 }}
                >
                  Informações do personagem
                </span>
              </div>

              <div
                className="sr-card"
                style={{
                  padding: 17,
                  textAlign: "center",
                }}
              >
                <MessageCircle
                  size={22}
                  color="var(--sr-primary)"
                  style={{ marginBottom: 8 }}
                />

                <strong
                  style={{
                    display: "block",
                    fontSize: 14,
                  }}
                >
                  Interações
                </strong>

                <span
                  className="sr-muted"
                  style={{ fontSize: 12 }}
                >
                  Em desenvolvimento
                </span>
              </div>
            </div>

            <InfoSection
              title="Personalidade"
              emoji="🦋"
              content={
                personality ||
                "A personalidade deste personagem ainda não foi definida."
              }
            />

            <InfoSection
              title="Aparência"
              emoji="🌷"
              content={
                character.appearance ||
                "A aparência deste personagem ainda não foi descrita."
              }
            />

            <InfoSection
              title="História e passado"
              emoji="📖"
              content={
                character.background ||
                "A história deste personagem ainda não foi escrita."
              }
            />

            <section
              className="sr-card"
              style={{
                padding: 22,
                marginTop: 22,
              }}
            >
              <h2
                style={{
                  fontSize: 19,
                  marginBottom: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                }}
              >
                <Sparkles
                  size={20}
                  color="var(--sr-primary)"
                />
                Publicações
              </h2>

              <div
                style={{
                  padding: "28px 14px",
                  textAlign: "center",
                  borderRadius: 17,
                  background:
                    "var(--sr-surface-secondary)",
                }}
              >
                <MessageCircle
                  size={30}
                  color="var(--sr-primary)"
                  style={{ marginBottom: 10 }}
                />

                <p
                  style={{
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  Nenhuma publicação por enquanto
                </p>

                <p
                  className="sr-muted"
                  style={{
                    fontSize: 13,
                    lineHeight: 1.6,
                    marginBottom: 0,
                  }}
                >
                  Aqui aparecerão os posts deste
                  personagem quando o feed estiver
                  funcionando.
                </p>
              </div>
            </section>

            <div
              style={{
                marginTop: 24,
                textAlign: "center",
                padding: 18,
                borderRadius: 20,
                background:
                  "var(--sr-primary-soft)",
              }}
            >
              <p
                style={{
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                Every person has a universe inside. ♡
              </p>

              <p
                className="sr-muted"
                style={{
                  fontSize: 12,
                  marginBottom: 0,
                }}
              >
                Em breve, este perfil terá publicações,
                amizades, relacionamentos e memórias.
              </p>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
