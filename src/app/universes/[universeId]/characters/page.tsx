
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Check,
  Crown,
  LoaderCircle,
  Plus,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";

type Character = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  bio: string | null;
  appearance: string | null;
  background: string | null;
  personality: Record<string, unknown>;
  isAvatar: boolean;
  isMajor: boolean;
  isAiControlled: boolean;
};

type UniverseInfo = {
  id: string;
  name: string;
};

const colors = [
  "#fce7f3",
  "#ede9fe",
  "#dbeafe",
  "#fef3c7",
  "#dcfce7",
  "#ffe4e6",
];

const symbols = ["🌸", "🦋", "🌷", "✨", "🎀", "🌙"];

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 15px",
  borderRadius: 14,
  border: "1px solid var(--sr-border)",
  background: "var(--sr-surface)",
  color: "var(--sr-text)",
  fontSize: 16,
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 14,
  fontWeight: 600,
  marginBottom: 8,
};

export default function CharactersPage() {
  const params = useParams<{ universeId: string }>();
  const universeId = params.universeId;

  const [universe, setUniverse] = useState<UniverseInfo | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [appearance, setAppearance] = useState("");
  const [personality, setPersonality] = useState("");
  const [background, setBackground] = useState("");
  const [isAvatar, setIsAvatar] = useState(false);
  const [isMajor, setIsMajor] = useState(false);
  const [isAiControlled, setIsAiControlled] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadCharacters = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [charactersResponse, universeResponse] =
        await Promise.all([
          fetch(
            `/api/universes/${encodeURIComponent(universeId)}/characters`,
            { cache: "no-store" }
          ),
          fetch(
            `/api/universes/${encodeURIComponent(universeId)}`,
            { cache: "no-store" }
          ),
        ]);

      const charactersData: {
        characters?: Character[];
        error?: string;
      } = await charactersResponse.json();

      const universeData: {
        universe?: UniverseInfo;
        error?: string;
      } = await universeResponse.json();

      if (!charactersResponse.ok) {
        throw new Error(
          charactersData.error ||
            "Não foi possível carregar os personagens."
        );
      }

      if (!universeResponse.ok) {
        throw new Error(
          universeData.error ||
            "Não foi possível carregar o universo."
        );
      }

      setCharacters(charactersData.characters || []);
      setUniverse(universeData.universe || null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar personagens."
      );
    } finally {
      setLoading(false);
    }
  }, [universeId]);

  useEffect(() => {
    void loadCharacters();
  }, [loadCharacters]);

  function openCreate() {
    setName("");
    setUsername("");
    setBio("");
    setAppearance("");
    setPersonality("");
    setBackground("");
    setIsAvatar(false);
    setIsMajor(false);
    setIsAiControlled(true);
    setFormError(null);
    setNotice(null);
    setShowCreate(true);
  }

  async function createCharacter(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setSaving(true);
    setFormError(null);

    try {
      const response = await fetch(
        `/api/universes/${encodeURIComponent(universeId)}/characters`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            username: username
              .trim()
              .replace(/^@/, "")
              .toLowerCase(),
            bio: bio.trim(),
            appearance: appearance.trim(),
            personality: personality.trim(),
            background: background.trim(),
            isAvatar,
            isMajor,
            isAiControlled: isAvatar
              ? false
              : isAiControlled,
          }),
        }
      );

      const data: {
        character?: Character;
        error?: string;
      } = await response.json();

      if (!response.ok || !data.character) {
        throw new Error(
          data.error ||
            "Não foi possível criar o personagem."
        );
      }

      setCharacters((current) => [
        ...current,
        data.character!,
      ]);

      setShowCreate(false);
      setNotice(
        `${data.character.name} entrou para este universo! ♡`
      );
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Erro ao salvar personagem."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      className="sr-page"
      style={{
        minHeight: "100vh",
        padding: "24px 16px 70px",
        background:
          "radial-gradient(circle at top, var(--sr-primary-soft), var(--sr-background) 65%)",
      }}
    >
      <div
        className="sr-container sr-animate-in"
        style={{ maxWidth: 820, margin: "0 auto" }}
      >
        <Link
          href={`/universes/${universeId}`}
          className="sr-muted"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
            marginBottom: 30,
          }}
        >
          <ArrowLeft size={19} />
          Voltar ao universo
        </Link>

        <header
          style={{
            textAlign: "center",
            marginBottom: 30,
          }}
        >
          <div
            style={{
              width: 70,
              height: 70,
              borderRadius: 24,
              background: "var(--sr-primary-soft)",
              color: "var(--sr-primary)",
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Users size={34} />
          </div>

          <span
            className="sr-badge"
            style={{ marginBottom: 14 }}
          >
            <Sparkles size={14} />
            Meet the characters
          </span>

          <h1
            style={{
              fontSize: "clamp(28px, 6vw, 40px)",
              fontWeight: 800,
              marginBottom: 10,
            }}
          >
            Meus{" "}
            <span style={{ color: "var(--sr-primary)" }}>
              personagens
            </span>
          </h1>

          <p className="sr-muted">
            {universe
              ? `As pessoas que fazem parte de ${universe.name}. ♡`
              : "Cada pessoa tem uma história para contar. ♡"}
          </p>
        </header>

        <section
          className="sr-card"
          style={{
            padding: "clamp(20px, 5vw, 32px)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 24,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 20,
                  marginBottom: 5,
                }}
              >
                Elenco da realidade
              </h2>

              <p
                className="sr-muted"
                style={{ fontSize: 13, margin: 0 }}
              >
                Toque em um personagem para abrir seu perfil.
              </p>
            </div>

            <span className="sr-badge">
              {characters.length}{" "}
              {characters.length === 1
                ? "personagem"
                : "personagens"}
            </span>
          </div>

          {loading ? (
            <div
              className="sr-flex-center"
              style={{ padding: 35, gap: 10 }}
            >
              <LoaderCircle
                size={22}
                color="var(--sr-primary)"
              />
              <span className="sr-muted">
                Carregando personagens...
              </span>
            </div>
          ) : error ? (
            <div
              role="alert"
              style={{
                padding: 20,
                borderRadius: 16,
                background: "#fee2e2",
                color: "#991b1b",
                textAlign: "center",
              }}
            >
              <p>{error}</p>

              <button
                type="button"
                onClick={() => void loadCharacters()}
                style={{
                  padding: 10,
                  borderRadius: 12,
                  cursor: "pointer",
                }}
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fill, minmax(145px, 1fr))",
                gap: 15,
              }}
            >
              {characters.map((character, index) => (
                <Link
                  key={character.id}
                  href={`/universes/${universeId}/characters/${character.id}`}
                  className="sr-card sr-card-interactive"
                  aria-label={`Abrir perfil de ${character.name}`}
                  style={{
                    display: "block",
                    padding: 14,
                    borderRadius: 20,
                    border:
                      "1px solid var(--sr-border)",
                    textAlign: "center",
                    overflowWrap: "anywhere",
                    textDecoration: "none",
                    color: "var(--sr-text)",
                  }}
                >
                  <div
                    style={{
                      width: 74,
                      height: 74,
                      borderRadius: "50%",
                      background:
                        colors[index % colors.length],
                      margin: "0 auto 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 33,
                      overflow: "hidden",
                    }}
                  >
                    {character.avatarUrl ? (
                      <img
                        src={character.avatarUrl}
                        alt={character.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      symbols[index % symbols.length]
                    )}
                  </div>

                  <strong
                    style={{
                      display: "block",
                      fontSize: 14,
                      marginBottom: 4,
                    }}
                  >
                    {character.name}
                  </strong>

                  <p
                    style={{
                      color: "var(--sr-primary)",
                      fontSize: 12,
                      marginBottom: 10,
                    }}
                  >
                    @{character.username}
                  </p>

                  {character.isAvatar && (
                    <span
                      className="sr-badge"
                      style={{ marginBottom: 8 }}
                    >
                      <UserRound size={12} />
                      Meu avatar
                    </span>
                  )}

                  {character.isMajor && (
                    <span
                      className="sr-badge"
                      style={{ marginBottom: 8 }}
                    >
                      <Crown size={12} />
                      Principal
                    </span>
                  )}

                  {character.isAiControlled && (
                    <span
                      className="sr-badge"
                      style={{ marginBottom: 8 }}
                    >
                      <Bot size={12} />
                      IA
                    </span>
                  )}

                  {character.bio && (
                    <p
                      className="sr-muted"
                      style={{
                        fontSize: 12,
                        marginTop: 8,
                        marginBottom: 0,
                      }}
                    >
                      {character.bio.length > 110
                        ? character.bio.slice(0, 110) +
                          "..."
                        : character.bio}
                    </p>
                  )}
                </Link>
              ))}

              <button
                type="button"
                onClick={openCreate}
                className="sr-card-interactive"
                style={{
                  minHeight: 205,
                  border:
                    "2px dashed var(--sr-border)",
                  borderRadius: 20,
                  background:
                    "var(--sr-surface-secondary)",
                  color: "var(--sr-text)",
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 17,
                    background:
                      "var(--sr-primary-soft)",
                    color: "var(--sr-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Plus size={27} />
                </div>

                <strong style={{ fontSize: 14 }}>
                  Novo personagem
                </strong>

                <span
                  className="sr-muted"
                  style={{ fontSize: 12 }}
                >
                  Uma nova pessoa para sua história.
                </span>
              </button>
            </div>
          )}
        </section>

        {notice && (
          <div
            role="status"
            style={{
              marginTop: 20,
              padding: 16,
              borderRadius: 16,
              background: "var(--sr-primary-soft)",
              textAlign: "center",
            }}
          >
            <Check
              size={17}
              style={{ display: "inline", marginRight: 6 }}
            />
            {notice}
          </div>
        )}

        <div
          style={{
            marginTop: 24,
            padding: 22,
            borderRadius: 20,
            background: "var(--sr-primary-soft)",
            textAlign: "center",
          }}
        >
          <Sparkles
            size={24}
            color="var(--sr-primary)"
            style={{ marginBottom: 10 }}
          />

          <p style={{ fontWeight: 600, marginBottom: 5 }}>
            Every character has a story. ♡
          </p>

          <p
            className="sr-muted"
            style={{ fontSize: 12, marginBottom: 0 }}
          >
            Em breve, seus personagens terão
            relacionamentos, memórias e interações.
          </p>
        </div>
      </div>

      {showCreate && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(31, 20, 35, 0.55)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 16,
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-character-title"
            className="sr-card sr-animate-in"
            style={{
              width: "100%",
              maxWidth: 480,
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 24,
            }}
          >
            <div
              className="sr-flex-between"
              style={{ marginBottom: 18 }}
            >
              <h2
                id="create-character-title"
                style={{ fontSize: 22, margin: 0 }}
              >
                Novo personagem 🌷
              </h2>

              <button
                type="button"
                onClick={() => setShowCreate(false)}
                disabled={saving}
                aria-label="Fechar"
                style={{
                  background: "transparent",
                  border: 0,
                  color: "var(--sr-text)",
                  cursor: "pointer",
                }}
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={createCharacter}>
              <label htmlFor="character-name" style={labelStyle}>
                Nome do personagem *
              </label>

              <input
                id="character-name"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                maxLength={150}
                required
                placeholder="Ex.: Hermione Granger"
                style={{
                  ...fieldStyle,
                  marginBottom: 18,
                }}
              />

              <label htmlFor="character-username" style={labelStyle}>
                @usuário *
              </label>

              <input
                id="character-username"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                maxLength={80}
                required
                placeholder="Ex.: hermione_granger"
                autoCapitalize="none"
                style={{
                  ...fieldStyle,
                  marginBottom: 18,
                }}
              />

              <label htmlFor="character-bio" style={labelStyle}>
                Biografia
              </label>

              <textarea
                id="character-bio"
                value={bio}
                onChange={(event) =>
                  setBio(event.target.value)
                }
                maxLength={3000}
                rows={2}
                placeholder="Uma pequena apresentação..."
                style={{
                  ...fieldStyle,
                  marginBottom: 18,
                  resize: "vertical",
                }}
              />

              <label
                htmlFor="character-appearance"
                style={labelStyle}
              >
                Aparência
              </label>

              <textarea
                id="character-appearance"
                value={appearance}
                onChange={(event) =>
                  setAppearance(event.target.value)
                }
                maxLength={10000}
                rows={2}
                placeholder="Como essa pessoa se parece?"
                style={{
                  ...fieldStyle,
                  marginBottom: 18,
                  resize: "vertical",
                }}
              />

              <label
                htmlFor="character-personality"
                style={labelStyle}
              >
                Personalidade
              </label>

              <textarea
                id="character-personality"
                value={personality}
                onChange={(event) =>
                  setPersonality(event.target.value)
                }
                maxLength={10000}
                rows={3}
                placeholder="Jeito de falar, atitudes, qualidades, defeitos..."
                style={{
                  ...fieldStyle,
                  marginBottom: 18,
                  resize: "vertical",
                }}
              />

              <label
                htmlFor="character-background"
                style={labelStyle}
              >
                História e passado
              </label>

              <textarea
                id="character-background"
                value={background}
                onChange={(event) =>
                  setBackground(event.target.value)
                }
                maxLength={20000}
                rows={3}
                placeholder="Família, experiências, segredos e acontecimentos importantes..."
                style={{
                  ...fieldStyle,
                  marginBottom: 22,
                  resize: "vertical",
                }}
              />

              <div
                style={{
                  background:
                    "var(--sr-surface-secondary)",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 20,
                  display: "grid",
                  gap: 16,
                }}
              >
                <label
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    fontSize: 13,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isAvatar}
                    onChange={(event) =>
                      setIsAvatar(event.target.checked)
                    }
                  />

                  <span>
                    <strong>Este personagem sou eu</strong>
                    <span
                      className="sr-muted"
                      style={{ display: "block" }}
                    >
                      Seu avatar dentro desta realidade.
                    </span>
                  </span>
                </label>

                <label
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                    fontSize: 13,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isMajor}
                    onChange={(event) =>
                      setIsMajor(event.target.checked)
                    }
                  />

                  <span>
                    <strong>Personagem principal</strong>
                    <span
                      className="sr-muted"
                      style={{ display: "block" }}
                    >
                      Terá destaque na narrativa.
                    </span>
                  </span>
                </label>

                {!isAvatar && (
                  <label
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      fontSize: 13,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isAiControlled}
                      onChange={(event) =>
                        setIsAiControlled(
                          event.target.checked
                        )
                      }
                    />

                    <span>
                      <strong>
                        Controlado pela IA
                      </strong>
                      <span
                        className="sr-muted"
                        style={{ display: "block" }}
                      >
                        Poderá agir autonomamente quando
                        a IA for ativada.
                      </span>
                    </span>
                  </label>
                )}
              </div>

              {formError && (
                <p
                  role="alert"
                  style={{
                    color: "#b91c1c",
                    fontSize: 13,
                    marginBottom: 16,
                  }}
                >
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className="sr-button sr-button-full"
                disabled={
                  saving ||
                  !name.trim() ||
                  !username.trim()
                }
              >
                {saving ? (
                  <>
                    <LoaderCircle size={18} />
                    Salvando personagem...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Criar personagem
                  </>
                )}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
