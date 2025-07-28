import { supabase } from '../supabaseClient';

// --- TYPE DEFINITIONS / INTERFACES ---
// These define the "shape" of our data, giving us type safety and autocompletion.

export interface Goal {
  id: number;
  user_id: string;
  title: string;
  description?: string;
  created_at: string;
}

export interface Task {
  id: number;
  user_id: string;
  goal_id?: number;
  content: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Routine {
  id: number;
  user_id: string;
  name: string;
  time_of_day: 'morning' | 'evening';
  created_at: string;
}

export interface Habit {
  id: number;
  routine_id: number;
  user_id: string;
  name: string;
  created_at: string;
}

export interface HabitLog {
  id: number;
  habit_id: number;
  user_id: string;
  completed_at: string; // Stored as a 'YYYY-MM-DD' string
}

export interface JournalEntry {
  id: number;
  user_id: string;
  content: string;
  entry_date: string; // 'YYYY-MM-DD'
  created_at: string;
}

export interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  subscription_status: 'free' | 'pro';
  clarity_points: number;
}

export interface FocusSession {
  id: number;
  user_id: string;
  duration_minutes: number;
  session_type: 'pomodoro' | 'deep_work';
  task_id?: number;
  completed_at: string;
}

export interface DashboardStats {
    tasks_completed_today: number;
    tasks_pending: number;
    focus_time_today: number;
    focus_time_week: number;
    total_clarity_points: number;
    focus_last_7_days: { date: string; minutes: number }[];
}


// --- GOALS API ---

export const getGoals = async (): Promise<Goal[]> => { const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: false }); if (error) throw error; return data; };
export const addGoal = async (title: string, description?: string): Promise<Goal> => { const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error("User not authenticated"); const { data, error } = await supabase.from('goals').insert({ title, description, user_id: user.id }).select().single(); if (error) throw error; return data; };
export const updateGoal = async (id: number, title: string, description?: string): Promise<Goal> => { const { data, error } = await supabase.from('goals').update({ title, description }).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteGoal = async (id: number): Promise<void> => { const { error } = await supabase.from('goals').delete().eq('id', id); if (error) throw error; };

// --- TASKS API ---

export const getTasks = async (): Promise<Task[]> => { const { data, error } = await supabase.from('tasks').select('*').order('created_at'); if (error) throw error; return data; };
export const addTask = async (content: string, goal_id?: number): Promise<Task> => { const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error("User not authenticated"); const { data, error } = await supabase.from('tasks').insert({ content, goal_id, user_id: user.id }).select().single(); if (error) throw error; return data; };
export const updateTaskCompletion = async (id: number, is_completed: boolean): Promise<Task> => { const { data, error } = await supabase.from('tasks').update({ is_completed, updated_at: new Date().toISOString() }).eq('id', id).select().single(); if (error) throw error; return data; };
export const updateTaskContent = async (id: number, content: string): Promise<Task> => { const { data, error } = await supabase.from('tasks').update({ content }).eq('id', id).select().single(); if (error) throw error; return data; };
export const deleteTask = async (id: number): Promise<void> => { const { error } = await supabase.from('tasks').delete().eq('id', id); if (error) throw error; };

// --- ROUTINES & HABITS API ---

export const getRoutines = async (): Promise<Routine[]> => { const { data: { user } } = await supabase.auth.getUser(); if (!user) return []; const { data, error } = await supabase.from('routines').select('*').eq('user_id', user.id); if (error) throw error; return data; };
export const addRoutine = async (name: string, time_of_day: 'morning' | 'evening'): Promise<Routine> => { const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error("User not authenticated"); const { data, error } = await supabase.from('routines').insert({ name, time_of_day, user_id: user.id }).select().single(); if (error) throw error; return data; };
export const deleteRoutine = async (id: number): Promise<void> => { const { error } = await supabase.from('routines').delete().eq('id', id); if (error) throw error; };
export const getHabits = async (): Promise<Habit[]> => { const { data, error } = await supabase.from('habits').select('*'); if (error) throw error; return data; };
export const addHabit = async (name: string, routine_id: number): Promise<Habit> => { const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error("User not authenticated"); const { data, error } = await supabase.from('habits').insert({ name, routine_id, user_id: user.id }).select().single(); if (error) throw error; return data; };
export const deleteHabit = async (id: number): Promise<void> => { const { error } = await supabase.from('habits').delete().eq('id', id); if (error) throw error; };
export const getHabitLogs = async (): Promise<HabitLog[]> => { const { data, error } = await supabase.from('habit_logs').select('*'); if (error) throw error; return data; };
export const toggleHabitLogForToday = async (habit_id: number, isCompleted: boolean): Promise<HabitLog | null> => { const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error("User not authenticated"); const today = new Date().toISOString().split('T')[0]; if (isCompleted) { const { error } = await supabase.from('habit_logs').delete().match({ habit_id, user_id: user.id, completed_at: today }); if (error) throw error; return null; } else { const { data, error } = await supabase.from('habit_logs').insert({ habit_id, user_id: user.id, completed_at: today }).select().single(); if (error) throw error; return data; } };

// --- JOURNAL & PROFILE API ---

export const getJournalEntries = async (): Promise<JournalEntry[]> => { const { data, error } = await supabase.from('journal_entries').select('*').order('entry_date', { ascending: false }); if (error) throw error; return data; };
export const addJournalEntry = async (content: string, entry_date: string): Promise<JournalEntry> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
        .from('journal_entries')
        .insert({ content, entry_date, user_id: user.id })
        .select()
        .single();
    
    if (error) throw error; // This is what's throwing the error
    return data;
};
export const deleteJournalEntry = async (id: number): Promise<void> => { const { error } = await supabase.from('journal_entries').delete().eq('id', id); if (error) throw error; };
export const getProfile = async (): Promise<Profile | null> => { const { data: { user } } = await supabase.auth.getUser(); if (!user) return null; const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(); if (error) { console.error("Error fetching profile:", error); throw error; } return data; };
export const addClarityPoints = async (pointsToAdd: number): Promise<Profile> => { const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error("User not authenticated"); const { error } = await supabase.rpc('add_clarity_points', { user_id_input: user.id, points_to_add: pointsToAdd }); if (error) throw error; const updatedProfile = await getProfile(); if (!updatedProfile) throw new Error("Failed to refetch profile."); return updatedProfile; };

// --- FOCUS SESSIONS API ---

export const logFocusSession = async (duration: number, type: 'pomodoro' | 'deep_work', taskId?: number): Promise<FocusSession> => { const { data: { user } } = await supabase.auth.getUser(); if (!user) throw new Error("User not authenticated"); const { data, error } = await supabase.from('focus_sessions').insert({ user_id: user.id, duration_minutes: duration, session_type: type, task_id: taskId }).select().single(); if (error) throw error; return data; };

// --- DASHBOARD API ---

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const { data, error } = await supabase.rpc('get_dashboard_stats');
    if (error) {
        console.error("Error fetching dashboard stats:", error);
        throw error;
    }
    return data;
};