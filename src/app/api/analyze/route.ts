import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: Request) {
  try {
    const { dataSummary } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY belum dikonfigurasi di environment." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "Kamu adalah analis data profesional yang bertugas membuat laporan eksekutif formal dalam Bahasa Indonesia yang baku. Berdasarkan ringkasan data yang diberikan, buat laporan dengan 3 bagian: (1) Ringkasan Utama, (2) Temuan dan Anomali, (3) Saran Tindakan. Gunakan bahasa yang tajam, berbobot, dan mudah dipahami oleh manajer atau pimpinan instansi. Jangan gunakan markdown, tulis dalam paragraf dan poin biasa."
    });

    const prompt = `Tolong buatkan laporan analisis dari ringkasan data berikut:\n\n${dataSummary}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ report: text });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message || "Gagal menghasilkan laporan AI." }, { status: 500 });
  }
}
