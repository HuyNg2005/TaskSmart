"use client";

import { useState, useEffect, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@workspace/ui/components/dialog";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@workspace/ui/components/sheet";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Calendar } from "@workspace/ui/components/calendar";
import { Textarea } from "@workspace/ui/components/textarea";
import { Badge } from "@workspace/ui/components/badge";
import { Separator } from "@workspace/ui/components/separator";
import { format, isBefore, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, Users, ListTodo, Edit, Trash2, Eye, Plus, X, FolderKanban } from "lucide-react";
import {
    loadLocalProjects,
    addLocalProject,
    updateLocalProject,
    deleteLocalProject,
    LocalProject,
} from "@/lib/localProjects";
import { loadLocalTasks, deleteLocalTask, updateLocalTask } from "@/lib/localTasks";
import { useUIStore } from "@/stores/ui-store";
import { toast } from "sonner";

type ProjectForm = {
    name: string;
    description?: string;
    deadline?: Date | undefined;
};

export default function ProjectsPage() {
    const [projects, setProjects] = useState<LocalProject[]>([]);
    const [openCreate, setOpenCreate] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [viewing, setViewing] = useState<LocalProject | null>(null);
    const [inviteName, setInviteName] = useState("");
    const [inviteList, setInviteList] = useState<{ id: string; name: string }[]>([]);
    const [selectedDeadline, setSelectedDeadline] = useState<Date | undefined>(undefined);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // State for delete confirmation dialog
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null); // Track project ID to delete

    const setActiveProjectId = useUIStore((s) => s.setActiveProjectId);

    useEffect(() => {
        setProjects(loadLocalProjects());
    }, []);

    useEffect(() => {
        if (!openCreate) {
            setInviteList([]);
            setInviteName("");
            setEditingId(null);
            setSelectedDeadline(undefined);
        }
    }, [openCreate]);

    const openForEdit = (p: LocalProject) => {
        setEditingId(p.id);
        setInviteList([...p.members]);
        setSelectedDeadline(p.deadline ? new Date(p.deadline) : undefined);
        setOpenCreate(true);
    };

    const onAddInvite = (e?: React.KeyboardEvent<HTMLInputElement>) => {
        if (e && e.key !== "Enter") return;
        const name = inviteName.trim();
        if (!name) return;
        const id = uuidv4();
        setInviteList((s) => {
            if (s.some((x) => x.name.toLowerCase() === name.toLowerCase())) return s;
            return [...s, { id, name }];
        });
        setInviteName("");
    };

    const handleCreateOrUpdate = (values: ProjectForm) => {
        const todayStart = startOfDay(new Date());
        if (values.deadline && isBefore(values.deadline, todayStart)) {
            toast.error("Deadline cannot be in the past");
            return;
        }

        if (editingId) {
            const oldProject = projects.find((p) => p.id === editingId);
            const oldMembers = oldProject ? oldProject.members.map((m) => m.id) : [];

            updateLocalProject(editingId, {
                name: values.name,
                description: values.description,
                deadline: values.deadline ? values.deadline.toISOString() : undefined,
                members: inviteList,
            });

            const newMemberIds = inviteList.map((m) => m.id);
            const removedMemberIds = oldMembers.filter((id) => !newMemberIds.includes(id));

            if (removedMemberIds.length > 0) {
                const tasks = loadLocalTasks();
                tasks.forEach((task) => {
                    if (task.projectId === editingId) {
                        const newAssignees = task.assignees.filter((a) => !removedMemberIds.includes(a.id));
                        if (newAssignees.length < task.assignees.length) {
                            updateLocalTask(task.id, { assignees: newAssignees });
                        }
                    }
                });
            }

            setProjects(loadLocalProjects());
            toast.success("Project updated successfully");
            setOpenCreate(false);
            return;
        }

        const now = new Date().toISOString();
        const newProject: LocalProject = {
            id: `proj-${Date.now()}`,
            name: values.name,
            description: values.description,
            createdAt: now,
            deadline: values.deadline ? values.deadline.toISOString() : undefined,
            managerId: "leader-1", // Gán managerId là profile.id mặc định
            members: inviteList,
            tasks: [],
        };
        addLocalProject(newProject);
        setProjects(loadLocalProjects());
        toast.success("Project created successfully");
        setOpenCreate(false);
    };

    const handleDelete = (id: string) => {
        setProjectToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!projectToDelete) return;

        const allTasks = loadLocalTasks();
        const projectTasks = allTasks.filter(t => t.projectId === projectToDelete);
        projectTasks.forEach(task => {
            deleteLocalTask(task.id);
        });

        deleteLocalProject(projectToDelete);
        setProjects(loadLocalProjects());

        const active = useUIStore.getState().activeProjectId;
        if (active === projectToDelete) setActiveProjectId(null);

        toast.success(`Project and ${projectTasks.length} task(s) deleted`);
        setDeleteDialogOpen(false);
        setProjectToDelete(null);
    };

    const tasks = useMemo(() => loadLocalTasks(), []);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8 transition-colors">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white text-center sm:text-left">Projects</h1>
                        <p className="text-sm text-slate-600 dark:text-gray-400 mt-1 text-center sm:text-left">Manage your projects efficiently</p>
                    </div>

                    <Dialog open={openCreate} onOpenChange={setOpenCreate}>
                        <DialogTrigger asChild>
                            <Button
                                size="default"
                                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white w-full sm:w-auto"
                                onClick={() => {
                                    setEditingId(null);
                                    setInviteList([]);
                                    setOpenCreate(true);
                                }}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                New Project
                            </Button>
                        </DialogTrigger>

                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-800">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold dark:text-white">
                                    {editingId ? "Edit Project" : "Create New Project"}
                                </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="proj-name" className="text-sm font-medium dark:text-gray-200">
                                        Project Name *
                                    </Label>
                                    <Input
                                        id="proj-name"
                                        placeholder="Enter project name"
                                        className="h-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
                                        defaultValue={
                                            editingId ? projects.find((p) => p.id === editingId)?.name : ""
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="proj-desc" className="text-sm font-medium dark:text-gray-200">
                                        Description
                                    </Label>
                                    <Textarea
                                        id="proj-desc"
                                        placeholder="Enter project description"
                                        className="min-h-[100px] resize-none dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
                                        defaultValue={
                                            editingId
                                                ? projects.find((p) => p.id === editingId)?.description
                                                : ""
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium dark:text-gray-200">Deadline</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full h-10 justify-start text-left font-normal dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                <span className={selectedDeadline ? "" : "text-slate-500 dark:text-gray-500"}>
                                                    {selectedDeadline ? format(selectedDeadline, "PPP") : "Select deadline"}
                                                </span>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 dark:bg-gray-900 dark:border-gray-800" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={selectedDeadline}
                                                onSelect={setSelectedDeadline}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium dark:text-gray-200">Team Members</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={inviteName}
                                            onChange={(e) => setInviteName(e.target.value)}
                                            onKeyDown={(e) => onAddInvite(e)}
                                            placeholder="Enter name and press Enter"
                                            className="h-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
                                        />
                                        <Button
                                            type="button"
                                            onClick={() => onAddInvite()}
                                            variant="outline"
                                            className="px-4 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
                                        >
                                            Add
                                        </Button>
                                    </div>
                                    {inviteList.length > 0 && (
                                        <div className="flex gap-2 flex-wrap mt-2 p-3 bg-slate-100 dark:bg-gray-800 rounded-lg">
                                            {inviteList.map((m) => (
                                                <Badge
                                                    key={m.id}
                                                    variant="secondary"
                                                    className="px-3 py-1 dark:bg-gray-700 dark:text-gray-200"
                                                >
                                                    {m.name}
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-4 w-4 ml-2 hover:bg-slate-300 dark:hover:bg-gray-600 rounded-full"
                                                        onClick={() =>
                                                            setInviteList((s) => s.filter((x) => x.id !== m.id))
                                                        }
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <DialogFooter className="gap-2 flex-col sm:flex-row">
                                <Button variant="outline" onClick={() => setOpenCreate(false)} className="w-full sm:w-auto dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700">
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 w-full sm:w-auto"
                                    onClick={() => {
                                        const nameEl = document.getElementById("proj-name") as HTMLInputElement | null;
                                        const descEl = document.getElementById("proj-desc") as HTMLTextAreaElement | null;
                                        const name = nameEl?.value?.trim() ?? "";
                                        const desc = descEl?.value?.trim() ?? "";
                                        if (!name) {
                                            toast.error("Project name is required");
                                            return;
                                        }
                                        handleCreateOrUpdate({
                                            name,
                                            description: desc || undefined,
                                            deadline: selectedDeadline,
                                        });
                                    }}
                                >
                                    {editingId ? "Save Changes" : "Create Project"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">Total Projects</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">{projects.length}</p>
                                </div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                                    <FolderKanban className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">Total Tasks</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                                        {projects.reduce((acc, p) => acc + p.tasks.length, 0)}
                                    </p>
                                </div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                    <ListTodo className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 sm:col-span-2 lg:col-span-1">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">Team Members</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                                        {projects.reduce((acc, p) => acc + p.members.length, 0)}
                                    </p>
                                </div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {projects.map((project) => (
                        <Card
                            key={project.id}
                            className="group hover:shadow-lg dark:hover:shadow-emerald-500/10 transition-all border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                        >
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-1">
                                    {project.name}
                                </CardTitle>
                                <CardDescription className="mt-1 line-clamp-2 text-sm dark:text-gray-400">
                                    {project.description || "No description"}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-3 pb-3">
                                <Separator className="dark:bg-gray-800" />

                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-slate-500 dark:text-gray-400" />
                                        <span className="text-slate-600 dark:text-gray-300">{project.members.length} members</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ListTodo className="w-4 h-4 text-slate-500 dark:text-gray-400" />
                                        <span className="text-slate-600 dark:text-gray-300">{project.tasks.length} tasks</span>
                                    </div>
                                </div>

                                {project.deadline && (
                                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-300 bg-slate-50 dark:bg-gray-800 p-2 rounded">
                                        <CalendarIcon className="w-3 h-3" />
                                        <span>Due: {format(new Date(project.deadline), "PP")}</span>
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="pt-3 gap-2 border-t dark:border-gray-800 bg-slate-50/50 dark:bg-gray-800/50">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
                                    onClick={() => setViewing(project)}
                                >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
                                    onClick={() => openForEdit(project)}
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="dark:bg-red-900/50 dark:hover:bg-red-900 dark:border-red-800"
                                    onClick={() => handleDelete(project.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {projects.length === 0 && (
                    <Card className="p-8 sm:p-16 text-center border-2 border-dashed border-slate-300 dark:border-gray-800 bg-white dark:bg-gray-900">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                                <FolderKanban className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400 dark:text-gray-600" />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">No projects yet</h3>
                            <p className="text-sm sm:text-base text-slate-600 dark:text-gray-400 max-w-md">
                                Get started by creating your first project
                            </p>
                            <Button
                                onClick={() => setOpenCreate(true)}
                                className="mt-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create First Project
                            </Button>
                        </div>
                    </Card>
                )}

                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent className="dark:bg-gray-900 dark:border-gray-800">
                        <DialogHeader>
                            <DialogTitle className="dark:text-white">Confirm Delete</DialogTitle>
                            <DialogDescription className="dark:text-gray-400">
                                Are you sure you want to delete this project and all its associated tasks? This action cannot be undone.
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

                <Sheet open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
                    <SheetContent className="w-full p-4 sm:max-w-xl overflow-y-auto dark:bg-gray-900 dark:border-gray-800">
                        <SheetHeader className="pb-4 border-b dark:border-gray-800">
                            <SheetTitle className="text-xl font-bold dark:text-white">{viewing?.name}</SheetTitle>
                        </SheetHeader>
                        {viewing && (
                            <div className="space-y-6 mt-6">
                                <div className="space-y-2 p-3 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-300">
                                        <CalendarIcon className="w-3 h-3" />
                                        <span>Created: {format(new Date(viewing.createdAt), "PP")}</span>
                                    </div>
                                    {viewing.deadline && (
                                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-300">
                                            <CalendarIcon className="w-3 h-3" />
                                            <span>Deadline: {format(new Date(viewing.deadline), "PP")}</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 dark:text-white">
                                        <Users className="w-4 h-4" />
                                        Team Members ({viewing.members.length})
                                    </h3>
                                    {viewing.members.length > 0 ? (
                                        <div className="space-y-2">
                                            {viewing.members.map((m) => (
                                                <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center text-xs font-medium">
                                                        {m.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="text-sm dark:text-gray-200">{m.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500 dark:text-gray-400 text-center py-4">No members</p>
                                    )}
                                </div>

                                <Separator className="dark:bg-gray-800" />

                                <div>
                                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 dark:text-white">
                                        <ListTodo className="w-4 h-4" />
                                        Tasks ({viewing.tasks.length})
                                    </h3>
                                    {viewing.tasks.length > 0 ? (
                                        <div className="space-y-2">
                                            {viewing.tasks.map((tid) => {
                                                const t = tasks.find((x) => x.id === tid);
                                                return (
                                                    <div key={tid} className="p-3 rounded-lg bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 space-y-2">
                                                        <div className="font-medium text-sm dark:text-white">{t?.title || "Unknown"}</div>
                                                        {t && (
                                                            <div className="flex items-center gap-2 text-xs">
                                                                <Badge variant={
                                                                    t.status === "DONE" ? "default" :
                                                                        t.status === "IN_PROGRESS" ? "secondary" :
                                                                            "outline"
                                                                } className="text-xs dark:bg-gray-700 dark:text-gray-200">
                                                                    {t.status}
                                                                </Badge>
                                                                {t.dueDate && (
                                                                    <span className="text-slate-600 dark:text-gray-400">Due: {format(new Date(t.dueDate), "PP")}</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500 dark:text-gray-400 text-center py-4">No tasks</p>
                                    )}
                                </div>

                                <Button
                                    size="lg"
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                                    onClick={() => {
                                        setActiveProjectId(viewing.id);
                                        setViewing(null);
                                    }}
                                >
                                    Close
                                </Button>
                            </div>
                        )}
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}
