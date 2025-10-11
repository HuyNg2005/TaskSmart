export type ProjectMember = { id: string; name: string };
export type LocalProject = {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    deadline?: string;
    managerId: string;
    members: ProjectMember[];
    tasks: string[];
};

const LS_KEY = "tbx:projects_v1";

export function loadLocalProjects(): LocalProject[] {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) {
            const defaultProjects: LocalProject[] = [
                {
                    id: `proj-${Date.now()}`,
                    name: "Sample Project",
                    description: "A sample project for testing",
                    createdAt: new Date().toISOString(),
                    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                    managerId: "leader-1",
                    members: [
                        { id: "leader-1", name: "Leader" },
                        { id: "member-2", name: "Member" },
                    ],
                    tasks: [],
                },
            ];
            saveLocalProjects(defaultProjects);
            return defaultProjects;
        }
        return JSON.parse(raw) as LocalProject[];
    } catch {
        return [];
    }
}

export function saveLocalProjects(projects: LocalProject[]) {
    localStorage.setItem(LS_KEY, JSON.stringify(projects));
}

export function addLocalProject(p: LocalProject) {
    const list = loadLocalProjects();
    list.push(p);
    saveLocalProjects(list);
}

export function updateLocalProject(id: string, patch: Partial<LocalProject>) {
    const list = loadLocalProjects();
    const idx = list.findIndex((x) => x.id === id);
    if (idx === -1) return;
    list[idx] = { ...list[idx], ...patch, updatedAt: new Date().toISOString() } as LocalProject;
    saveLocalProjects(list);
}

export function deleteLocalProject(id: string) {
    const list = loadLocalProjects().filter((p) => p.id !== id);
    saveLocalProjects(list);
}