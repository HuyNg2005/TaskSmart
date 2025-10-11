"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { LocalTask } from "@/lib/localTasks";

interface KanbanCardProps {
    task: LocalTask;
    previewMode?: boolean;
    onClick?: (task: LocalTask) => void;
}

export default function KanbanCard({ task, previewMode = false, onClick }: KanbanCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={() => !previewMode && onClick?.(task)}
        >
            <Card className="border border-slate-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md dark:hover:shadow-emerald-500/10 transition-all cursor-grab active:cursor-grabbing bg-white dark:bg-gray-900">
                <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-3xl font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {task.title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2">
                    {task.description && (
                        <p className="text-xs text-slate-600 dark:text-gray-400 line-clamp-2">{task.description}</p>
                    )}

                    {task.assignees && task.assignees.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                            {task.assignees.slice(0, 3).map((assignee) => (
                                <div
                                    key={assignee.id}
                                    className="w-6 h-6 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center text-xs font-medium shadow-sm"
                                    title={assignee.name}
                                >
                                    {assignee.name.charAt(0).toUpperCase()}
                                </div>
                            ))}
                            {task.assignees.length > 3 && (
                                <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-gray-700 text-slate-700 dark:text-gray-300 flex items-center justify-center text-xs font-medium shadow-sm">
                                    +{task.assignees.length - 3}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}