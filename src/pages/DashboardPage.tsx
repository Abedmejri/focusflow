import React, { useState, useEffect } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Scroll } from '@/components/Scroll';
import { OrnateSeparator } from '@/components/OrnateSeparator';
import { Loader2, Check, Clock, Trophy, Target, Zap, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const DashboardPage: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState<api.DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getDashboardStats()
            .then(setStats)
            .catch(() => toast.error("Could not summon the dashboard spirits. Please try again."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!stats) {
        return <div className="text-center text-destructive">The dashboard scroll is unreadable. The connection to the aether has been lost.</div>;
    }

    const focusTimeInHours = (stats.focus_time_week / 60).toFixed(1);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="text-center">
                <h2 className="text-3xl font-display font-bold tracking-tight">The Wizard's Desk</h2>
                <p className="text-muted-foreground">Greetings, apprentice {user?.email?.split('@')[0]}. Here is your daily scrying.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard 
                    title="Arcane Focus (Week)" 
                    value={`${focusTimeInHours} hours`}
                    icon={<Clock className="h-4 w-4 text-primary" />}
                    description={`${stats.focus_time_today} minutes channeled today`}
                />
                <StatCard 
                    title="Quests Completed Today" 
                    value={stats.tasks_completed_today}
                    icon={<Check className="h-4 w-4 text-green-600" />}
                    description={`${stats.tasks_pending} quests remaining`}
                />
                <StatCard 
                    title="Clarity Orbs" 
                    value={stats.total_clarity_points}
                    icon={<Trophy className="h-4 w-4 text-accent" />}
                    description="Gathered from worldly detachment"
                />
            </div>
            
            <OrnateSeparator />

            <div className="grid gap-8 md:grid-cols-2">
                <Scroll className="animate-slide-up-fade" style={{animationDelay: '0.2s'}}>
                    <h3 className="text-xl font-display font-bold text-center mb-4">Weekly Divination</h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.focus_last_7_days}>
                                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}m`} />
                                <Tooltip 
                                    cursor={{ fill: 'hsl(var(--primary) / 0.1)' }} 
                                    contentStyle={{ 
                                        backgroundColor: 'hsl(var(--card) / 0.8)', 
                                        backdropFilter: 'blur(4px)', 
                                        border: '1px solid hsl(var(--border))', 
                                        borderRadius: 'var(--radius)' 
                                    }} 
                                />
                                <Bar dataKey="minutes" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Scroll>

                <Card className="animate-slide-up-fade" style={{animationDelay: '0.4s'}}>
                    <CardHeader>
                        <CardTitle>Tomes of Power</CardTitle>
                        <CardDescription>Choose your path for today.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                       <Link to="/goals"><Button className="w-full justify-start h-16 text-left group transition-all hover:border-primary" variant="outline"><Target className="mr-4 h-6 w-6 shrink-0 text-muted-foreground transition-all group-hover:text-primary" /><div><p className="font-semibold">Consult the Quest Log</p><p className="text-sm text-muted-foreground">Review your grand ambitions.</p></div></Button></Link>
                       <Link to="/routines"><Button className="w-full justify-start h-16 text-left group transition-all hover:border-primary" variant="outline"><Zap className="mr-4 h-6 w-6 shrink-0 text-muted-foreground transition-all group-hover:text-primary" /><div><p className="font-semibold">Begin Your Rituals</p><p className="text-sm text-muted-foreground">Practice your daily disciplines.</p></div></Button></Link>
                       <Link to="/journal"><Button className="w-full justify-start h-16 text-left group transition-all hover:border-primary" variant="outline"><BookOpen className="mr-4 h-6 w-6 shrink-0 text-muted-foreground transition-all group-hover:text-primary" /><div><p className="font-semibold">Open the Grimoire</p><p className="text-sm text-muted-foreground">Transcribe your thoughts.</p></div></Button></Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
export default DashboardPage;