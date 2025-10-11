import { loadLocalProjects } from "@/lib/localProjects";

export async function fetchProjects() {
    return loadLocalProjects();
}