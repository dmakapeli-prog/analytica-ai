import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(req: Request) {
  try {
    const { dataSummary } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY belum dikonfigurasi di environment." }, { status: 500 });
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const systemPrompt = "Kamu adalah analis data profesional yang bertugas membuat laporan eksekutif formal dalam Bahasa Indonesia yang baku. Berdasarkan ringkasan data yang diberikan, buat laporan dengan 3 bagian: (1) Ringkasan Utama, (2) Temuan dan Anomali, (3) Saran Tindakan. Gunakan bahasa yang tajam, berbobot, dan mudah dipahami oleh manajer atau pimpinan instansi. Jangan gunakan markdown, tulis dalam paragraf dan poin biasa.";

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2500,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Tolong buatkan laporan analisis dari ringkasan data berikut:\n\n${dataSummary}`
        }
      ]
    });

    const responseContent = message.content.find(c => c.type === 'text');
    const text = responseContent && 'text' in responseContent ? responseContent.text : "Tidak ada respons teks dari AI.";

    return NextResponse.json({ report: text });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message || "Gagal menghasilkan laporan AI." }, { status: 500 });
  }
}
