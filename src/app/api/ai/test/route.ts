
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
        error: "GEMINI_API_KEY não está configurada.",
      },
      { status: 500 }
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents:
        "Responda em português, com apenas uma frase curta, confirmando que a inteligência artificial do aplicativo Shifting Realities está funcionando.",
    });

    return NextResponse.json({
      success: true,
      message:
        response.text ||
        "O Gemini respondeu, mas não retornou texto.",
    });
  } catch (error) {
    console.error("Erro ao testar Gemini:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          "Não foi possível conectar ao Gemini. Verifique a chave, o modelo e os limites de uso.",
      },
      { status: 500 }
    );
  }
}
