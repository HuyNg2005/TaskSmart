import { NextResponse } from "next/server";
import { loadLocalProjects } from "@/lib/localProjects";

export async function GET() {
    const users = loadLocalProjects().flatMap((p) => p.members);
    return NextResponse.json(users);
}