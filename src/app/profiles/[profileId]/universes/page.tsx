
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookHeart,
  Check,
  LoaderCircle,
  Plus,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";

type Universe = {
  id: string;
  profileId: string;
  name: string;
  description: string | null;
  sourceCanon: string | null;
  createdAt: string;
};

type Profile = {
  id: string;
  name: string;
};

const cardColors = [
  "#fce7f3",
  "#ede9fe",
  "#dbeafe",
  "#fef3c7",
  "#dcfce7",
  "#ffe4e6",
];

const cardSymbols = ["🪄", "🌷", "✨", "🦋", "🌙", "🎀"];

export default function UniversesPage() {
  const params = useParams<{ profileId: string }>();
  const profileId = params.profileId;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceCanon, setSourceCanon] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadUniverses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/profiles/${encodeURIComponent(profileId)}/universes`,
        { cache: "no-store" }
      );

      const data: {
        profile?: Profile;
        universes?: Universe[];
        error?: string;
      } = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Não foi possível carregar os universos."
        );
      }

      setProfile(data.profile || null);
      setUniverses(data.universes || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar os universos."
      );
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    void loadUniverses();
  }, [loadUniverses]);

  function openCreate() {
    setName("");
    setDescription("");
    setSourceCanon("");
    setFormError(null);
    setNotice(null);
    setShowCreate(true);
  }

  async function createUniverse(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setFormError("Escolha um nome para seu universo.");
      return;
    }

    setSaving(true);
    setFormError(null);

    try {
      const response = await fetch(
        `/api/profiles/${encodeURIComponent(profileId)}/universes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            sourceCanon: sourceCanon.trim(),
          }),
        }
      );

      const data: {
        universe?: Universe;
        error?: string;
      } = await response.json();

      if (!response.ok || !data.universe) {
        throw new Error(
          data.error || "Não foi possível criar o universo."
        );
      }

      setUniverses((current) => [...current, data.universe!]);
      setShowCreate(false);
      setNotice(
        `O universo "${data.universe.name}" foi criado com sucesso!`
      );
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Erro ao criar o universo."
      );
    } finally {
      setSaving(false);
    }
  }

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "13px 15px",
    borderRadius: 14,
    border: "1px solid var(--sr-border)",
    background: "var(--sr-surface)",
    color: "var(--sr-text)",
    fontSize: 16,
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontWeight: 600,
    fontSize: 14,
    marginBottom: 8,
  };

  return (
    <main
      className="sr-page"
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, var(--sr-primary-soft), var(--sr-background) 65%)",
        padding: "28px 16px 60px",
      }}
    >
      <div
        className="sr-container sr-animate-in"
        style={{ maxWidth: 820, margin: "0 auto" }}
      >
        <Link
          href="/profiles"
          className="sr-muted"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
            marginBottom: 32,
          }}
        >
          <ArrowLeft size={18} />
          Trocar de perfil
        </Link>

        <header
          style={{
            textAlign: "center",
            marginBottom: 34,
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              margin: "0 auto 16px",
              borderRadius: 22,
              background: "var(--sr-primary-soft)",
              color: "var(--sr-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <WandSparkles size={34} />
          </div>

          <div
            className="sr-badge"
            style={{ marginBottom: 14 }}
          >
            <Sparkles size={14} />
            Your worlds, your stories
          </div>

          <h1
            style={{
              fontSize: "clamp(29px, 6vw, 42px)",
              fontWeight: 800,
              letterSpacing: "-1px",
              marginBottom: 10,
            }}
          >
            Meus{" "}
            <span style={{ color: "var(--sr-primary)" }}>
              universos
            </span>
          </h1>

          <p className="sr-muted">
            {profile
              ? `As infinitas realidades de ${profile.name}. ♡`
              : "Todas as vidas que você ainda pode viver. ♡"}
          </p>
        </header>

        <section
          className="sr-card"
          style={{
            padding: "clamp(20px, 5vw, 34px)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 24,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 21,
                  marginBottom: 5,
                }}
              >
                Sua coleção de realidades
              </h2>

              <p
                className="sr-muted"
                style={{ fontSize: 13, margin: 0 }}
              >
                Um lugar especial para cada história.
              </p>
            </div>

            <span className="sr-badge">
              {universes.length}{" "}
              {universes.length === 1
                ? "universo"
                : "universos"}
            </span>
          </div>

          {loading ? (
            <div
              className="sr-flex-center"
              style={{ padding: 36, gap: 10 }}
            >
              <LoaderCircle
                size={22}
                color="var(--sr-primary)"
              />
              <span className="sr-muted">
                Carregando realidades...
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
                onClick={() => void loadUniverses()}
                style={{
                  padding: "9px 16px",
                  borderRadius: 12,
                  border: "1px solid #fca5a5",
                  background: "white",
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
                  "repeat(auto-fill, minmax(135px, 1fr))",
                gap: 16,
              }}
            >
              {universes.map((universe, index) => (
                <div
                  key={universe.id}
                  className="sr-card"
                  style={{
                    padding: 10,
                    borderRadius: 19,
                    border: "1px solid var(--sr-border)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: 132,
                      borderRadius: 14,
                      background:
                        cardColors[index % cardColors.length],
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 46,
                      marginBottom: 12,
                    }}
                  >
                    {cardSymbols[index % cardSymbols.length]}
                  </div>

                  <strong
                    style={{
                      display: "block",
                      fontSize: 14,
                      marginBottom: 5,
                      overflowWrap: "anywhere",
                    }}
                  >
                    {universe.name}
                  </strong>

                  {universe.sourceCanon && (
                    <p
                      className="sr-muted"
                      style={{
                        fontSize: 11,
                        marginBottom: 5,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {universe.sourceCanon}
                    </p>
                  )}

                  {universe.description && (
                    <p
                      className="sr-muted"
                      style={{
                        fontSize: 12,
                        marginBottom: 0,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {universe.description.length > 90
                        ? universe.description.slice(0, 90) + "..."
                        : universe.description}
                    </p>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={openCreate}
                className="sr-card-interactive"
                style={{
                  minHeight: 210,
                  border: "2px dashed var(--sr-border)",
                  borderRadius: 20,
                  background: "var(--sr-surface-secondary)",
                  color: "var(--sr-text)",
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 12,
                  textAlign: "center",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    background: "var(--sr-primary-soft)",
                    color: "var(--sr-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Plus size={25} />
                </div>

                <strong style={{ fontSize: 14 }}>
                  Nova realidade
                </strong>

                <span
                  className="sr-muted"
                  style={{ fontSize: 12 }}
                >
                  Comece uma nova história.
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
            textAlign: "center",
            borderRadius: 20,
            background: "var(--sr-primary-soft)",
          }}
        >
          <BookHeart
            size={25}
            color="var(--sr-primary)"
            style={{ marginBottom: 10 }}
          />

          <p
            style={{
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Cada universo é uma nova vida. ♡
          </p>

          <p
            className="sr-muted"
            style={{ fontSize: 13, marginBottom: 0 }}
          >
            Crie suas realidades favoritas e prepare-se
            para viver histórias inesquecíveis.
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
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-universe-title"
            className="sr-card sr-animate-in"
            style={{
              width: "100%",
              maxWidth: 460,
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 26,
            }}
          >
            <div
              className="sr-flex-between"
              style={{ marginBottom: 22 }}
            >
              <h2
                id="create-universe-title"
                style={{
                  fontSize: 23,
                  margin: 0,
                }}
              >
                Nova realidade 🪄
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

            <p
              className="sr-muted"
              style={{
                fontSize: 14,
                marginBottom: 24,
              }}
            >
              Dê os primeiros detalhes do mundo
              que você deseja viver.
            </p>

            <form onSubmit={createUniverse}>
              <label
                htmlFor="universe-name"
                style={labelStyle}
              >
                Nome do universo *
              </label>

              <input
                id="universe-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={200}
                required
                placeholder="Ex.: Minha vida em Hogwarts"
                style={{
                  ...fieldStyle,
                  marginBottom: 20,
                }}
              />

              <label
                htmlFor="universe-canon"
                style={labelStyle}
              >
                Universo de origem
              </label>

              <input
                id="universe-canon"
                value={sourceCanon}
                onChange={(event) =>
                  setSourceCanon(event.target.value)
                }
                maxLength={2000}
                placeholder="Ex.: Harry Potter, original..."
                style={{
                  ...fieldStyle,
                  marginBottom: 20,
                }}
              />

              <label
                htmlFor="universe-description"
                style={labelStyle}
              >
                Descrição da realidade
              </label>

              <textarea
                id="universe-description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                maxLength={5000}
                rows={4}
                placeholder="Conte um pouquinho sobre a realidade que você quer criar..."
                style={{
                  ...fieldStyle,
                  resize: "vertical",
                  marginBottom: 22,
                }}
              />

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
                disabled={saving || !name.trim()}
              >
                {saving ? (
                  <>
                    <LoaderCircle size={18} />
                    Criando realidade...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Criar meu universo
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
