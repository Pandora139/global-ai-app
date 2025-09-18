import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { expertType, userQuestion, history } = body;

    const messages = [
      {
        role: 'system',
        content: `Eres un experto en ${expertType} en Colombia. Tu nombre es ADAPTA IA. Proporciona respuestas concisas, útiles y que ayuden al usuario. Mantén siempre tu rol como experto en ${expertType}. Responde de manera amigable y profesional.`,
      },
      ...history.map((msg: any) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.text,
      })),
      { role: 'user', content: userQuestion },
    ];

    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages as any,
    });

    const aiAnswer = chatCompletion.choices[0].message.content;

    return NextResponse.json({ answer: aiAnswer });
  } catch (error) {
    console.error('Error en la API de chat:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}