import { NextResponse } from "next/server";
import type Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getContaAtual } from "@/lib/conta";
import { interpretarMensagem } from "@/lib/claude";
import { registrarLancamentos } from "@/lib/ingestao";
import { interpretarSemIA } from "@/lib/interpretadorSimples";
import { transcreverAudio } from "@/lib/transcricao";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

async function arquivoParaBase64(arquivo: File) {
  const buffer = await arquivo.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

// Recebe uma mensagem da "secretária": texto simples (JSON) ou multipart/form-data
// com texto opcional + um arquivo (imagem, PDF ou áudio). Usa o Claude para
// extrair e categorizar os lançamentos descritos e grava tudo no Supabase.
export async function POST(request: Request) {
  const conta = await getContaAtual();
  if (!conta) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  let texto = "";
  let usouAudio = false;
  const content: Anthropic.MessageParam["content"] = [];

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    texto = typeof form.get("texto") === "string" ? String(form.get("texto")).trim() : "";
    const arquivo = form.get("arquivo");

    if (arquivo instanceof File && arquivo.size > 0) {
      if (IMAGE_TYPES.has(arquivo.type)) {
        content.push({
          type: "image",
          source: {
            type: "base64",
            media_type: arquivo.type as ImageMediaType,
            data: await arquivoParaBase64(arquivo),
          },
        });
      } else if (arquivo.type === "application/pdf") {
        content.push({
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: await arquivoParaBase64(arquivo),
          },
        });
      } else if (arquivo.type.startsWith("audio/")) {
        try {
          const transcrito = await transcreverAudio(arquivo);
          texto = [texto, transcrito].filter(Boolean).join("\n");
          usouAudio = true;
        } catch (err) {
          return NextResponse.json(
            { error: err instanceof Error ? err.message : "falha ao transcrever áudio" },
            { status: 502 }
          );
        }
      } else {
        return NextResponse.json(
          { error: `tipo de arquivo não suportado: ${arquivo.type}` },
          { status: 415 }
        );
      }
    }
  } else {
    const body = await request.json().catch(() => null);
    texto = typeof body?.texto === "string" ? body.texto.trim() : "";
  }

  if (texto) content.push({ type: "text", text: texto });

  if (content.length === 0) {
    return NextResponse.json(
      { error: "envie 'texto' e/ou um 'arquivo' (imagem, PDF ou áudio)" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const [{ data: pessoas }, { data: categorias }] = await Promise.all([
    supabase.from("pessoa").select("nome").eq("conta_id", conta.contaId),
    supabase.from("categoria").select("nome").eq("conta_id", conta.contaId),
  ]);

  // Sem chave do Claude: usa o interpretador gratuito, que só entende
  // lançamentos de dinheiro em texto (sem foto, PDF ou áudio).
  if (!process.env.ANTHROPIC_API_KEY) {
    if (content.some((c) => c.type !== "text")) {
      return NextResponse.json(
        { error: "Fotos, PDFs e áudios precisam da secretária com IA, que ainda não está ativada." },
        { status: 400 }
      );
    }
    const simples = interpretarSemIA(texto, categorias ?? []);
    if (simples.length === 0) {
      return NextResponse.json({
        lancamentos: [],
        resultados: [],
        aviso:
          'Por enquanto eu entendo gastos e entradas de dinheiro, como "gastei 30 de mercado" ou "recebi 2000 de salário".',
      });
    }
    const resultados = await registrarLancamentos(supabase, conta.contaId, "ia_texto", simples);
    return NextResponse.json({ lancamentos: simples, resultados });
  }

  let lancamentos;
  try {
    lancamentos = await interpretarMensagem(content, {
      pessoas: pessoas ?? [],
      categorias: categorias ?? [],
      dataAtual: new Date().toISOString().slice(0, 10),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "falha ao interpretar mensagem" },
      { status: 502 }
    );
  }

  if (lancamentos.length === 0) {
    return NextResponse.json({
      lancamentos: [],
      resultados: [],
      aviso: "Nenhum lançamento identificado nessa mensagem.",
    });
  }

  const origem = content.some((c) => c.type === "image")
    ? "ia_imagem"
    : content.some((c) => c.type === "document")
      ? "ia_documento"
      : usouAudio
        ? "ia_audio"
        : "ia_texto";

  const resultados = await registrarLancamentos(supabase, conta.contaId, origem, lancamentos);

  return NextResponse.json({ lancamentos, resultados });
}
