
export interface LocalTask {
    id: string;
    title: string;
    description?: string;
    status: "TODO" | "IN_PROGRESS" | "DONE";
    createdAt: string;
    dueDate?: string;
    projectId: string;
    assignees: { id: string; name: string }[];
}

const TASKS_LS = "tbx:tasks_v1";

export function loadLocalTasks(): LocalTask[] {
    try {
        const raw = localStorage.getItem(TASKS_LS);
        if (!raw) return [];
        return JSON.parse(raw) as LocalTask[];
    } catch {
        return [];
    }
}

export function saveLocalTasks(tasks: LocalTask[]) {
    localStorage.setItem(TASKS_LS, JSON.stringify(tasks));
}

export function addLocalTask(t: LocalTask) {
    const arr = loadLocalTasks();
    arr.push(t);
    saveLocalTasks(arr);
}

export function updateLocalTask(id: string, patch: Partial<LocalTask>) {
    const arr = loadLocalTasks();
    const idx = arr.findIndex((x) => x.id === id);
    if (idx === -1) return;
    // @ts-ignore
    arr[idx] = { ...arr[idx], ...patch, updatedAt: new Date().toISOString() };
    saveLocalTasks(arr);
}

export function deleteLocalTask(id: string) {
    const arr = loadLocalTasks().filter((t) => t.id !== id);
    saveLocalTasks(arr);
}
