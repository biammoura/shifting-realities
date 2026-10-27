
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        error: "GEMINI_API_KEY não configurada.",
      },
      { status: 500 }
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents:
        "Você está testando a conexão de um aplicativo de RPG chamado Shifting Realities. Responda somente: Conexão com Shifting Realities funcionando!",
    });

    return NextResponse.json({
      success: true,
      model: "gemini-3.5-flash-lite",
      message: response.text || "Resposta sem texto.",
    });
  } catch (error) {
    console.error("Erro ao testar Gemini:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          "O Gemini não conseguiu responder. Consulte os logs da Vercel.",
      },
      { status: 500 }
    );
  }
}
