export type LocalProfile = {
    id: string;
    name: string;
    dob: string;
    position: string;
    avatarUrl?: string;
    coverPhotoUrl?: string;
};

const LS_KEY = "tbx:profile_v1";

export function loadLocalProfile(): LocalProfile {
    const defaultProfile: LocalProfile = {
        id: "leader-1",
        name: "",
        dob: "",
        position: "",
        avatarUrl: undefined,
        coverPhotoUrl: undefined,
    };

    try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) {
            saveLocalProfile(defaultProfile);
            return defaultProfile;
        }
        return JSON.parse(raw) as LocalProfile;
    } catch {
        saveLocalProfile(defaultProfile);
        return defaultProfile;
    }
}

export function updateLocalProfile(patch: Partial<LocalProfile>): LocalProfile {
    const current = loadLocalProfile();
    const updated = { ...current, ...patch };
    saveLocalProfile(updated);
    return updated;
}

function saveLocalProfile(profile: LocalProfile) {
    localStorage.setItem(LS_KEY, JSON.stringify(profile));
}