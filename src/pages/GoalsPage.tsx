import React, { useState, useEffect } from 'react';
import { useDataStore } from '../stores/useDataStore';
import TaskList from '../components/TaskList';
import { StickyNote } from '../components/StickyNote';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,  DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVertical, Trash2, Edit, PlusCircle, Loader2, Target } from 'lucide-react';
import * as api from '../services/api'; // Needed for type definitions

const goalFormSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().optional(),
});
const taskFormSchema = z.object({
  content: z.string().min(1, { message: "Content cannot be empty." }),
});

const noteStyles = [
  { color: 'yellow', rotation: '-rotate-2' },
  { color: 'blue', rotation: 'rotate-1' },
  { color: 'green', rotation: 'rotate-2' },
  { color: 'pink', rotation: '-rotate-1' },
] as const;

const GoalsPage: React.FC = () => {
    // Get ALL data and actions from the global store
    const { 
        goals, tasks, isLoadingGoals, fetchGoalsAndTasks, 
        addGoal, updateGoal, deleteGoal, 
        addTask, toggleTask, updateTask, deleteTask
    } = useDataStore();

    // Local state is only for controlling the UI (modals, forms)
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<api.Goal | null>(null);
    const [editingTask, setEditingTask] = useState<api.Task | null>(null);

    const goalForm = useForm<z.infer<typeof goalFormSchema>>({ resolver: zodResolver(goalFormSchema) });
    const taskForm = useForm<z.infer<typeof taskFormSchema>>({ resolver: zodResolver(taskFormSchema) });

    useEffect(() => {
        fetchGoalsAndTasks();
    }, [fetchGoalsAndTasks]);

    useEffect(() => {
        if (editingGoal) {
            goalForm.reset({ title: editingGoal.title, description: editingGoal.description || "" });
        }
    }, [editingGoal, goalForm]);

    useEffect(() => {
        if (editingTask) {
            taskForm.reset({ content: editingTask.content });
        }
    }, [editingTask, taskForm]);
    
    const handleGoalSubmit = async (values: z.infer<typeof goalFormSchema>) => {
        setIsSubmitting(true);
        const action = editingGoal
            ? updateGoal(editingGoal.id, values.title, values.description)
            : addGoal(values.title, values.description);
        
        toast.promise(action, {
            loading: 'Saving goal...',
            success: `Goal ${editingGoal ? 'updated' : 'pinned'}!`,
            error: 'Failed to save goal.',
        });

        await action;
        setIsSubmitting(false);
        setEditingGoal(null);
        setIsGoalModalOpen(false);
    };

    const handleDeleteGoal = async (goalId: number) => {
        toast.promise(deleteGoal(goalId), {
            loading: 'Unpinning goal...',
            success: 'Goal unpinned.',
            error: 'Failed to delete goal.',
        });
    };
    
    const handleAddTask = async (content: string, goalId: number) => {
        toast.promise(addTask(content, goalId), { loading: 'Adding task...', success: 'Task added!', error: 'Failed to add task.'});
    };
    const handleToggleTask = (task: api.Task) => {
        toggleTask(task); // Optimistic, no toast needed
    };
    const handleDeleteTask = (taskId: number) => {
        toast.promise(deleteTask(taskId), { loading: 'Deleting task...', success: 'Task deleted.', error: 'Failed to delete task.' });
    };
    const handleTaskSubmit = async (values: z.infer<typeof taskFormSchema>) => {
        if (!editingTask) return;
        setIsSubmitting(true);
        await toast.promise(updateTask(editingTask.id, values.content), { loading: 'Updating task...', success: 'Task updated!', error: 'Failed to update task.' });
        setIsSubmitting(false);
        setEditingTask(null);
        setIsTaskModalOpen(false);
    };

    if (isLoadingGoals) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Clarity Board</h2>
                <p className="text-muted-foreground">Your goals and tasks, pinned for focus.</p>
            </div>
            <Button onClick={() => { setEditingGoal(null); setIsGoalModalOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Pin a New Goal</Button>
        </div>

        <div 
          className="p-4 md:p-8 rounded-lg border min-h-[60vh]"
          style={{ backgroundImage: "url('/')" }}
        >
          {goals.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-full">
                    <div className="bg-white/70 backdrop-blur-sm p-8 rounded-lg text-center">
                      <Target className="h-12 w-12 text-muted-foreground mx-auto" />
                      <h3 className="mt-4 text-lg font-semibold">Your board is empty</h3>
                      <p className="mt-2 text-sm text-muted-foreground">Pin your first goal to get started.</p>
                      <Button className="mt-4" onClick={() => { setEditingGoal(null); setIsGoalModalOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Pin Goal</Button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {goals.map((goal, index) => {
                    const style = noteStyles[index % noteStyles.length];
                    return (
                      <div key={goal.id} className="animate-slide-up-fade" style={{ animationDelay: `${index * 100}ms` }}>
                        <StickyNote color={style.color} rotation={style.rotation}>
                            <div className="absolute top-3 right-3">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => setEditingGoal(goal)}><Edit className="mr-2 h-4 w-4"/> Edit</DropdownMenuItem>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4"/> Delete</DropdownMenuItem></AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this goal and all its tasks.</AlertDialogDescription></AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteGoal(goal.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <h3 className="font-handwritten text-2xl font-bold mb-2 pr-8">{goal.title}</h3>
                            <p className="text-sm text-gray-700 mb-4">{goal.description}</p>
                            <TaskList 
                                tasks={tasks.filter(t => t.goal_id === goal.id)}
                                onAddTask={(content) => handleAddTask(content, goal.id)}
                                onToggleTask={handleToggleTask}
                                onDeleteTask={handleDeleteTask}
                                onShowEditModal={setEditingTask}
                            />
                        </StickyNote>
                      </div>
                    )
                  })}
                </div>
            )}
        </div>
        
        <Dialog open={isGoalModalOpen} onOpenChange={(open) => { if (!open) setEditingGoal(null); setIsGoalModalOpen(open); }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingGoal ? "Edit Goal" : "Pin a New Goal"}</DialogTitle>
                    <DialogDescription>What's a major objective you want to achieve?</DialogDescription>
                </DialogHeader>
                <Form {...goalForm}>
                    <form onSubmit={goalForm.handleSubmit(handleGoalSubmit)} className="space-y-4 pt-4">
                       <FormField control={goalForm.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., Learn a new language" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                       <FormField control={goalForm.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Why is this goal important to you?" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                {editingGoal ? "Save Changes" : "Pin to Board"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>

        <Dialog open={isTaskModalOpen} onOpenChange={(open) => { if (!open) setEditingTask(null); setIsTaskModalOpen(open); }}>
            <DialogContent>
                <DialogHeader><DialogTitle>Edit Task</DialogTitle></DialogHeader>
                <Form {...taskForm}><form onSubmit={taskForm.handleSubmit(handleTaskSubmit)} className="space-y-4 pt-4">
                    <FormField control={taskForm.control} name="content" render={({ field }) => (
                        <FormItem><FormLabel>Task Content</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <DialogFooter><Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Save Changes</Button>
                    </DialogFooter>
                </form></Form>
            </DialogContent>
        </Dialog>
      </div>
    );
};
export default GoalsPage;