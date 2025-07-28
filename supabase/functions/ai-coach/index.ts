import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { OpenAI } from 'https://esm.sh/openai@4.29.2';
import { corsHeaders } from '../_shared/cors.ts';

const groq = new OpenAI({
  apiKey: Deno.env.get('GROQ_API_KEY'),
  baseURL: 'https://api.groq.com/openai/v1',
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();

    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    const { data: goals } = await supabaseClient.from('goals').select('title, description');
    const { data: tasks } = await supabaseClient.from('tasks').select('content').eq('is_completed', false).limit(10);

    const goalsContext = goals?.map(g => `- ${g.title}: ${g.description}`).join('\n') || 'No goals set yet.';
    const tasksContext = tasks?.map(t => `- [ ] ${t.content}`).join('\n') || 'No pending tasks.';

    const systemPrompt = `You are FocusFlow, a motivating and insightful AI clarity coach. Your tone is encouraging, positive, and action-oriented. You help users escape distraction and focus on what truly matters. Keep your responses structured using markdown.`;
    const userContextPrompt = `Here is the user's current situation:\n\nTheir Long-Term Goals:\n${goalsContext}\n\nTheir Pending Tasks:\n${tasksContext}\n\nThe user's request is: "${prompt}"`;

    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        { "role": "system", "content": systemPrompt },
        { "role": "user", "content": userContextPrompt }
      ],
      max_tokens: 350,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0]?.message?.content;

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("--- CRITICAL ERROR in ai-coach function ---", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});