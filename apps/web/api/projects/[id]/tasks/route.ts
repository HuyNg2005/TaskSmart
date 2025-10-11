import { NextResponse } from "next/server";
import { loadLocalTasks } from "@/lib/localTasks";

export async function GET(request: Request, { params }: { params: { id: string } }) {
    const tasks = loadLocalTasks().filter((t) => t.projectId === params.id);
    return NextResponse.json(tasks);
}