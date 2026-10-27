
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BookHeart,
  Plus,
  Sparkles,
  WandSparkles,
} from "lucide-react";

export default function UniversesPage() {
  const params = useParams<{ profileId: string }>();
  const profileId = params.profileId;

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
            marginBottom: 36,
          }}
        >
          <ArrowLeft size={18} />
          Trocar de perfil
        </Link>

        <header
          style={{
            textAlign: "center",
            marginBottom: 36,
          }}
        >
          <div
            style={{
              width: 66,
              height: 66,
              margin: "0 auto 16px",
              borderRadius: 22,
              background: "var(--sr-primary-soft)",
              color: "var(--sr-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <WandSparkles size={32} />
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
              fontSize: "clamp(28px, 5vw, 40px)",
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
            Todas as vidas que você ainda pode viver. ♡
          </p>
        </header>

        <section
          className="sr-card"
          style={{
            padding: "clamp(22px, 5vw, 36px)",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 24,
            }}
          >
            <div>
              <h2 style={{ fontSize: 21, marginBottom: 5 }}>
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
              0 universos
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(135px, 1fr))",
              gap: 16,
            }}
          >
            <div
              style={{
                minHeight: 210,
                border: "2px dashed var(--sr-border)",
                borderRadius: 20,
                background: "var(--sr-surface-secondary)",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 12,
                textAlign: "center",
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
                Em breve você poderá criar seu universo aqui.
              </span>
            </div>
          </div>
        </section>

        <div
          style={{
            textAlign: "center",
            padding: 24,
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
            Sua próxima história está esperando por você.
          </p>

          <p
            className="sr-muted"
            style={{ fontSize: 13, marginBottom: 0 }}
          >
            Estamos preparando a criação de universos
            personalizados para este perfil.
          </p>
        </div>

        <p
          className="sr-small sr-muted"
          style={{
            textAlign: "center",
            marginTop: 24,
          }}
        >
          Perfil selecionado: {profileId}
        </p>
      </div>
    </main>
  );
}
