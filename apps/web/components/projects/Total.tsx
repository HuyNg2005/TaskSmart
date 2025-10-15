import {Card, CardContent} from "@workspace/ui/components/card";
import {FolderKanban, ListTodo, Users} from "lucide-react";
import {useEffect, useState} from "react";
import { loadLocalProjects, LocalProject} from "@/lib/localProjects";


export default function Total(){
    const [projects, setProjects] = useState<LocalProject[]>([]);

    useEffect(() => {
        setProjects(loadLocalProjects());
    }, []);


    return(
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
    )
}