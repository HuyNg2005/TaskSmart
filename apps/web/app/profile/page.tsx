"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@workspace/ui/components/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@workspace/ui/components/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Skeleton } from "@workspace/ui/components/skeleton";
import Image from "next/image";
import { format } from "date-fns";
import { loadLocalProfile, updateLocalProfile } from "@/lib/localProfile";
import { fetchProjects } from "@/api/projects";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Users, FolderKanban, X, ListTodo } from "lucide-react";
import { loadLocalProjects } from "@/lib/localProjects";
import { loadLocalTasks, updateLocalTask } from "@/lib/localTasks";

const createPreviewUrl = (file: File) => URL.createObjectURL(file);

const profileSchema = z.object({
    name: z.string().min(1, "Name is required"),
    dob: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
    position: z.string().min(1, "Position is required"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface LocalProfile {
    id?: string;
    name: string;
    dob: string;
    position: string;
    avatarUrl?: string;
    coverPhotoUrl?: string;
}

export default function ProfilePage() {
    const queryClient = useQueryClient();
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);
    const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null);
    const [previewCoverPhotoUrl, setPreviewCoverPhotoUrl] = useState<string | null>(null);
    const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(null);
    const [originalCoverPhotoUrl, setOriginalCoverPhotoUrl] = useState<string | null>(null);

    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ["profile"],
        queryFn: () => loadLocalProfile(),
    });

    const { data: projects = [], refetch: refetchProjects } = useQuery({
        queryKey: ["projects"],
        queryFn: fetchProjects,
    });

    const updateMutation = useMutation({
        mutationFn: async (data: Partial<LocalProfile>) => {
            return await Promise.resolve(updateLocalProfile(data));
        },
        onSuccess: (updatedProfile: LocalProfile) => {
            queryClient.setQueryData(["profile"], updatedProfile);
            toast.success("Profile updated successfully");
            setIsSheetOpen(false);
            setPreviewAvatarUrl(updatedProfile.avatarUrl || null);
            setPreviewCoverPhotoUrl(updatedProfile.coverPhotoUrl || null);
            setAvatarFile(null);
            setCoverPhotoFile(null);
        },
        onError: (error) => {
            toast.error("Failed to update profile");
            console.error("Update error:", error);
        },
    });

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: "", dob: "", position: "" },
    });

    useEffect(() => {
        if (profile) {
            form.setValue("name", profile.name);
            form.setValue("dob", profile.dob);
            form.setValue("position", profile.position);
            setPreviewAvatarUrl(profile.avatarUrl || null);
            setPreviewCoverPhotoUrl(profile.coverPhotoUrl || null);
            setOriginalAvatarUrl(profile.avatarUrl || null);
            setOriginalCoverPhotoUrl(profile.coverPhotoUrl || null);
        }
    }, [profile, form]);

    useEffect(() => {
        return () => {
            if (previewAvatarUrl && previewAvatarUrl !== originalAvatarUrl) URL.revokeObjectURL(previewAvatarUrl);
            if (previewCoverPhotoUrl && previewCoverPhotoUrl !== originalCoverPhotoUrl) URL.revokeObjectURL(previewCoverPhotoUrl);
        };
    }, [previewAvatarUrl, previewCoverPhotoUrl, originalAvatarUrl, originalCoverPhotoUrl]);

    const onSubmit = async (data: ProfileFormValues) => {
        let updatedData = { ...data };
        try {
            if (avatarFile) {
                const avatarUrl = await uploadAvatar(avatarFile);
                // @ts-ignore
                updatedData = { ...updatedData, avatarUrl };
                setPreviewAvatarUrl(avatarUrl);
                setOriginalAvatarUrl(avatarUrl);
            }
            if (coverPhotoFile) {
                const coverPhotoUrl = await uploadCoverPhoto(coverPhotoFile);
                // @ts-ignore
                updatedData = { ...updatedData, coverPhotoUrl };
                setPreviewCoverPhotoUrl(coverPhotoUrl);
                setOriginalCoverPhotoUrl(coverPhotoUrl);
            }
            updateMutation.mutate(updatedData);
        } catch (error) {
            toast.error("Failed to upload image");
            console.error("Image upload error:", error);
        }
    };

    const onCancel = () => {
        setIsSheetOpen(false);
        setPreviewAvatarUrl(originalAvatarUrl);
        setPreviewCoverPhotoUrl(originalCoverPhotoUrl);
        setAvatarFile(null);
        setCoverPhotoFile(null);
        form.reset({
            name: profile?.name || "",
            dob: profile?.dob || "",
            position: profile?.position || "",
        });
    };

    const uploadAvatar = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
        });
    };

    const uploadCoverPhoto = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
        });
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const previewUrl = createPreviewUrl(file);
            setPreviewAvatarUrl(previewUrl);
        }
    };

    const handleCoverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setCoverPhotoFile(file);
            const previewUrl = createPreviewUrl(file);
            setPreviewCoverPhotoUrl(previewUrl);
        }
    };

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
                        updateLocalTask(task.id, { assignees: newAssignees });
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
                <Skeleton className="h-32 w-full max-w-7xl mx-auto" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8 transition-colors">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white text-center sm:text-left">Profile</h1>
                        <p className="text-sm text-slate-600 dark:text-gray-400 mt-1 text-center sm:text-left">Manage your personal information</p>
                    </div>
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                            <Button
                                size="default"
                                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white w-full sm:w-auto"
                            >
                                <Users className="w-4 h-4 mr-2" />
                                Edit Profile
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="w-full max-w-2xl p-4 sm:p-6 overflow-y-auto dark:bg-gray-900 dark:border-gray-800">
                            <SheetHeader className="pb-4 border-b dark:border-gray-800">
                                <SheetTitle className="text-xl font-bold dark:text-white">Edit Profile</SheetTitle>
                            </SheetHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium dark:text-gray-200">Name *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Enter your name"
                                                        className="h-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-red-500" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="dob"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium dark:text-gray-200">Date of Birth *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="date"
                                                        {...field}
                                                        className="h-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-red-500" />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="position"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium dark:text-gray-200">Position *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Enter your position"
                                                        className="h-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder:text-gray-500"
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-red-500" />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="space-y-2">
                                        <FormLabel className="text-sm font-medium dark:text-gray-200">Profile Photo</FormLabel>
                                        <div className="border-2 border-dashed border-slate-200 dark:border-gray-700 p-6 rounded-lg bg-slate-100 dark:bg-gray-800 text-center">
                                            <input
                                                id="avatar"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleAvatarChange}
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor="avatar"
                                                className="cursor-pointer text-sm font-medium text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200"
                                            >
                                                Click to upload new profile photo
                                            </label>
                                            <p className="text-xs text-slate-500 dark:text-gray-500 mt-2">
                                                Accepted: .jpg, .jpeg, .png, .gif, .webp. Use a square image (min 200x200px).
                                            </p>
                                            {previewAvatarUrl && (
                                                <div className="mt-4">
                                                    <Avatar className="h-24 w-24 mx-auto border-2 border-slate-200 dark:border-gray-700">
                                                        <AvatarImage src={previewAvatarUrl} />
                                                        <AvatarFallback className="bg-slate-200 dark:bg-gray-700 text-slate-800 dark:text-gray-300">
                                                            {profile?.name?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel className="text-sm font-medium dark:text-gray-200">Cover Photo</FormLabel>
                                        <div className="border-2 border-dashed border-slate-200 dark:border-gray-700 p-6 rounded-lg bg-slate-100 dark:bg-gray-800 text-center">
                                            <input
                                                id="coverPhoto"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleCoverPhotoChange}
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor="coverPhoto"
                                                className="cursor-pointer text-sm font-medium text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200"
                                            >
                                                Click to upload new cover photo
                                            </label>
                                            <p className="text-xs text-slate-500 dark:text-gray-500 mt-2">
                                                Accepted: .jpg, .jpeg, .png, .gif, .webp. Recommended size: 820x312px.
                                            </p>
                                            {previewCoverPhotoUrl && (
                                                <div className="mt-4 relative h-32 w-full">
                                                    <Image
                                                        src={previewCoverPhotoUrl || "/images/anhcover.jpg"}
                                                        alt="Cover photo preview"
                                                        fill
                                                        className="object-cover rounded-lg"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={onCancel}
                                            className="w-full dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={updateMutation.isPending}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                                        >
                                            {updateMutation.isPending ? "Saving..." : "Save Changes"}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </SheetContent>
                    </Sheet>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <Card className="border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 sm:col-span-2 lg:col-span-2 relative overflow-hidden">
                        <div
                            className="h-32 sm:h-40 w-full bg-gradient-to-r from-emerald-400 to-blue-500 dark:from-emerald-600 dark:to-blue-700"
                            style={{
                                backgroundImage: previewCoverPhotoUrl || profile?.coverPhotoUrl ? `url(${previewCoverPhotoUrl || profile?.coverPhotoUrl || "/images/anhcover.jpg"})` : undefined,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                            }}
                        />
                        <div className="relative px-4 sm:px-6 pt-4 pb-6">
                            <div className="flex items-end gap-4">
                                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 -mt-12 border-4 border-white dark:border-gray-900 shadow-lg">
                                    <AvatarImage src={previewAvatarUrl || profile?.avatarUrl || undefined} />
                                    <AvatarFallback className="bg-emerald-500 dark:bg-emerald-600 text-white text-xl font-semibold">
                                        {profile?.name?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                                        {profile?.name}
                                    </h2>
                                    <Button
                                        size="sm"
                                        onClick={() => setIsSheetOpen(true)}
                                        className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white px-4 py-1.5"
                                    >
                                        <Users className="w-4 h-4 mr-2" />
                                        Edit Profile
                                    </Button>
                                </div>
                            </div>
                            <div className="mt-4 space-y-2">
                                <p className="text-sm text-slate-600 dark:text-gray-300">
                                    <span className="font-medium">Date of Birth:</span>{" "}
                                    {profile?.dob ? format(new Date(profile.dob), "PPP") : "Not set"}
                                </p>
                                <p className="text-sm text-slate-600 dark:text-gray-300">
                                    <span className="font-medium">Position:</span> {profile?.position}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                        <CardContent className="p-4 sm:p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-400">Managed Projects</p>
                                    <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">{managedProjects.length}</p>
                                </div>
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                                    <FolderKanban className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 dark:text-emerald-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 sm:col-span-2 lg:col-span-3">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Managed Projects</CardTitle>
                            <CardDescription className="mt-1 text-sm dark:text-gray-400">Projects you are managing</CardDescription>
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
                                                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-1">
                                                        {proj.name}
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent className="px-4 pb-4 space-y-4">
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                                            <Users className="w-4 h-4" />
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
                                                                        <X className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                            {proj.members.length === 0 && (
                                                                <p className="text-sm text-slate-500 dark:text-gray-400 italic">No members yet</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                                            <ListTodo className="w-4 h-4" />
                                                            Tasks ({projectTasks.length})
                                                        </p>
                                                        <div className="space-y-2">
                                                            {projectTasks.length > 0 ? (
                                                                projectTasks.map((task) => (
                                                                    <div
                                                                        key={task.id}
                                                                        className="p-2 rounded-lg bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 space-y-1"
                                                                    >
                                                                        <div className="font-medium text-sm dark:text-white">{task.title}</div>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {task.assignees.map((a) => (
                                                                                <div
                                                                                    key={a.id}
                                                                                    className="flex items-center gap-2 px-2 py-1 bg-slate-100 dark:bg-gray-800 rounded-full text-xs font-medium text-slate-700 dark:text-gray-300"
                                                                                >
                                                                                    <Avatar className="h-6 w-6">
                                                                                        <AvatarFallback className="bg-emerald-600 dark:bg-emerald-500 text-white text-xs font-medium">
                                                                                            {a.name.charAt(0).toUpperCase()}
                                                                                        </AvatarFallback>
                                                                                    </Avatar>
                                                                                    <span>{a.name}</span>
                                                                                </div>
                                                                            ))}
                                                                            {task.assignees.length === 0 && (
                                                                                <p className="text-xs text-slate-500 dark:text-gray-400 italic">No assignees</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p className="text-sm text-slate-500 dark:text-gray-400 italic">No tasks yet</p>
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
                                    <FolderKanban className="w-10 h-10 mx-auto text-slate-400 dark:text-gray-600" />
                                    <p className="mt-4 text-sm text-slate-600 dark:text-gray-400">No projects assigned</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}