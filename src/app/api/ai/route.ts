import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

const SYSTEM_PROMPT = `You are SavingPlus AI, a helpful and friendly personal finance assistant. Your role is to:

1. Analyze the user's spending patterns and suggest ways to save money
2. Recommend cheaper alternatives for products and services
3. Provide budgeting tips and strategies
4. Help users understand their financial situation
5. Suggest actionable steps to reach savings goals

Keep responses concise, practical, and encouraging. Use specific dollar amounts when possible.
Do NOT provide investment advice or recommend specific financial products.
Format responses with clear bullet points or numbered lists when appropriate.`;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { message, context } = await request.json();

    // Build context about user's finances
    let financialContext = '';
    if (context) {
      financialContext = `\n\nUser's financial context:\n${JSON.stringify(context, null, 2)}`;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + financialContext },
        { role: 'user', content: message },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({ reply });
  } catch (error: unknown) {
    console.error('AI API error:', error);
    const message = error instanceof Error ? error.message : 'Failed to get AI response';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
