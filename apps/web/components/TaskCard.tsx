"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { format } from "date-fns";

interface TaskCardProps {
    task: {
        id: string;
        title: string;
        description?: string;
        dueDate: string;
        status: "TODO" | "IN_PROGRESS" | "DONE";
        assignees: { id: string; name: string }[];
    };
    onEdit: (task: TaskCardProps["task"]) => void;
    onDelete: (id: string) => void;
    onRemoveAssignee: (taskId: string, userId: string) => void;
    onAssign: (taskId: string) => void;
}

export default function TaskCard({
                                     task,
                                     onEdit,
                                     onDelete,
                                     onRemoveAssignee,
                                     onAssign,
                                 }: TaskCardProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 mb-4"
        >
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {task.title}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
                {task.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">{task.description}</p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Due: {format(new Date(task.dueDate), "PPP")}
                </p>

                <div className="flex flex-wrap gap-2">
                    {task.assignees.map((a) => (
                        <Badge
                            key={a.id}
                            className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100"
                        >
                            {a.name}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="ml-1 h-4 w-4"
                                onClick={() => onRemoveAssignee(task.id, a.id)}
                            >
                                x
                            </Button>
                        </Badge>
                    ))}
                </div>

                <div className="flex space-x-2 pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(task)}
                        className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                    >
                        Edit
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(task.id)}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                        Delete
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAssign(task.id)}
                        className="flex-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200"
                    >
                        Assign
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
