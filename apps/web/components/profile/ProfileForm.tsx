"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import {Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger} from "@workspace/ui/components/sheet";
import {Users} from "lucide-react";
import {Avatar, AvatarFallback, AvatarImage} from "@workspace/ui/components/avatar";
import Image from "next/image";
import {useEffect, useState} from "react";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {loadLocalProfile, updateLocalProfile} from "@/lib/localProfile";
import {fetchProjects} from "@/api/projects";
import {toast} from "sonner";

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

export default function ProfileForm() {
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


    return (
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
    );
}
