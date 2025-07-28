import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Habit, HabitLog } from '../services/api';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Flame, Trash2, Pen } from 'lucide-react';

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDateString = () => new Date().toISOString().split('T')[0];

// Helper function to check if a habit was completed today
const isHabitCompletedToday = (habitId: number, logs: HabitLog[]): boolean => {
  const today = getTodayDateString();
  return logs.some(log => log.habit_id === habitId && log.completed_at === today);
};

// Helper function to calculate the current streak for a habit
const calculateStreak = (habitId: number, logs: HabitLog[]): number => {
    const today = new Date();
    // Filter logs for this habit, sort descending, and ensure unique dates
    const relevantLogs = Array.from(new Map(
      logs
        .filter(log => log.habit_id === habitId)
        .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
        .map(log => [log.completed_at, log])
    ).values());

    if (relevantLogs.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date(today);
    
    // Check if the streak is broken (more than 1 day since last completion)
    const mostRecentLogDate = new Date(relevantLogs[0].completed_at);
    const differenceInDays = Math.round((today.setHours(0,0,0,0) - mostRecentLogDate.setHours(0,0,0,0)) / (1000 * 3600 * 24));
    if (differenceInDays > 1) return 0;

    // Count backwards from today (or yesterday)
    for (const log of relevantLogs) {
        const expectedDateStr = currentDate.toISOString().split('T')[0];
        if (log.completed_at === expectedDateStr) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            // As soon as we find a gap, the consecutive streak is over
            break;
        }
    }
    return streak;
};


interface HabitTrackerProps {
  habits: Habit[];
  habitLogs: HabitLog[];
  onAddHabit: (name: string) => void;
  onToggleHabit: (habitId: number, isCompleted: boolean) => void;
  onDeleteHabit: (habitId: number) => void;
}

const habitFormSchema = z.object({
  name: z.string().min(1, { message: "Ritual cannot be empty." }),
});

const HabitTracker: React.FC<HabitTrackerProps> = ({ habits, habitLogs, onAddHabit, onToggleHabit, onDeleteHabit }) => {
  const form = useForm<z.infer<typeof habitFormSchema>>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: { name: "" },
  });

  const handleAddHabit = (values: z.infer<typeof habitFormSchema>) => {
    onAddHabit(values.name);
    form.reset();
  };

  return (
    <div className="space-y-3 font-serif">
      <TooltipProvider>
        {habits.length > 0 ? habits.map(habit => {
          const isCompleted = isHabitCompletedToday(habit.id, habitLogs);
          const streak = calculateStreak(habit.id, habitLogs);
          return (
            <div key={habit.id} className="flex items-center gap-3 rounded-md p-2 -ml-2 transition-colors hover:bg-primary/5">
              <Checkbox id={`habit-${habit.id}`} checked={isCompleted} onCheckedChange={() => onToggleHabit(habit.id, isCompleted)} />
              <label htmlFor={`habit-${habit.id}`} className="flex-1 text-base">{habit.name}</label>
              
              {streak > 0 && (
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center gap-1 text-accent font-sans text-sm font-semibold">
                      <Flame className="h-4 w-4" /> {streak}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent><p>Current Streak: {streak} days</p></TooltipContent>
                </Tooltip>
              )}
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Erase this ritual?</AlertDialogTitle><AlertDialogDescription>This will permanently remove this ritual from your tome.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDeleteHabit(habit.id)} className="bg-destructive hover:bg-destructive/90">Erase</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        }) : (
          <p className="text-base text-muted-foreground italic p-2">This tome is empty. Inscribe a new ritual below.</p>
        )}
      </TooltipProvider>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleAddHabit)} className="flex gap-2 pt-2 font-sans">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl><Input placeholder="Inscribe a new ritual..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="sm"><Pen className="mr-2 h-4 w-4" /> Inscribe</Button>
        </form>
      </Form>
    </div>
  );
};
export default HabitTracker;