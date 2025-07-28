import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { useDataStore } from '../stores/useDataStore';
import FocusTimer from './FocusTimer';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Book, FolderKanban, LogOut, Menu, Moon, Repeat, Sun, LayoutDashboard, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const AppLayout: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // Get tasks from the global store to ensure it's always fresh
    const { tasks, fetchGoalsAndTasks } = useDataStore(); 

    // Fetch initial data when the layout mounts or user changes
    useEffect(() => {
        if (user) {
            fetchGoalsAndTasks();
        }
    }, [user, fetchGoalsAndTasks]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const menuItems = [
        { key: '/', label: 'Wizard\'s Desk', icon: <LayoutDashboard className="h-4 w-4" /> },
        { key: '/goals', label: 'Quests & Scrolls', icon: <FolderKanban className="h-4 w-4" /> },
        { key: '/routines', label: 'Daily Rituals', icon: <Repeat className="h-4 w-4" /> },
        { key: '/coach', label: 'Consult the Sage', icon: <Moon className="h-4 w-4" /> },
        { key: '/journal', label: 'The Grimoire', icon: <Sun className="h-4 w-4" /> },
    ];
    
    const emailInitial = user?.email ? user.email.charAt(0).toUpperCase() : '?';

    const NavContent = ({ className }: { className?: string }) => {
        const isActive = (key: string) => key === '/' ? location.pathname === '/' : location.pathname.startsWith(key);
        return (
            <nav className={cn("flex flex-col gap-2 p-4 font-serif", className)}>
                {menuItems.map(item => (
                    <Link key={item.key} to={item.key} onClick={() => setIsSheetOpen(false)}>
                        <Button
                            variant={isActive(item.key) ? 'secondary' : 'ghost'}
                            className="w-full justify-start gap-3 text-base"
                        >
                            {item.icon} {item.label}
                        </Button>
                    </Link>
                ))}
            </nav>
        );
    };

    return (
        <div className="flex min-h-screen w-full">
            {/* --- DESKTOP SIDEBAR --- */}
            <aside className="hidden w-60 flex-col border-r border-primary/20 bg-[#5d4037] text-primary-foreground sm:flex">
                <div className="flex h-16 shrink-0 items-center border-b border-primary/20 px-6">
                    <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg text-amber-100/90 hover:text-amber-100 transition-colors">
                        <Book className="h-6 w-6" />
                        <span>FocusFlow</span>
                    </Link>
                </div>
                {/* Custom styles for the dark sidebar text */}
                <style>{`
                    .dark-sidebar .variant-ghost { color: hsl(var(--primary-foreground) / 0.7); }
                    .dark-sidebar .variant-ghost:hover { background-color: hsl(var(--accent) / 0.1); color: hsl(var(--primary-foreground)); }
                    .dark-sidebar .variant-secondary { background-color: hsl(var(--accent) / 0.2); color: hsl(var(--primary-foreground)); }
                `}</style>
                <div className="dark-sidebar">
                    <NavContent />
                </div>
            </aside>
            <div className="flex flex-1 flex-col">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/80 backdrop-blur-lg px-4 sm:justify-end sm:px-6">
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                            <Button size="icon" variant="outline" className="sm:hidden">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="sm:max-w-xs p-0 bg-background/90 backdrop-blur-lg">
                            <div className="flex h-16 shrink-0 items-center border-b px-6">
                                <Link to="/" className="flex items-center gap-2 font-semibold">
                                    <Book className="h-6 w-6 text-primary" />
                                    <span className="text-lg">FocusFlow</span>
                                </Link>
                            </div>
                            <NavContent />
                        </SheetContent>
                    </Sheet>
                    
                    {/* --- HEADER ACTIONS --- */}
                    <div className="flex items-center gap-2">
                        <FocusTimer tasks={tasks} />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                    <Avatar className="h-9 w-9"><AvatarFallback>{emailInitial}</AvatarFallback></Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-popover/80 backdrop-blur-sm">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">My Account</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                
                                {/* --- NEW DONATION LINK --- */}
                                <Link to="/donate">
                                    <DropdownMenuItem className="text-primary focus:bg-primary/10 focus:text-primary cursor-pointer">
                                        <Heart className="mr-2 h-4 w-4" /> Support FocusFlow
                                    </DropdownMenuItem>
                                </Link>
                                
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-white focus:bg-destructive cursor-pointer">
                                    <LogOut className="mr-2 h-4 w-4"/> Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
export default AppLayout;