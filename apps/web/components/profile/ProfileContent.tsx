"use client";

import ProfileHeader from "@/components/profile/ProfileHeder";
import ProfileBody from "@/components/profile/ProfileBody";
import ManagedProjects from "@/components/profile/ ManagedProjects";


export default function ProfilePage() {

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 p-4 sm:p-6 lg:p-8 transition-colors">
            <div className="max-w-7xl mx-auto space-y-6">

                <ProfileHeader/>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <ProfileBody/>
                    <ManagedProjects/>
                </div>
            </div>
        </div>
    );
}