"use client";

import {
    DndContext,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragStartEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useState } from "react";
import { Card } from "@workspace/ui/components/card";
import KanbanColumn from "./KanbanColumn";
import KanbanCard from "./KanbanCard";
import { updateLocalTask, LocalTask } from "@/lib/localTasks";

export default function KanbanBoard({
                                        tasks,
                                        onEdit,
                                        onStatusChange,
                                        onDelete,
                                    }: {
    tasks: LocalTask[];
    onEdit?: (t: LocalTask) => void;
    onStatusChange?: (id: string, status: LocalTask["status"]) => void;
    onDelete?: (id: string) => void;
}) {
    const [activeTask, setActiveTask] = useState<LocalTask | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const found = tasks.find((t) => t.id === active.id) ?? null;
        setActiveTask(found);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const activeTaskObj = tasks.find((t) => t.id === active.id);
        if (!activeTaskObj) return;

        let newStatus = activeTaskObj.status;

        const statusValues: LocalTask["status"][] = ["TODO", "IN_PROGRESS", "DONE"];
        if (statusValues.includes(over.id as LocalTask["status"])) {
            newStatus = over.id as LocalTask["status"];
        } else {
            const overTask = tasks.find((t) => t.id === over.id);
            if (overTask) {
                newStatus = overTask.status;
            }
        }

        if (newStatus && newStatus !== activeTaskObj.status) {
            updateLocalTask(activeTaskObj.id, { status: newStatus });
            onStatusChange?.(activeTaskObj.id, newStatus);
        }
    };

    const todoTasks = tasks.filter((t) => t.status === "TODO");
    const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS");
    const doneTasks = tasks.filter((t) => t.status === "DONE");

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <SortableContext
                    items={todoTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <KanbanColumn
                        status="TODO"
                        tasks={todoTasks}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                </SortableContext>

                <SortableContext
                    items={inProgressTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <KanbanColumn
                        status="IN_PROGRESS"
                        tasks={inProgressTasks}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                </SortableContext>

                <SortableContext
                    items={doneTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    <KanbanColumn
                        status="DONE"
                        tasks={doneTasks}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                </SortableContext>
            </div>

            <DragOverlay>
                {activeTask ? (
                    <Card className="p-0 shadow-2xl border-2 border-emerald-400 dark:border-emerald-500 bg-white dark:bg-gray-900 rotate-3 scale-105">
                        <KanbanCard task={activeTask} previewMode />
                    </Card>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}