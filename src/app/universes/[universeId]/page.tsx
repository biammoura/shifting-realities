
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  BookHeart,
  Heart,
  Home,
  LoaderCircle,
  MessageCircle,
  Plus,
  RefreshCw,
  Sparkles,
  Users,
  WandSparkles,
} from "lucide-react";

type Universe = {
  id: string;
  profileId: string;
  name: string;
  description: string | null;
  sourceCanon: string | null;
  narrativeTime: string;
  createdAt: string;
};

type Profile = {
  id: string;
  name: string;
};

type UniverseResponse = {
  universe?: Universe;
  profile?: Profile;
  error?: string;
};

const tabs = [
  { name: "Início", icon: Home },
  { name: "Mensagens", icon: MessageCircle },
  { name: "Criar", icon: Plus },
  { name: "Personagens", icon: Users },
  { name: "Notificações", icon: Bell },
];

export default function UniversePage() {
  const params = useParams<{ universeId: string }>();
  const universeId = params.universeId;

  const [universe, setUniverse] = useState<Universe | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUniverse = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/universes/${encodeURIComponent(universeId)}`,
        { cache: "no-store" }
      );

      const data: UniverseResponse = await response.json();

      if (!response.ok || !data.universe || !data.profile) {
        throw new Error(
          data.error || "Não foi possível carregar este universo."
        );
      }

      setUniverse(data.universe);
      setProfile(data.profile);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar este universo."
      );
    } finally {
      setLoading(false);
    }
  }, [universeId]);

  useEffect(() => {
    void loadUniverse();
  }, [loadUniverse]);

  const backHref = universe
    ? `/profiles/${universe.profileId}/universes`
    : "/profiles";

  return (
    <main
      className="sr-page"
      style={{
        minHeight: "100vh",
        background: "var(--sr-background)",
        paddingBottom: 100,
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "var(--sr-surface)",
          borderBottom: "1px solid var(--sr-border)",
          padding: "16px 20px",
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
            gap: 10,
          }}
        >
          <Link
            href={backHref}
            style={{
              color: "var(--sr-text)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={20} />
            <span style={{ fontSize: 13 }}>
              Voltar
            </span>
          </Link>

          <strong
            style={{
              fontSize: 18,
              color: "var(--sr-primary)",
              textAlign: "center",
            }}
          >
            Shifting Realities
          </strong>

          <WandSparkles
            size={23}
            color="var(--sr-primary)"
            style={{ flexShrink: 0 }}
          />
        </div>
      </header>

      <div
        className="sr-container sr-animate-in"
        style={{
          maxWidth: 650,
          margin: "0 auto",
          paddingTop: 30,
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
              style={{ marginBottom: 16 }}
            />
            <p className="sr-muted">
              Abrindo sua realidade...
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
                fontSize: 22,
                marginBottom: 12,
              }}
            >
              Não conseguimos abrir este universo
            </h1>

            <p
              className="sr-muted"
              style={{ marginBottom: 22 }}
            >
              {error}
            </p>

            <button
              type="button"
              className="sr-button"
              onClick={() => void loadUniverse()}
            >
              <RefreshCw size={17} />
              Tentar novamente
            </button>
          </div>
        ) : universe ? (
          <>
            <section
              className="sr-card"
              style={{
                padding: "30px 24px",
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  margin: "0 auto 18px",
                  borderRadius: 25,
                  background: "var(--sr-primary-soft)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles
                  size={39}
                  color="var(--sr-primary)"
                />
              </div>

              <div
                className="sr-badge"
                style={{ marginBottom: 16 }}
              >
                <Heart size={13} />
                Sua realidade
              </div>

              <h1
                style={{
                  fontSize: "clamp(24px, 6vw, 32px)",
                  fontWeight: 800,
                  letterSpacing: "-0.7px",
                  marginBottom: 12,
                  overflowWrap: "anywhere",
                }}
              >
                {universe.name} ♡
              </h1>

              {universe.sourceCanon && (
                <p
                  style={{
                    color: "var(--sr-primary)",
                    fontSize: 14,
                    fontWeight: 600,
                    marginBottom: 14,
                  }}
                >
                  🪄 {universe.sourceCanon}
                </p>
              )}

              <p
                className="sr-muted"
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  marginBottom: 20,
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                }}
              >
                {universe.description ||
                  "Sua história está apenas começando. Um mundo inteiro de possibilidades espera por você."}
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <span className="sr-badge">
                  <BookHeart size={13} />
                  {profile?.name || "Meu perfil"}
                </span>

                <span className="sr-badge">
                  <Sparkles size={13} />
                  Universo em construção
                </span>
              </div>
            </section>

            <section
              className="sr-card"
              style={{
                padding: 22,
                marginBottom: 20,
              }}
            >
              <h2
                style={{
                  fontSize: 19,
                  marginBottom: 12,
                }}
              >
                ✨ Seu feed
              </h2>

              <p
                className="sr-muted"
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  marginBottom: 0,
                }}
              >
                Aqui aparecerão as publicações,
                interações e acontecimentos da sua
                realidade. Em breve, seus personagens
                poderão compartilhar suas próprias
                histórias.
              </p>
            </section>

            <div
              style={{
                textAlign: "center",
                padding: 20,
                borderRadius: 20,
                background: "var(--sr-primary-soft)",
              }}
            >
              <p
                style={{
                  fontWeight: 600,
                  marginBottom: 5,
                }}
              >
                Your world, your rules. ♡
              </p>

              <p
                className="sr-muted"
                style={{
                  fontSize: 12,
                  marginBottom: 0,
                }}
              >
                Cada detalhe desta realidade será
                construído por você.
              </p>
            </div>
          </>
        ) : null}
      </div>

      {!loading && !error && universe && (
        <nav
          aria-label="Navegação do universo"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 30,
            background: "var(--sr-surface)",
            borderTop: "1px solid var(--sr-border)",
            padding:
              "12px 8px max(12px, env(safe-area-inset-bottom))",
          }}
        >
          <div
            style={{
              maxWidth: 650,
              margin: "0 auto",
              display: "flex",
              justifyContent: "space-around",
            }}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;

              const href =
                tab.name === "Personagens"
                  ? `/universes/${universeId}/characters`
                  : tab.name === "Início"
                    ? `/universes/${universeId}`
                    : null;

              const content = (
                <>
                  <Icon size={22} />
                  <span style={{ fontSize: 10 }}>
                    {tab.name}
                  </span>
                </>
              );

              const itemStyle: React.CSSProperties = {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                color:
                  tab.name === "Início"
                    ? "var(--sr-primary)"
                    : "var(--sr-text-muted)",
                textDecoration: "none",
                minWidth: 54,
                minHeight: 43,
              };

              return href ? (
                <Link
                  key={tab.name}
                  href={href}
                  style={itemStyle}
                  aria-label={tab.name}
                >
                  {content}
                </Link>
              ) : (
                <span
                  key={tab.name}
                  style={itemStyle}
                  aria-label={`${tab.name} em desenvolvimento`}
                >
                  {content}
                </span>
              );
            })}
          </div>
        </nav>
      )}
    </main>
  );
}
