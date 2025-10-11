import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";
import {Toaster} from "sonner";
import "@workspace/ui/globals.css"
import QueryClientProviderWrapper from "@/components/QueryClientProviderWrapper";
import { ThemeProvider } from "next-themes";

export const metadata: Metadata = {
    title: "TaskBoardX – Smart Workflow & Task Dashboard",
    description: "A Trello-like kanban board system for managing projects, tasks, and workflow progress.",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-background">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <QueryClientProviderWrapper>
                <div className="flex h-screen">
                    <Sidebar />
                    <main className="flex-1 overflow-auto">{children}</main>
                </div>
                <Toaster />
            </QueryClientProviderWrapper>
        </ThemeProvider>
        </body>
        </html>
    );
}