import React, { useState, useEffect, useRef } from 'react';
import { toast } from "sonner";
import * as api from '../services/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Flag, Play, Pause, RotateCcw, Settings, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

type TimerMode = 'pomodoro' | 'short_break' | 'long_break';

const settingsSchema = z.object({
  pomodoro: z.coerce.number().min(1, "Must be at least 1 minute.").max(120),
  shortBreak: z.coerce.number().min(1, "Must be at least 1 minute.").max(30),
  longBreak: z.coerce.number().min(1, "Must be at least 1 minute.").max(60),
});

const FocusTimer: React.FC<{ tasks: api.Task[] }> = ({ tasks }) => {
    const [settings, setSettings] = useState(() => {
        const saved = {
            pomodoro: localStorage.getItem('pomodoroDuration'),
            shortBreak: localStorage.getItem('shortBreakDuration'),
            longBreak: localStorage.getItem('longBreakDuration'),
        };
        return {
            pomodoro: saved.pomodoro ? parseInt(saved.pomodoro, 10) : 25,
            shortBreak: saved.shortBreak ? parseInt(saved.shortBreak, 10) : 5,
            longBreak: saved.longBreak ? parseInt(saved.longBreak, 10) : 15,
        };
    });
    
    const [mode, setMode] = useState<TimerMode>('pomodoro');
    const [time, setTime] = useState(settings.pomodoro * 60);
    const [isActive, setIsActive] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(undefined);
    const [pomodoroCount, setPomodoroCount] = useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const [isMuted, setIsMuted] = useState(true);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const notificationRef = useRef<HTMLAudioElement | null>(null);
    
    const settingsForm = useForm<z.infer<typeof settingsSchema>>({
        resolver: zodResolver(settingsSchema),
        defaultValues: settings,
    });

    const switchMode = (newMode: TimerMode) => {
        setIsActive(false);
        setMode(newMode);
        let newTime;
        if (newMode === 'pomodoro') newTime = settings.pomodoro * 60;
        else if (newMode === 'short_break') newTime = settings.shortBreak * 60;
        else newTime = settings.longBreak * 60;
        setTime(newTime);
    };

    useEffect(() => {
        if (!isActive) {
            switchMode(mode);
        }
    }, [settings]);

    useEffect(() => {
        if (isActive && time > 0) {
            intervalRef.current = setInterval(() => setTime(t => t - 1), 1000);
        } else if (time === 0 && isActive) {
            if (notificationRef.current) {
                notificationRef.current.play().catch(e => console.error("Notification sound error:", e));
            }
            setIsActive(false);
            if (mode === 'pomodoro') {
                const taskId = selectedTaskId ? parseInt(selectedTaskId, 10) : undefined;
                api.logFocusSession(settings.pomodoro, 'pomodoro', taskId)
                   .then(() => toast.success('Pomodoro session logged! Time for a break.'))
                   .catch(() => toast.error('Failed to log session.'));
                const newCount = pomodoroCount + 1;
                setPomodoroCount(newCount);
                switchMode(newCount % 4 === 0 ? 'long_break' : 'short_break');
            } else {
                toast.info("Break's over! Ready for another focus session?");
                switchMode('pomodoro');
            }
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isActive, time]);
    
    const onSaveSettings = (values: z.infer<typeof settingsSchema>) => {
        localStorage.setItem('pomodoroDuration', String(values.pomodoro));
        localStorage.setItem('shortBreakDuration', String(values.shortBreak));
        localStorage.setItem('longBreakDuration', String(values.longBreak));
        setSettings(values);
        toast.success('Timer settings saved!');
        setIsSettingsOpen(false);
    };

    useEffect(() => {
        audioRef.current = new Audio('/ambient-focus.mp3');
        audioRef.current.loop = true;
        notificationRef.current = new Audio('/notification.mp3');
    }, []);

    useEffect(() => {
        // Play ambient sound only when the popover is open, the timer is active, and not muted
        if (isActive && !isMuted && isPopoverOpen) {
            audioRef.current?.play().catch(e => console.error("Audio play error:", e));
        } else {
            audioRef.current?.pause();
        }
        // Cleanup function to pause sound when component unmounts
        return () => { audioRef.current?.pause(); };
    }, [isActive, isMuted, isPopoverOpen]);

    const totalDuration = mode === 'pomodoro' ? settings.pomodoro * 60 : mode === 'short_break' ? settings.shortBreak * 60 : settings.longBreak * 60;
    const progress = totalDuration > 0 ? ((totalDuration - time) / totalDuration) * 100 : 0;
    const minutes = String(Math.floor(time / 60)).padStart(2, '0');
    const seconds = String(time % 60).padStart(2, '0');
    const pendingTasks = tasks.filter(task => !task.is_completed);

    return (
        <>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" className={cn(isActive && "animate-pulse border-primary text-primary ring-2 ring-primary/50")}>
                        <Flag className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-background/80 backdrop-blur-lg" align="end">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h4 className="font-display text-lg font-bold">
                                {mode === 'pomodoro' ? 'Focus Altar' : 'Respite'}
                            </h4>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { settingsForm.reset(settings); setIsSettingsOpen(true); }}>
                                <Settings className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        <div className="relative my-4 flex items-center justify-center">
                            <div className="h-48 w-48">
                                <CircularProgressbar
                                    value={progress}
                                    text={`${minutes}:${seconds}`}
                                    strokeWidth={5}
                                    styles={buildStyles({
                                        textColor: 'hsl(var(--foreground))',
                                        pathColor: 'hsl(var(--primary))',
                                        trailColor: 'hsl(var(--muted))',
                                        textSize: '22px',
                                        pathTransitionDuration: 0.5,
                                    })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-1 rounded-md bg-muted p-1">
                            <Button size="sm" variant={mode === 'pomodoro' ? 'secondary' : 'ghost'} onClick={() => switchMode('pomodoro')}>Focus</Button>
                            <Button size="sm" variant={mode === 'short_break' ? 'secondary' : 'ghost'} onClick={() => switchMode('short_break')}>Short</Button>
                            <Button size="sm" variant={mode === 'long_break' ? 'secondary' : 'ghost'} onClick={() => switchMode('long_break')}>Long</Button>
                        </div>

                        <Select onValueChange={setSelectedTaskId} value={selectedTaskId} disabled={isActive}>
                            <SelectTrigger><SelectValue placeholder="Link to a quest..." /></SelectTrigger>
                            <SelectContent>{pendingTasks.map(task => <SelectItem key={task.id} value={String(task.id)}>{task.content}</SelectItem>)}</SelectContent>
                        </Select>

                        <div className="flex justify-center items-center gap-6 mt-2">
                            <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)}>
                                {isMuted ? <VolumeX className="h-5 w-5"/> : <Volume2 className="h-5 w-5"/>}
                            </Button>
                            <Button size="lg" className="h-16 w-16 rounded-full" onClick={() => setIsActive(!isActive)}>
                                {isActive ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => switchMode(mode)} disabled={isActive}>
                                <RotateCcw className="h-5 w-5"/>
                            </Button>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Timer Settings</DialogTitle>
                        <DialogDescription>Configure the duration of your focus and break sessions.</DialogDescription>
                    </DialogHeader>
                    <Form {...settingsForm}>
                        <form onSubmit={settingsForm.handleSubmit(onSaveSettings)} className="space-y-4 pt-4">
                            <FormField control={settingsForm.control} name="pomodoro" render={({ field }) => ( <FormItem><FormLabel>Focus (minutes)</FormLabel><FormControl><Input type="number" {...field}/></FormControl><FormMessage /></FormItem> )}/>
                            <FormField control={settingsForm.control} name="shortBreak" render={({ field }) => ( <FormItem><FormLabel>Short Break (minutes)</FormLabel><FormControl><Input type="number" {...field}/></FormControl><FormMessage /></FormItem> )}/>
                            <FormField control={settingsForm.control} name="longBreak" render={({ field }) => ( <FormItem><FormLabel>Long Break (minutes)</FormLabel><FormControl><Input type="number" {...field}/></FormControl><FormMessage /></FormItem> )}/>
                            <DialogFooter><Button type="submit">Save Settings</Button></DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    );
};
export default FocusTimer;