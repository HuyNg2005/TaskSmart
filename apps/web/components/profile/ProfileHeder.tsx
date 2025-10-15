"use client";

import ProfileForm from "@/components/profile/ProfileForm";

export default function ProfileHeader() {

    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white text-center sm:text-left">Profile</h1>
                <p className="text-sm text-slate-600 dark:text-gray-400 mt-1 text-center sm:text-left">Manage your personal information</p>
            </div>
          <ProfileForm />
        </div>
    );
}
