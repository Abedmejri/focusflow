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
    const { timeOfDay } = await req.json();
    if (!['morning', 'evening'].includes(timeOfDay)) {
        throw new Error("Invalid timeOfDay provided. Must be 'morning' or 'evening'.");
    }
    
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("User not authenticated");
    
    let routineId;
    let { data: existingRoutine } = await supabaseClient
      .from('routines')
      .select('id')
      .eq('user_id', user.id)
      .eq('time_of_day', timeOfDay)
      .single();

    if (existingRoutine) {
      routineId = existingRoutine.id;
    } else {
      const routineName = timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1) + ' Routine';
      const { data: newRoutine, error: createError } = await supabaseClient
        .from('routines')
        .insert({ name: routineName, time_of_day: timeOfDay, user_id: user.id })
        .select('id')
        .single();
      if (createError) throw createError;
      routineId = newRoutine.id;
    }

    const { data: goals } = await supabaseClient.from('goals').select('title').limit(5);
    const goalsContext = goals?.map(g => `- ${g.title}`).join('\n') || 'General well-being and productivity.';

    const systemPrompt = `You are a helpful routine-building assistant. Generate 3 to 5 concise, actionable habits. IMPORTANT: You must respond with only a valid JSON object with a single key "habits" which is an array of strings. Example: {"habits": ["Meditate for 5 minutes", "Drink a glass of water"]}`;
    const userPrompt = `A user wants to build a ${timeOfDay} routine. Their goals are:\n${goalsContext}\n\nPlease generate suitable habits for them.`;

    const completion = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [{ "role": "system", "content": systemPrompt }, { "role": "user", "content": userPrompt }],
      response_format: { "type": "json_object" },
    });
    
    const aiResponseText = completion.choices[0]?.message?.content;
    if (!aiResponseText) throw new Error("AI returned an empty response.");
    
    const parsedResponse = JSON.parse(aiResponseText);
    const habitsToInsert = parsedResponse.habits;

    if (!Array.isArray(habitsToInsert) || habitsToInsert.length === 0) {
      throw new Error("Could not extract habits from the AI response.");
    }
    
    const habitsForDb = habitsToInsert.map((habitName: any) => ({
        name: String(habitName),
        routine_id: routineId,
        user_id: user.id,
    }));

    const { error: insertError } = await supabaseClient.from('habits').insert(habitsForDb);
    if (insertError) throw insertError;

    return new Response(JSON.stringify({ message: `I've added new suggestions to your ${timeOfDay} routine!` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("--- CRITICAL ERROR in generate-routine function ---", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});