
"use client";

import { useState } from "react";
import {
  ArrowRight,
  LockKeyhole,
  Plus,
  Sparkles,
  UserRound,
  UsersRound,
  WandSparkles,
} from "lucide-react";

type Profile = {
  id: string;
  name: string;
  avatar: string;
  color: string;
  hasPin: boolean;
};

export default function ProfilesPage() {
  const [profiles] = useState<Profile[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);

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

        <div
          className="sr-badge"
          style={{ marginBottom: 16 }}
        >
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
          style={{
            fontSize: 16,
            marginBottom: 40,
          }}
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
            <UsersRound
              size={24}
              color="var(--sr-primary)"
            />
            <h2
              style={{
                fontSize: 24,
                margin: 0,
              }}
            >
              Quem vai viver uma nova realidade?
            </h2>
          </div>

          <p
            className="sr-muted"
            style={{ marginBottom: 30 }}
          >
            Escolha um perfil para continuar sua história.
          </p>

          {profiles.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 20,
                marginBottom: 28,
              }}
            >
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  className="sr-card sr-card-interactive"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                  }}
                  disabled
                  title="A seleção será ativada com o sistema de perfis."
                >
                  <div
                    className="sr-avatar sr-avatar-xl"
                    style={{
                      background: profile.color,
                      fontSize: 32,
                    }}
                  >
                    {profile.avatar}
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
                style={{
                  fontSize: 14,
                  marginBottom: 0,
                }}
              >
                Crie seu primeiro perfil e prepare-se
                para explorar infinitas realidades.
              </p>
            </div>
          )}

          <button
            type="button"
            className="sr-button sr-button-full"
            disabled
            title="A criação de perfis será ativada após a integração com o banco de dados."
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
            style={{
              marginTop: 18,
              marginBottom: 0,
            }}
          >
            Cada perfil terá seus próprios universos,
            personagens, histórias e configurações.
          </p>
        </section>

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
                Estamos preparando seu espaço de histórias.
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
          style={{
            marginTop: 24,
            marginBottom: 0,
          }}
        >
          *A quantidade de universos dependerá da capacidade
          de armazenamento e dos limites dos serviços utilizados.
        </p>
      </div>
    </main>
  );
}
