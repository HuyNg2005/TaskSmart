"use client";

import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import KanbanCard from "./KanbanCard";
import { LocalTask } from "@/lib/localTasks";

interface KanbanColumnProps {
    status: "TODO" | "IN_PROGRESS" | "DONE";
    tasks: LocalTask[]; // Use LocalTask
    onEdit?: (task: LocalTask) => void;
    onDelete?: (id: string) => void;
}

const STATUS_LABELS = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    DONE: "Done",
};

const STATUS_COLORS = {
    TODO: "bg-slate-100 dark:bg-gray-800 border-slate-200 dark:border-gray-700",
    IN_PROGRESS: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50",
    DONE: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900/50",
};

export default function KanbanColumn({ status, tasks, onEdit, onDelete }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id: status });

    return (
        <Card
            className={`${STATUS_COLORS[status]} border shadow-sm transition-all ${
                isOver ? "ring-2 ring-emerald-400 dark:ring-emerald-500" : ""
            }`}
        >
            <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{STATUS_LABELS[status]}</span>
                    <span
                        className="text-xs font-normal text-slate-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full"
                        suppressHydrationWarning
                    >
                        {tasks.length}
                    </span>
                </CardTitle>
            </CardHeader>

            <CardContent ref={setNodeRef} className="space-y-2 min-h-[180px] max-h-[420px] overflow-y-auto px-2 pb-2">
                {tasks.length > 0 ? (
                    tasks.map((task) => (
                        <KanbanCard
                            key={task.id}
                            task={task}
                            onClick={() => onEdit?.(task)}
                        />
                    ))
                ) : (
                    <div className="flex items-center justify-center h-24">
                        <p className="text-slate-400 dark:text-gray-600 text-xs italic">No tasks</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}