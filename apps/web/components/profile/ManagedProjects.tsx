import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@workspace/ui/components/card";
import {FolderKanban, ListTodo, Users, X} from "lucide-react";
import {loadLocalTasks, updateLocalTask} from "@/lib/localTasks";
import {Button} from "@workspace/ui/components/button";
import {Avatar, AvatarFallback} from "@workspace/ui/components/avatar";
import {z} from "zod";
import {useEffect, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {loadLocalProfile} from "@/lib/localProfile";
import {fetchProjects} from "@/api/projects";
import {loadLocalProjects} from "@/lib/localProjects";
import {toast} from "sonner";
import {Skeleton} from "@workspace/ui/components/skeleton";


const profileSchema = z.object({
    name: z.string().min(1, "Name is required"),
    dob: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
    position: z.string().min(1, "Position is required"),
});


export default function ManagedProjects() {
    const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null);
    const [previewCoverPhotoUrl, setPreviewCoverPhotoUrl] = useState<string | null>(null);
    const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(null);
    const [originalCoverPhotoUrl, setOriginalCoverPhotoUrl] = useState<string | null>(null);

    const {data: profile, isLoading: profileLoading} = useQuery({
        queryKey: ["profile"],
        queryFn: () => loadLocalProfile(),
    });

    const {data: projects = [], refetch: refetchProjects} = useQuery({
        queryKey: ["projects"],
        queryFn: fetchProjects,
    });


    useEffect(() => {
        return () => {
            if (previewAvatarUrl && previewAvatarUrl !== originalAvatarUrl) URL.revokeObjectURL(previewAvatarUrl);
            if (previewCoverPhotoUrl && previewCoverPhotoUrl !== originalCoverPhotoUrl) URL.revokeObjectURL(previewCoverPhotoUrl);
        };
    }, [previewAvatarUrl, previewCoverPhotoUrl, originalAvatarUrl, originalCoverPhotoUrl]);


    const handleRemoveMember = (projectId: string, memberId: string) => {
        const localProjects = loadLocalProjects();
        const projectIndex = localProjects.findIndex((p) => p.id === projectId);
        if (projectIndex === -1) return;

        const project = localProjects[projectIndex];
        if (project) {
            project.members = project.members.filter((m) => m.id !== memberId);
            localStorage.setItem("tbx:projects_v1", JSON.stringify(localProjects));

            const localTasks = loadLocalTasks();
            localTasks.forEach((task) => {
                if (task.projectId === projectId) {
                    const newAssignees = task.assignees.filter((a) => a.id !== memberId);
                    if (newAssignees.length < task.assignees.length) {
                        updateLocalTask(task.id, {assignees: newAssignees});
                    }
                }
            });

            toast.success("Member removed from project");
            refetchProjects();
        }
    };

    const managedProjects = projects.filter((p) => p.managerId === profile?.id);

    if (profileLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8 transition-colors">
                <Skeleton className="h-32 w-full max-w-7xl mx-auto"/>
            </div>
        );
    }
    return (
<>
    <Card className="border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">Managed Projects</p>
                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">{managedProjects.length}</p>
                </div>
                <div
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <FolderKanban className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400"/>
                </div>
            </div>
        </CardContent>
    </Card>
    <Card className=" border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 sm:col-span-2 lg:col-span-3 ">
        <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Managed
                Projects</CardTitle>
            <CardDescription className="mt-1 text-sm dark:text-gray-400">Projects you are
                managing</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
            {managedProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {managedProjects.map((proj) => {
                        const projectTasks = loadLocalTasks().filter((t) => t.projectId === proj.id);
                        return (
                            <Card
                                key={proj.id}
                                className="group hover:shadow-lg dark:hover:shadow-emerald-500/10 transition-all border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                            >
                                <CardHeader className="pb-3">
                                    <CardTitle
                                        className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-1">
                                        {proj.name}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-4 space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                            <Users className="w-4 h-4"/>
                                            Members ({proj.members.length})
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {proj.members.map((m) => (
                                                <div
                                                    key={m.id}
                                                    className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-gray-800 rounded-full text-xs font-medium text-slate-700 dark:text-gray-300"
                                                >
                                                    {m.name}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-4 w-4 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                        onClick={() => handleRemoveMember(proj.id, m.id)}
                                                    >
                                                        <X className="h-3 w-3"/>
                                                    </Button>
                                                </div>
                                            ))}
                                            {proj.members.length === 0 && (
                                                <p className="text-sm text-slate-500 dark:text-gray-400 italic">No
                                                    members yet</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                            <ListTodo className="w-4 h-4"/>
                                            Tasks ({projectTasks.length})
                                        </p>
                                        <div className="space-y-2">
                                            {projectTasks.length > 0 ? (
                                                projectTasks.map((task) => (
                                                    <div
                                                        key={task.id}
                                                        className="p-2 rounded-lg bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 space-y-1"
                                                    >
                                                        <div
                                                            className="font-medium text-sm dark:text-white">{task.title}</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {task.assignees.map((a) => (
                                                                <div
                                                                    key={a.id}
                                                                    className="flex items-center gap-2 px-2 py-1 bg-slate-100 dark:bg-gray-800 rounded-full text-xs font-medium text-slate-700 dark:text-gray-300"
                                                                >
                                                                    <Avatar className="h-6 w-6">
                                                                        <AvatarFallback
                                                                            className="bg-emerald-600 dark:bg-emerald-500 text-white text-xs font-medium">
                                                                            {a.name.charAt(0).toUpperCase()}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span>{a.name}</span>
                                                                </div>
                                                            ))}
                                                            {task.assignees.length === 0 && (
                                                                <p className="text-xs text-slate-500 dark:text-gray-400 italic">No
                                                                    assignees</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-slate-500 dark:text-gray-400 italic">No
                                                    tasks yet</p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-8">
                    <FolderKanban className="w-10 h-10 mx-auto text-slate-400 dark:text-gray-600"/>
                    <p className="mt-4 text-sm text-slate-600 dark:text-gray-400">No projects assigned</p>
                </div>
            )}
        </CardContent>
    </Card>
</>
    )
}