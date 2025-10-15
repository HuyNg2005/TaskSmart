import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@workspace/ui/components/dialog";
import {Button} from "@workspace/ui/components/button";
import {Calendar as CalendarIcon, Plus, X} from "lucide-react";
import {Label} from "@workspace/ui/components/label";
import {Input} from "@workspace/ui/components/input";
import {Textarea} from "@workspace/ui/components/textarea";
import {Popover, PopoverContent, PopoverTrigger} from "@workspace/ui/components/popover";
import {format, isBefore, startOfDay} from "date-fns";
import {Calendar} from "@workspace/ui/components/calendar";
import {Badge} from "@workspace/ui/components/badge";
import {toast} from "sonner";
import {useEffect,  useState} from "react";
import {
    addLocalProject,
    loadLocalProjects,
    LocalProject,
    updateLocalProject
} from "@/lib/localProjects";
import {v4 as uuidv4} from "uuid";
import {loadLocalTasks, updateLocalTask} from "@/lib/localTasks";


type ProjectForm = {
    name: string;
    description?: string;
    deadline?: Date | undefined;
};
export default function ProjectHeader() {
    const [projects, setProjects] = useState<LocalProject[]>([]);
    const [openCreate, setOpenCreate] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [inviteName, setInviteName] = useState("");
    const [inviteList, setInviteList] = useState<{ id: string; name: string }[]>([]);
    const [selectedDeadline, setSelectedDeadline] = useState<Date | undefined>(undefined);
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


    return (
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
    )
}