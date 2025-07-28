import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Task } from '../services/api';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface TaskListProps {
  tasks: Task[];
  onAddTask: (content: string) => void;
  onToggleTask: (task: Task) => void;
  onDeleteTask: (taskId: number) => void;
  onShowEditModal: (task: Task) => void;
}

const taskFormSchema = z.object({
  content: z.string().min(1, { message: "Task cannot be empty." }),
});

const TaskList: React.FC<TaskListProps> = ({ tasks, onAddTask, onToggleTask, onDeleteTask, onShowEditModal }) => {
  const form = useForm<z.infer<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: { content: "" },
  });

  const handleAddTask = (values: z.infer<typeof taskFormSchema>) => {
    onAddTask(values.content);
    form.reset();
  };

  return (
    <div className="space-y-2">
      {tasks.length > 0 && tasks.map(task => (
        <div key={task.id} className="flex items-center gap-2 rounded-md p-2 -ml-2 hover:bg-muted">
          <Checkbox
            id={`task-${task.id}`}
            checked={task.is_completed}
            onCheckedChange={() => onToggleTask(task)}
          />
          <label htmlFor={`task-${task.id}`} className={`flex-1 text-sm ${task.is_completed ? 'text-muted-foreground line-through' : ''}`}>
            {task.content}
          </label>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onShowEditModal(task)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this task.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteTask(task.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleAddTask)} className="flex gap-2 pt-2">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl><Input placeholder="Add a new task..." {...field} /></FormControl>
              </FormItem>
            )}
          />
          <Button type="submit" size="sm">Add Task</Button>
        </form>
      </Form>
    </div>
  );
};

export default TaskList;