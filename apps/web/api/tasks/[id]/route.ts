import { NextResponse } from "next/server";
import { updateLocalTask } from "@/lib/localTasks";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    const data = await request.json();
    updateLocalTask(params.id, data);
    return NextResponse.json({ success: true });
}