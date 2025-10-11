import { NextResponse } from "next/server";
import { addLocalTask } from "@/lib/localTasks";
import { loadLocalProjects, saveLocalProjects } from "@/lib/localProjects";

export async function POST(request: Request) {
    const data = await request.json();
    const newTask = { ...data, id: `task-${Date.now()}`, createdAt: new Date().toISOString() };
    addLocalTask(newTask);

    const projects = loadLocalProjects();
    const projectIndex = projects.findIndex((p) => p.id === newTask.projectId);
    if (projectIndex !== -1) {
        // @ts-ignore
        projects[projectIndex].tasks.push(newTask.id);
        saveLocalProjects(projects);
    }

    return NextResponse.json(newTask);
}