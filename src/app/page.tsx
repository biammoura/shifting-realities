
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  LoaderCircle,
  LockKeyhole,
  Plus,
  Sparkles,
  UserRound,
  UsersRound,
  WandSparkles,
  X,
} from "lucide-react";

type Profile = {
  id: string;
  name: string;
  avatarUrl: string | null;
  hasPin: boolean;
};

const avatarOptions = ["🌸", "🦋", "🎀", "✨", "🌷", "🩷", "🌙", "🪄"];

const avatarColors = [
  "#fce7f3",
  "#ede9fe",
  "#dbeafe",
  "#dcfce7",
  "#fef3c7",
  "#fce7e7",
];

function profileColor(index: number) {
  return avatarColors[index % avatarColors.length];
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🌸");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/profiles", {
        cache: "no-store",
      });

      const data: {
        profiles?: Profile[];
        error?: string;
      } = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao carregar perfis.");
      }

      setProfiles(data.profiles || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os perfis."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  function openCreate() {
    setName("");
    setAvatar("🌸");
    setError(null);
    setNotice(null);
    setShowCreate(true);
  }

  async function createProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanName = name.trim();

    if (!cleanName || cleanName.length > 100) {
      setError("Digite um nome com até 100 caracteres.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanName,
        }),
      });

      const data: {
        profile?: Profile;
        error?: string;
      } = await response.json();

      if (!response.ok || !data.profile) {
        throw new Error(data.error || "Erro ao criar perfil.");
      }

      setProfiles((current) => [...current, data.profile!]);
      setShowCreate(false);
      setNotice(
        `Perfil "${data.profile.name}" criado com sucesso!`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível criar o perfil."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      className="sr-page"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top, var(--sr-primary-soft), var(--sr-background) 65%)",
      }}
    >
      <div
        className="sr-container sr-animate-in"
        style={{
          maxWidth: 780,
          textAlign: "center",
          paddingTop: 40,
          paddingBottom: 40,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 76,
            height: 76,
            borderRadius: 24,
            background: "var(--sr-primary-soft)",
            color: "var(--sr-primary)",
            marginBottom: 22,
          }}
        >
          <WandSparkles size={38} strokeWidth={1.6} />
        </div>

        <div className="sr-badge" style={{ marginBottom: 16 }}>
          <Sparkles size={14} />
          Live a thousand lives
        </div>

        <h1
          style={{
            fontSize: "clamp(30px, 6vw, 46px)",
            fontWeight: 800,
            letterSpacing: "-1.5px",
            marginBottom: 8,
          }}
        >
          Shifting{" "}
          <span style={{ color: "var(--sr-primary)" }}>
            Realities
          </span>
        </h1>

        <p
          className="sr-muted"
          style={{ fontSize: 16, marginBottom: 40 }}
        >
          Um universo nunca é suficiente.
        </p>

        <section
          className="sr-card"
          style={{
            maxWidth: 660,
            margin: "0 auto",
            padding: "clamp(24px, 5vw, 42px)",
          }}
        >
          <div
            className="sr-flex-center"
            style={{ gap: 10, marginBottom: 12 }}
          >
            <UsersRound size={24} color="var(--sr-primary)" />
            <h2 style={{ fontSize: 24, margin: 0 }}>
              Quem vai viver uma nova realidade?
            </h2>
          </div>

          <p className="sr-muted" style={{ marginBottom: 30 }}>
            Escolha um perfil para continuar sua história.
          </p>

          {loading ? (
            <div
              className="sr-flex-center"
              style={{ gap: 10, padding: 35 }}
            >
              <LoaderCircle
                size={22}
                className="sr-spin"
                color="var(--sr-primary)"
              />
              <span className="sr-muted">Carregando perfis...</span>
            </div>
          ) : profiles.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 20,
                marginBottom: 28,
              }}
            >
              {profiles.map((profile, index) => (
                <button
                  key={profile.id}
                  type="button"
                  className="sr-card sr-card-interactive"
                  onClick={() =>
                    setNotice(
                      `O perfil "${profile.name}" está salvo! A entrada nos universos será ativada na próxima etapa.`
                    )
                  }
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                    padding: 16,
                    border: "1px solid var(--sr-border)",
                    background: "var(--sr-surface)",
                    color: "var(--sr-text)",
                  }}
                >
                  <div
                    className="sr-avatar sr-avatar-xl"
                    style={{
                      background: profileColor(index),
                      fontSize: 32,
                    }}
                  >
                    {avatarOptions[index % avatarOptions.length]}
                  </div>

                  <strong>{profile.name}</strong>

                  {profile.hasPin && (
                    <LockKeyhole
                      size={15}
                      color="var(--sr-text-muted)"
                    />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: "28px 16px",
                borderRadius: 20,
                background: "var(--sr-surface-secondary)",
                marginBottom: 24,
              }}
            >
              <div
                className="sr-flex-center"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  margin: "0 auto 14px",
                  background: "var(--sr-surface)",
                  color: "var(--sr-primary)",
                }}
              >
                <UserRound size={30} />
              </div>

              <h3 style={{ marginBottom: 6 }}>
                Sua história começa aqui
              </h3>

              <p
                className="sr-muted"
                style={{ fontSize: 14, marginBottom: 0 }}
              >
                Crie seu primeiro perfil e prepare-se
                para explorar infinitas realidades.
              </p>
            </div>
          )}

          <button
            type="button"
            className="sr-button sr-button-full"
            onClick={openCreate}
            disabled={loading || saving}
            style={{
              maxWidth: 340,
              margin: "0 auto",
            }}
          >
            <Plus size={19} />
            Criar meu perfil
            <ArrowRight size={17} />
          </button>

          <p
            className="sr-small sr-muted"
            style={{ marginTop: 18, marginBottom: 0 }}
          >
            Cada perfil terá seus próprios universos,
            personagens, histórias e configurações.
          </p>
        </section>

        {error && (
          <div
            role="alert"
            style={{
              marginTop: 20,
              padding: 16,
              borderRadius: 14,
              background: "#fee2e2",
              color: "#991b1b",
            }}
          >
            {error}
            <button
              type="button"
              onClick={() => void loadProfiles()}
              style={{
                marginLeft: 12,
                background: "transparent",
                border: 0,
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {notice && (
          <div
            role="status"
            style={{
              marginTop: 20,
              padding: 16,
              borderRadius: 14,
              background: "var(--sr-primary-soft)",
            }}
          >
            <Check size={16} style={{ display: "inline" }} />{" "}
            {notice}
          </div>
        )}

        <div
          style={{
            marginTop: 30,
            display: "flex",
            justifyContent: "center",
            gap: 18,
            flexWrap: "wrap",
          }}
        >
          <span className="sr-small sr-muted">
            <Sparkles size={13} style={{ display: "inline" }} />
            {" "}Universos ilimitados*
          </span>
          <span className="sr-small sr-muted">
            <LockKeyhole size={13} style={{ display: "inline" }} />
            {" "}PIN opcional
          </span>
        </div>

        {showWelcome && (
          <div
            style={{
              marginTop: 30,
              padding: 16,
              borderRadius: 16,
              background: "var(--sr-primary-soft)",
              color: "var(--sr-text)",
              fontSize: 13,
            }}
          >
            <div className="sr-flex-between">
              <span>
                <strong>Bem-vinda ao S.R.!</strong>{" "}
                Seu espaço de histórias está tomando forma.
              </span>
              <button
                type="button"
                className="sr-button-ghost"
                onClick={() => setShowWelcome(false)}
                aria-label="Fechar aviso"
                style={{
                  border: 0,
                  background: "transparent",
                  color: "var(--sr-text)",
                  padding: 6,
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        <p
          className="sr-small sr-muted"
          style={{ marginTop: 24, marginBottom: 0 }}
        >
          *A quantidade de universos dependerá da capacidade
          de armazenamento e dos limites dos serviços utilizados.
        </p>
      </div>

      {showCreate && (
        <div
          role="presentation"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(31, 20, 35, 0.55)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 18,
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-profile-title"
            className="sr-card sr-animate-in"
            style={{
              width: "100%",
              maxWidth: 440,
              padding: 28,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              className="sr-flex-between"
              style={{ marginBottom: 22 }}
            >
              <h2
                id="create-profile-title"
                style={{ fontSize: 23, margin: 0 }}
              >
                Criar meu perfil 🌸
              </h2>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                aria-label="Fechar"
                disabled={saving}
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

            <form onSubmit={createProfile}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 20,
                }}
              >
                <div
                  className="sr-avatar sr-avatar-xl"
                  style={{
                    background: "#fce7f3",
                    fontSize: 38,
                    width: 88,
                    height: 88,
                  }}
                >
                  {avatar}
                </div>
              </div>

              <p
                className="sr-muted"
                style={{
                  textAlign: "center",
                  fontSize: 13,
                  marginBottom: 12,
                }}
              >
                Escolha seu avatar
              </p>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 10,
                  marginBottom: 24,
                }}
              >
                {avatarOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setAvatar(option)}
                    aria-label={`Avatar ${option}`}
                    aria-pressed={avatar === option}
                    style={{
                      padding: 10,
                      fontSize: 25,
                      borderRadius: 14,
                      border:
                        avatar === option
                          ? "2px solid var(--sr-primary)"
                          : "1px solid var(--sr-border)",
                      background:
                        avatar === option
                          ? "var(--sr-primary-soft)"
                          : "var(--sr-surface)",
                      cursor: "pointer",
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>

              <label
                htmlFor="profile-name"
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                Nome do perfil
              </label>

              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                placeholder="Como você quer ser chamada?"
                autoComplete="off"
                required
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: "1px solid var(--sr-border)",
                  background: "var(--sr-surface)",
                  color: "var(--sr-text)",
                  fontSize: 16,
                  marginBottom: 22,
                  boxSizing: "border-box",
                }}
              />

              <button
                type="submit"
                className="sr-button sr-button-full"
                disabled={saving || !name.trim()}
              >
                {saving ? (
                  <>
                    <LoaderCircle size={18} />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Criar perfil
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
