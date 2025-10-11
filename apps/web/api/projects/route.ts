import { NextResponse } from "next/server";
import { loadLocalProjects, saveLocalProjects } from "@/lib/localProjects";

export async function GET() {
    const projects = loadLocalProjects();
    return NextResponse.json(projects);
}