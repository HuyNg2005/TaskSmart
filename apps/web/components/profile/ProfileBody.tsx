import {Card} from "@workspace/ui/components/card";
import {Avatar, AvatarFallback, AvatarImage} from "@workspace/ui/components/avatar";
import {format} from "date-fns";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {useEffect, useState} from "react";
import {loadLocalProfile, updateLocalProfile} from "@/lib/localProfile";
import {fetchProjects} from "@/api/projects";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {z} from "zod";
import ProfileForm from "@/components/profile/ProfileForm";



interface LocalProfile {
    id?: string;
    name: string;
    dob: string;
    position: string;
    avatarUrl?: string;
    coverPhotoUrl?: string;
}
export default function ProfileBody() {
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null);
    const [previewCoverPhotoUrl, setPreviewCoverPhotoUrl] = useState<string | null>(null);
    const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(null);
    const [originalCoverPhotoUrl, setOriginalCoverPhotoUrl] = useState<string | null>(null);

    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ["profile"],
        queryFn: () => loadLocalProfile(),
    });

    useEffect(() => {
        return () => {
            if (previewAvatarUrl && previewAvatarUrl !== originalAvatarUrl) URL.revokeObjectURL(previewAvatarUrl);
            if (previewCoverPhotoUrl && previewCoverPhotoUrl !== originalCoverPhotoUrl) URL.revokeObjectURL(previewCoverPhotoUrl);
        };
    }, [previewAvatarUrl, previewCoverPhotoUrl, originalAvatarUrl, originalCoverPhotoUrl]);


    return (
        <Card
            className="border border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-900 sm:col-span-2 lg:col-span-2 relative overflow-hidden">
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
                    <Avatar
                        className="h-24 w-24 sm:h-28 sm:w-28 -mt-12 border-4 border-white dark:border-gray-900 shadow-lg">
                        <AvatarImage src={previewAvatarUrl || profile?.avatarUrl || undefined}/>
                        <AvatarFallback className="bg-emerald-500 dark:bg-emerald-600 text-white text-xl font-semibold">
                            {profile?.name?.[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                            {profile?.name}
                        </h2>
                        <ProfileForm/>
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
    )
}