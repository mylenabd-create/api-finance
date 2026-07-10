// Transcrição de áudio antes de mandar o texto pro pipeline do Claude
// (Claude não processa áudio nativamente). Usa a API Whisper da OpenAI —
// se você preferir outro provedor de transcrição, troque a implementação
// desta função; o resto do pipeline não muda.
export async function transcreverAudio(arquivo: File): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY não configurada. Adicione a chave em .env.local para habilitar envio de áudio (veja .env.local.example)."
    );
  }

  const form = new FormData();
  form.append("file", arquivo);
  form.append("model", "whisper-1");
  form.append("language", "pt");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });

  if (!response.ok) {
    const detalhe = await response.text().catch(() => "");
    throw new Error(`falha ao transcrever áudio (${response.status}): ${detalhe}`);
  }

  const data = (await response.json()) as { text: string };
  return data.text;
}
