"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, isBefore } from "date-fns";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import { Calendar } from "@workspace/ui/components/calendar";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@workspace/ui/components/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@workspace/ui/components/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@workspace/ui/components/table";
import { Pagination, PaginationContent, PaginationNext, PaginationPrevious } from "@workspace/ui/components/pagination";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@workspace/ui/components/tooltip";
import { ListTodo, Calendar as CalendarIcon, Plus, Search, Filter, X, Trash2 } from "lucide-react";

import { useUIStore } from "@/stores/ui-store";
import {
    loadLocalTasks,
    addLocalTask,
    updateLocalTask,
    deleteLocalTask,
    LocalTask as LocalTaskType,
} from "@/lib/localTasks";
import { loadLocalProjects } from "@/lib/localProjects";
import KanbanBoard from "@/components/KanbanBoard";

const PAGE_SIZE = 5;

const TaskZ = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    projectId: z.string().min(1),
    dueDate: z.date().optional(),
    assigneeId: z.string().optional(),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE"]), // Remove .default("TODO")
});
type TaskForm = z.infer<typeof TaskZ>;

export default function TasksPage() {
    const [tasks, setTasks] = useState<LocalTaskType[]>(() => loadLocalTasks());
    const [projects, setProjects] = useState(() => loadLocalProjects());
    const [editing, setEditing] = useState<LocalTaskType | null>(null);
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [sortBy] = useState<"created" | "due" | "title">("created");
    const [page, setPage] = useState(1);
    const [pageInput, setPageInput] = useState("1");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // State for delete confirmation dialog
    const [taskToDelete, setTaskToDelete] = useState<string | null>(null); // Track task ID to delete

    const activeProjectId = useUIStore((s) => s.activeProjectId);

    const { register, handleSubmit, control, reset, watch } = useForm<TaskForm>({
        resolver: zodResolver(TaskZ),
        defaultValues: {
            title: "",
            description: "",
            projectId: activeProjectId ?? (projects[0]?.id ?? ""),
            dueDate: undefined,
            assigneeId: undefined,
            status: "TODO",
        },
    });

    const watchedProjectId = watch("projectId");

    useEffect(() => {
        setProjects(loadLocalProjects());
        setTasks(loadLocalTasks());
    }, []);

    useEffect(() => {
        if (editing) {
            reset({
                title: editing.title,
                description: editing.description,
                projectId: editing.projectId,
                dueDate: editing.dueDate ? new Date(editing.dueDate) : undefined,
                assigneeId: editing.assignees[0]?.id,
                status: editing.status,
            });
            setDialogOpen(true);
        } else {
            reset({
                title: "",
                description: "",
                projectId: activeProjectId ?? (projects[0]?.id ?? ""),
                dueDate: undefined,
                assigneeId: undefined,
                status: "TODO",
            });
        }
    }, [editing, activeProjectId, projects, reset]);

    const rehydrate = () => {
        setProjects(loadLocalProjects());
        setTasks(loadLocalTasks());
    };

    const onCreateOrUpdate = (vals: TaskForm) => {
        if (vals.dueDate && isBefore(vals.dueDate, new Date())) {
            toast.error("Due date cannot be in the past");
            return;
        }

        const project = projects.find((p) => p.id === vals.projectId);
        if (vals.dueDate && project?.deadline) {
            const projDeadline = new Date(project.deadline);
            if (vals.dueDate > projDeadline) {
                toast.error("Task due date cannot be after project deadline");
                return;
            }
        }

        if (editing) {
            const newAssignees =
                vals.assigneeId && !editing.assignees.some((a) => a.id === vals.assigneeId)
                    ? [
                        ...editing.assignees,
                        {
                            id: vals.assigneeId,
                            name: project?.members.find((m) => m.id === vals.assigneeId)?.name ?? "",
                        },
                    ]
                    : editing.assignees;

            updateLocalTask(editing.id, {
                title: vals.title,
                description: vals.description,
                projectId: vals.projectId,
                dueDate: vals.dueDate ? vals.dueDate.toISOString() : undefined,
                assignees: newAssignees,
                status: editing.status, // Preserve existing status
            });
            toast.success("Task updated");
            setEditing(null);
            setDialogOpen(false);
        } else {
            const now = new Date().toISOString();
            const newTask: LocalTaskType = {
                id: `task-${Date.now()}`,
                title: vals.title,
                description: vals.description,
                status: vals.status,
                createdAt: now,
                dueDate: vals.dueDate ? vals.dueDate.toISOString() : undefined,
                projectId: vals.projectId,
                assignees: vals.assigneeId
                    ? [
                        {
                            id: vals.assigneeId,
                            name: project?.members.find((m) => m.id === vals.assigneeId)?.name ?? "",
                        },
                    ]
                    : [],
            };
            addLocalTask(newTask);

            const projs = loadLocalProjects();
            const pi = projs.findIndex((p) => p.id === vals.projectId);
            if (pi !== -1) {
                const selectedProject = projs[pi];
                if (selectedProject) {
                    selectedProject.tasks.push(newTask.id);
                    localStorage.setItem("tbx:projects_v1", JSON.stringify(projs));
                }
            }
            toast.success("Task created");
            setDialogOpen(false);
        }

        rehydrate();
        reset();
    };

    const handleDelete = (id: string) => {
        setTaskToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!taskToDelete) return;

        if (editing?.id === taskToDelete) {
            setEditing(null);
            setDialogOpen(false);
        }
        deleteLocalTask(taskToDelete);

        const projs = loadLocalProjects();
        const pi = projs.findIndex((p) => p.tasks.includes(taskToDelete));
        if (pi !== -1) {
            const selectedProject = projs[pi];
            if (selectedProject) {
                selectedProject.tasks = selectedProject.tasks.filter((t) => t !== taskToDelete);
                localStorage.setItem("tbx:projects_v1", JSON.stringify(projs));
            }
        }
        rehydrate();
        toast.success("Task deleted");
        setDeleteDialogOpen(false);
        setTaskToDelete(null);
    };

    const handleRemoveAssignee = (taskId: string, userId: string) => {
        const task = editing || tasks.find((x) => x.id === taskId);
        if (!task) return;

        const newAssignees = task.assignees.filter((a) => a.id !== userId);
        updateLocalTask(taskId, { assignees: newAssignees });

        if (editing && editing.id === taskId) {
            setEditing({ ...editing, assignees: newAssignees });
        }

        toast.success("Member removed");
        rehydrate();
    };

    const handleStatusUpdate = (taskId: string, status: LocalTaskType["status"]) => {
        updateLocalTask(taskId, { status });
        rehydrate();
    };

    const filtered = useMemo(() => {
        let out = tasks.slice();
        if (activeProjectId) out = out.filter((t) => t.projectId === activeProjectId);
        if (search) out = out.filter((t) => t.title.toLowerCase().includes(search.toLowerCase()) || (t.description ?? "").toLowerCase().includes(search.toLowerCase()));
        if (filterStatus) out = out.filter((t) => t.status === filterStatus);
        if (sortBy === "title") out.sort((a, b) => a.title.localeCompare(b.title));
        if (sortBy === "due") out.sort((a, b) => ((a.dueDate || "") > (b.dueDate || "") ? 1 : -1));
        if (sortBy === "created") out.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
        return out;
    }, [tasks, activeProjectId, search, filterStatus, sortBy]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
        setPageInput(String(page));
    }, [totalPages, page]);

    const handlePageInputChange = (value: string) => {
        setPageInput(value);
        const num = parseInt(value);
        if (!isNaN(num) && num >= 1 && num <= totalPages) {
            setPage(num);
        }
    };

    const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const currentProject = projects.find((p) => p.id === (watchedProjectId || activeProjectId || projects[0]?.id));
    const memberOptions = currentProject?.members ?? [];

    // @ts-ignore
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8 transition-colors">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white text-center sm:text-left">Tasks</h1>
                        <p className="text-sm text-slate-600 dark:text-gray-400 mt-1 text-center sm:text-left">Manage your tasks efficiently</p>
                    </div>

                    <TooltipProvider>
                        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setEditing(null); reset(); } setDialogOpen(open); }}>
                            <DialogTrigger asChild>
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 w-full sm:w-auto"
                                    onClick={() => { setEditing(null); reset(); setDialogOpen(true); }}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Task
                                </Button>
                            </DialogTrigger>

                            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-800">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-bold dark:text-white">
                                        {editing ? "Update Task" : "New Task"}
                                    </DialogTitle>
                                </DialogHeader>

                                <form onSubmit={handleSubmit(onCreateOrUpdate)} className="space-y-4 mt-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium dark:text-gray-200">Project</label>
                                        <Controller
                                            control={control}
                                            name="projectId"
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="h-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                                                        <SelectValue placeholder="Select project" />
                                                    </SelectTrigger>
                                                    <SelectContent className="dark:bg-gray-900 dark:border-gray-800">
                                                        {projects.map((p) => (
                                                            <SelectItem key={p.id} value={p.id} className="dark:text-white dark:focus:bg-gray-800">
                                                                {p.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium dark:text-gray-200">Title</label>
                                        <Input {...register("title")} placeholder="Enter task title" className="h-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium dark:text-gray-200">Description</label>
                                        <Input {...register("description")} placeholder="Enter description" className="h-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium dark:text-gray-200">Due Date</label>
                                        <Controller
                                            control={control}
                                            name="dueDate"
                                            render={({ field }) => (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" className="w-full h-10 justify-start dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700">
                                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                                            {field.value ? format(field.value, "PPP") : "Select due date"}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="p-0 dark:bg-gray-900 dark:border-gray-800" align="start">
                                                        <Calendar mode="single" selected={field.value} onSelect={(d) => field.onChange(d ?? undefined)} />
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium dark:text-gray-200">Assignee</label>
                                        <Controller
                                            control={control}
                                            name="assigneeId"
                                            render={({ field }) => (
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="h-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                                                        <SelectValue placeholder={memberOptions.length ? "Select member" : "No members"} />
                                                    </SelectTrigger>
                                                    <SelectContent className="dark:bg-gray-900 dark:border-gray-800">
                                                        {memberOptions.length ? (
                                                            memberOptions.map((m) => <SelectItem key={m.id} value={m.id} className="dark:text-white dark:focus:bg-gray-800">{m.name}</SelectItem>)
                                                        ) : (
                                                            <div className="p-2 text-sm text-slate-500 dark:text-gray-400 text-center">No members</div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </div>

                                    {editing && editing.assignees.length > 0 && (
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium dark:text-gray-200">Current Assignees</label>
                                            <div className="flex gap-2 flex-wrap p-3 bg-slate-100 dark:bg-gray-800 rounded-lg">
                                                {editing.assignees.map((a) => (
                                                    <div key={a.id} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 rounded-md border dark:border-gray-600 text-sm dark:text-gray-200">
                                                        <span>{a.name}</span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-5 w-5 hover:bg-red-50 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 rounded-full"
                                                            onClick={() => handleRemoveAssignee(editing.id, a.id)}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-2">
                                        <Button variant="outline" type="button" className="flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700" onClick={() => { setEditing(null); reset(); setDialogOpen(false); }}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600">
                                            {editing ? "Update" : "Create"}
                                        </Button>
                                        {editing && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        className="flex-1 dark:bg-red-900/50 dark:hover:bg-red-900 dark:border-red-800"
                                                        onClick={() => handleDelete(editing.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Delete this task</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </TooltipProvider>

                    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <DialogContent className="dark:bg-gray-900 dark:border-gray-800">
                            <DialogHeader>
                                <DialogTitle className="dark:text-white">Confirm Delete</DialogTitle>
                                <DialogDescription className="dark:text-gray-400">
                                    Are you sure you want to delete this task? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
                                    onClick={() => setDeleteDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="dark:bg-red-900/50 dark:hover:bg-red-900"
                                    onClick={confirmDelete}
                                >
                                    Delete
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card className="border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <CardHeader className="border-b dark:border-gray-800">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2 dark:text-white">
                            <ListTodo className="w-5 h-5" />
                            Kanban Board
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="max-h-[500px] overflow-y-auto">
                            <KanbanBoard
                                tasks={filtered}
                                onStatusChange={(id, status) => handleStatusUpdate(id, status)}
                                onEdit={(t) => { setEditing(t); }}
                                onDelete={handleDelete}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-gray-500" />
                        <Input
                            placeholder="Search tasks..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="pl-10 h-10 dark:bg-gray-900 dark:border-gray-800 dark:text-white dark:placeholder:text-gray-500"
                        />
                    </div>
                    <Select value={filterStatus ?? "all"} onValueChange={(v) => setFilterStatus(v === "all" ? null : v)}>
                        <SelectTrigger className="w-full sm:w-40 h-10 dark:bg-gray-900 dark:border-gray-800 dark:text-white">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-900 dark:border-gray-800">
                            <SelectItem value="all" className="dark:text-white dark:focus:bg-gray-800">All Status</SelectItem>
                            <SelectItem value="TODO" className="dark:text-white dark:focus:bg-gray-800">TODO</SelectItem>
                            <SelectItem value="IN_PROGRESS" className="dark:text-white dark:focus:bg-gray-800">In Progress</SelectItem>
                            <SelectItem value="DONE" className="dark:text-white dark:focus:bg-gray-800">Done</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Card className="border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <CardHeader className="border-b dark:border-gray-800">
                        <CardTitle className="text-lg font-semibold dark:text-white">Task List</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-b border-slate-200 dark:border-gray-800">
                                        <TableHead className="font-semibold dark:text-gray-300">Title</TableHead>
                                        <TableHead className="font-semibold hidden md:table-cell dark:text-gray-300">Project</TableHead>
                                        <TableHead className="font-semibold dark:text-gray-300">Status</TableHead>
                                        <TableHead className="font-semibold hidden sm:table-cell dark:text-gray-300">Due Date</TableHead>
                                        <TableHead className="font-semibold text-right dark:text-gray-300">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pageItems.map((t) => (
                                        <TableRow key={t.id} className="border-b border-slate-200 dark:border-gray-800">
                                            <TableCell>
                                                <div className="font-medium text-sm dark:text-white">{t.title}</div>
                                                <div className="text-xs text-slate-500 dark:text-gray-400 line-clamp-1">{t.description ?? ""}</div>
                                            </TableCell>
                                            <TableCell className="text-sm hidden md:table-cell dark:text-gray-300">
                                                {projects.find((p) => p.id === t.projectId)?.name ?? "—"}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                                    t.status === "DONE" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                                                        t.status === "IN_PROGRESS" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                                                            "bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300"
                                                }`}>
                                                    {t.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm hidden sm:table-cell dark:text-gray-300">
                                                {t.dueDate ? format(new Date(t.dueDate), "PP") : "—"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
                                                        onClick={() => { setEditing(t); setDialogOpen(true); }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="destructive"
                                                                    size="sm"
                                                                    className="dark:bg-red-900/50 dark:hover:bg-red-900 dark:border-red-800"
                                                                    onClick={() => handleDelete(t.id)}
                                                                >
                                                                    Delete
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Delete this task</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        {filtered.length === 0 && (
                            <div className="text-center py-12">
                                <ListTodo className="w-12 h-12 text-slate-300 dark:text-gray-700 mx-auto mb-3" />
                                <p className="text-sm text-slate-500 dark:text-gray-400">No tasks found</p>
                            </div>
                        )}

                        <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-200 dark:border-gray-800">
                            <div className="text-sm text-slate-600 dark:text-gray-400">
                                Showing {filtered.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} tasks
                            </div>
                            <div className="flex items-center gap-3">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationPrevious
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer dark:text-white dark:hover:bg-gray-800"}
                                        />
                                    </PaginationContent>
                                </Pagination>

                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min={1}
                                        max={totalPages}
                                        value={pageInput}
                                        onChange={(e) => handlePageInputChange(e.target.value)}
                                        onBlur={() => setPageInput(String(page))}
                                        className="w-16 h-9 text-center text-sm dark:bg-gray-900 dark:border-gray-800 dark:text-white"
                                    />
                                    <span className="text-sm text-slate-600 dark:text-gray-400">/{totalPages}</span>
                                </div>

                                <Pagination>
                                    <PaginationContent>
                                        <PaginationNext
                                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                            className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer dark:text-white dark:hover:bg-gray-800"}
                                        />
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}