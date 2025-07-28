import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from "sonner";
import * as api from '../services/api';
import { supabase } from '../supabaseClient';
import HabitTracker from '../components/HabitTracker';
import { Tome } from '../components/Tome';

import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Trash2, Sparkles, Sunrise, Sunset } from 'lucide-react';

const RoutinesPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [generatingRoutineId, setGeneratingRoutineId] = useState<number | null>(null);
    const [routines, setRoutines] = useState<api.Routine[]>([]);
    const [habits, setHabits] = useState<api.Habit[]>([]);
    const [habitLogs, setHabitLogs] = useState<api.HabitLog[]>([]);
    const location = useLocation();

    // The single source of truth for fetching and setting all data for this page.
    const refreshData = useCallback(async () => {
        try {
            let routinesData = await api.getRoutines();
            let routinesWereCreated = false;
            if (!routinesData.find(r => r.time_of_day === 'morning')) {
                await api.addRoutine('The Morning Ritual', 'morning');
                routinesWereCreated = true;
            }
            if (!routinesData.find(r => r.time_of_day === 'evening')) {
                await api.addRoutine('The Evening Ritual', 'evening');
                routinesWereCreated = true;
            }
            if (routinesWereCreated) {
                routinesData = await api.getRoutines();
            }
            
            const [habitsData, logsData] = await Promise.all([
                api.getHabits(), api.getHabitLogs(),
            ]);

            setRoutines(routinesData);
            setHabits(habitsData);
            setHabitLogs(logsData);
        } catch (error) { 
            toast.error("Failed to conjure the ritual tomes."); 
        }
    }, []);

    // This effect runs on initial load and whenever the user navigates to this page.
    useEffect(() => { 
        setLoading(true);
        refreshData().finally(() => setLoading(false));
    }, [refreshData, location.pathname]); 

    // --- Data Mutation Handlers ---

    const handleGenerateHabits = async (routine: api.Routine) => {
        setGeneratingRoutineId(routine.id);

        const promise = supabase.functions.invoke('generate-routine', { body: { timeOfDay: routine.time_of_day } })
            .then(async ({ error, data }) => {
                if (error) throw error;
                await refreshData(); // Re-fetch only on success
                return data;
            });

        toast.promise(promise, {
            loading: 'Consulting the ether for new rituals...',
            success: (data: any) => data.message || 'The ether has whispered new rituals!',
            error: (err) => err.message || 'The divination failed.',
        });

        // Use the promise's own finally, not the toast's
        promise.finally(() => setGeneratingRoutineId(null));
    };
    
    const handleAddHabit = async (name: string, routine_id: number) => {
        toast.promise(
            api.addHabit(name, routine_id).then(() => refreshData()),
            {
                loading: 'Inscribing ritual...',
                success: 'Ritual inscribed!',
                error: 'Failed to inscribe ritual.',
            }
        );
    };

    const handleToggleHabit = async (habitId: number, isCompleted: boolean) => {
        try {
            await api.toggleHabitLogForToday(habitId, isCompleted);
            const logsData = await api.getHabitLogs();
            setHabitLogs(logsData);
        } catch (error) { 
            toast.error("Failed to perform the ritual."); 
        }
    };

    const handleDeleteHabit = async (habitId: number) => {
        toast.promise(
            api.deleteHabit(habitId).then(() => refreshData()),
            {
                loading: 'Erasing ritual...',
                success: 'A ritual was erased.',
                error: 'Failed to erase the ritual.',
            }
        );
    };

    const handleDeleteRoutine = async (routineId: number) => {
        toast.promise(
            api.deleteRoutine(routineId).then(() => refreshData()),
            {
                loading: 'Clearing the tome...',
                success: 'The tome has been cleared!',
                error: 'Failed to clear the tome.',
            }
        );
    };

    // --- Render Logic ---

    if (loading) { 
        return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>; 
    }
    
    const morningRoutine = routines.find(r => r.time_of_day === 'morning');
    const eveningRoutine = routines.find(r => r.time_of_day === 'evening');

    if (!morningRoutine || !eveningRoutine) { 
        return <div className="text-center text-muted-foreground">The ancient tomes could not be found. Please try refreshing the page.</div>; 
    }

    const renderRoutineCard = (routine: api.Routine, delay: string) => (
        <div className="animate-slide-up-fade" style={{ animationDelay: delay }}>
            <Tome 
                title={routine.name} 
                icon={routine.time_of_day === 'morning' ? <Sunrise className="h-8 w-8" /> : <Sunset className="h-8 w-8" />}
            >
                <HabitTracker 
                    habits={habits.filter(h => h.routine_id === routine.id)}
                    habitLogs={habitLogs}
                    onAddHabit={(name) => handleAddHabit(name, routine.id)}
                    onToggleHabit={handleToggleHabit}
                    onDeleteHabit={handleDeleteHabit}
                />
            </Tome>
            <div className="flex justify-between mt-4 px-2">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4"/> Clear Tome
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Clear this tome?</AlertDialogTitle>
                            <AlertDialogDescription>This will erase all inscribed rituals from your {routine.time_of_day} tome.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteRoutine(routine.id)} className="bg-destructive hover:bg-destructive/90">Clear All</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleGenerateHabits(routine)} 
                    disabled={!!generatingRoutineId}
                >
                    {generatingRoutineId === routine.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Sparkles className="mr-2 h-4 w-4" /> Divine Rituals
                </Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="text-center">
                <h2 className="text-3xl font-display font-bold tracking-tight">The Daily Rituals</h2>
                <p className="text-muted-foreground">Forge consistency through daily practice and incantation.</p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2">
                {morningRoutine && renderRoutineCard(morningRoutine, "0s")}
                {eveningRoutine && renderRoutineCard(eveningRoutine, "0.2s")}
            </div>
        </div>
    );
};

export default RoutinesPage;