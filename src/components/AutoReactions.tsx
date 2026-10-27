
"use client";

import { useEffect, useRef } from "react";

type AutoReactionsProps = {
  universeId: string;
  postId: string;
  enabled: boolean;
  onComplete?: () => void | Promise<void>;
};

const processedPosts = new Set<string>();

export default function AutoReactions({
  universeId,
  postId,
  enabled,
  onComplete,
}: AutoReactionsProps) {
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!enabled || !universeId || !postId) {
      return;
    }

    const key = `${universeId}:${postId}`;

    if (processedPosts.has(key)) {
      return;
    }

    // Impede uma nova tentativa do mesmo post
    // durante esta sessão da aba.
    const storageKey = `sr:auto-reactions:${key}`;

    try {
      if (sessionStorage.getItem(storageKey)) {
        return;
      }

      sessionStorage.setItem(storageKey, "started");
    } catch {
      // A proteção em memória continua ativa.
    }

    processedPosts.add(key);

    let active = true;

    async function run() {
      try {
        const response = await fetch(
          `/api/universes/${universeId}/posts/${postId}/ai-react`,
          {
            method: "POST",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          console.error(
            "Falha nas reações automáticas:",
            response.status
          );
          return;
        }

        if (active) {
          await onCompleteRef.current?.();
        }
      } catch (error) {
        console.error(
          "Erro nas reações automáticas:",
          error
        );
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, [enabled, universeId, postId]);

  return null;
}
