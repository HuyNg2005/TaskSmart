import {Card, CardContent, CardHeader, CardTitle} from "@workspace/ui/components/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@workspace/ui/components/table";
import {format, isBefore} from "date-fns";
import {Button} from "@workspace/ui/components/button";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@workspace/ui/components/tooltip";
import {ListTodo} from "lucide-react";
import {Pagination, PaginationContent, PaginationNext, PaginationPrevious} from "@workspace/ui/components/pagination";
import {Input} from "@workspace/ui/components/input";
import {useEffect, useMemo, useState} from "react";
import {
    addLocalTask,
    deleteLocalTask,
    loadLocalTasks,
    LocalTask as LocalTaskType,
    updateLocalTask
} from "@/lib/localTasks";
import {loadLocalProjects} from "@/lib/localProjects";
import {useUIStore} from "@/stores/ui-store";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {toast} from "sonner";


const PAGE_SIZE = 5;

export default function TaskTable() {
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


    useEffect(() => {
        setProjects(loadLocalProjects());
        setTasks(loadLocalTasks());
    }, []);



    const rehydrate = () => {
        setProjects(loadLocalProjects());
        setTasks(loadLocalTasks());
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
    return (
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
    )
}