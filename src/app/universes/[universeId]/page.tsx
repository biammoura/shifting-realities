
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Heart,
  Home,
  MessageCircle,
  Plus,
  Sparkles,
  Users,
  WandSparkles,
} from "lucide-react";

export default function UniversePage() {
  const params = useParams<{ universeId: string }>();
  const universeId = params.universeId;

  const tabs = [
    { name: "Início", icon: Home },
    { name: "Mensagens", icon: MessageCircle },
    { name: "Criar", icon: Plus },
    { name: "Personagens", icon: Users },
    { name: "Notificações", icon: Bell },
  ];

  return (
    <main
      className="sr-page"
      style={{
        minHeight: "100vh",
        background: "var(--sr-background)",
        paddingBottom: 95,
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
          }}
        >
          <Link
            href="/profiles"
            style={{
              color: "var(--sr-text)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
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
            }}
          >
            Shifting Realities
          </strong>

          <WandSparkles
            size={23}
            color="var(--sr-primary)"
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
        <div
          className="sr-card"
          style={{
            padding: 28,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 76,
              height: 76,
              margin: "0 auto 18px",
              borderRadius: 25,
              background: "var(--sr-primary-soft)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles
              size={38}
              color="var(--sr-primary)"
            />
          </div>

          <h1
            style={{
              fontSize: 26,
              marginBottom: 10,
            }}
          >
            Sua nova realidade ♡
          </h1>

          <p
            className="sr-muted"
            style={{
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            Este será o espaço onde sua história
            acontecerá, com publicações, personagens,
            conversas e acontecimentos.
          </p>

          <span className="sr-badge">
            <Heart size={13} />
            Universo em construção
          </span>
        </div>

        <div
          className="sr-card"
          style={{
            padding: 22,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              marginBottom: 12,
            }}
          >
            ✨ Seu feed
          </h2>

          <p
            className="sr-muted"
            style={{
              fontSize: 14,
              marginBottom: 0,
            }}
          >
            Em breve, as publicações dos personagens
            e os acontecimentos do seu universo
            aparecerão aqui.
          </p>
        </div>
      </div>

      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          background: "var(--sr-surface)",
          borderTop: "1px solid var(--sr-border)",
          padding: "12px 8px max(12px, env(safe-area-inset-bottom))",
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

            return (
              <div
                key={tab.name}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 5,
                  color:
                    tab.name === "Início"
                      ? "var(--sr-primary)"
                      : "var(--sr-text-muted)",
                }}
              >
                <Icon size={22} />
                <span style={{ fontSize: 10 }}>
                  {tab.name}
                </span>
              </div>
            );
          })}
        </div>
      </nav>

      <p style={{ display: "none" }}>
        {universeId}
      </p>
    </main>
  );
}
