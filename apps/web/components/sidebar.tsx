"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ListTodo, User, Sun, Moon, Menu, X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Avatar, AvatarFallback, AvatarImage } from "@workspace/ui/components/avatar";
import { Separator } from "@workspace/ui/components/separator";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export function Sidebar() {
    const pathname = usePathname();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isActive = (path: string) => pathname === path;

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light");
    };

    const closeSidebar = () => {
        setIsOpen(false);
    };

    if (!mounted) return null;

    const menuItems = [
        { href: "/projects", icon: LayoutDashboard, label: "Projects" },
        { href: "/tasks", icon: ListTodo, label: "Tasks" },
        { href: "/profile", icon: User, label: "Profile" },
    ];

    return (
        <>

            <Button
                variant="ghost"
                size="icon"
                className="fixed  top-4 left-4 z-50 lg:hidden bg-[#1a4d2e] dark:bg-gray-900 text-white hover:bg-[#1a4d2e]/90 dark:hover:bg-gray-800 border-0 dark:border dark:border-gray-700"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>


            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-40 lg:hidden"
                    onClick={closeSidebar}
                />
            )}


            <div
                className={`
                    fixed lg:static inset-y-0 left-0 z-40
                    w-64 sm:w-72 md:w-64
                    h-screen 
                    bg-gradient-to-b from-[#1a4d2e] to-[#0f2818] 
                    dark:from-gray-900 dark:via-gray-900 dark:to-gray-950
                    dark:border-r dark:border-gray-800
                    text-white 
                    flex flex-col
                    transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >

                <div className="p-4 sm:p-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#4ade80] dark:bg-gradient-to-br dark:from-emerald-400 dark:to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 dark:shadow-lg dark:shadow-emerald-500/30">
                            <span className="text-[#1a4d2e] dark:text-white font-bold text-lg">T</span>
                        </div>
                        <span className="text-lg sm:text-xl font-bold truncate dark:bg-gradient-to-r dark:from-white dark:to-gray-300 dark:bg-clip-text dark:text-transparent">
                            TaskBoardX
                        </span>
                    </div>
                </div>

                <Separator className="bg-white/10 dark:bg-gray-800" />


                <div className="flex-1 px-3 sm:px-4 py-4 sm:py-6 overflow-y-auto">
                    <div className="space-y-1">
                        <div className="text-xs font-semibold text-white/50 dark:text-gray-500 uppercase tracking-wider px-3 mb-3">
                            Menu
                        </div>
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);
                            return (
                                <Link key={item.href} href={item.href} onClick={closeSidebar}>
                                    <Button
                                        variant={active ? "default" : "ghost"}
                                        className={`
                                            w-full justify-start gap-3 transition-all duration-200
                                            ${active
                                            ? 'bg-[#4ade80] dark:bg-gradient-to-r dark:from-emerald-500 dark:to-emerald-600 text-[#1a4d2e] dark:text-white hover:bg-[#4ade80]/90 dark:hover:from-emerald-600 dark:hover:to-emerald-700 font-semibold shadow-lg dark:shadow-emerald-500/30'
                                            : 'text-white/70 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-gray-800/50 hover:text-white'
                                        }
                                        `}
                                    >
                                        <Icon className="w-5 h-5 flex-shrink-0" />
                                        <span className="text-sm truncate">{item.label}</span>
                                    </Button>
                                </Link>
                            );
                        })}
                    </div>


                    <div className="mt-6 sm:mt-8 space-y-1">
                        <div className="text-xs font-semibold text-white/50 dark:text-gray-500 uppercase tracking-wider px-3 mb-3">
                            General
                        </div>
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 text-white/70 dark:text-gray-400 hover:bg-white/10 dark:hover:bg-gray-800/50 hover:text-white transition-all duration-200"
                            onClick={toggleTheme}
                        >
                            {theme === "light" ? (
                                <Sun className="w-5 h-5 flex-shrink-0" />
                            ) : (
                                <Moon className="w-5 h-5 flex-shrink-0" />
                            )}
                            <span className="text-sm truncate">{theme === "light" ? "Light Mode" : "Dark Mode"}</span>
                        </Button>
                    </div>
                </div>

                <Separator className="bg-white/10 dark:bg-gray-800" />

                <div className="p-3 sm:p-4">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 dark:bg-gray-800/50 dark:hover:bg-gray-800 dark:border dark:border-gray-700/50 transition-all duration-200 cursor-pointer">
                        <Avatar className="w-10 h-10 border-2 border-[#4ade80] dark:border-emerald-500 flex-shrink-0 dark:shadow-lg dark:shadow-emerald-500/20">
                            <AvatarImage src="" />
                            <AvatarFallback className="bg-gradient-to-br from-[#4ade80] to-[#22c55e] dark:from-emerald-400 dark:to-emerald-600 text-[#1a4d2e] dark:text-white font-semibold">
                                LD
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white truncate">Leader</div>
                            <div className="text-xs text-white/50 dark:text-gray-400 truncate">leader@taskboard.com</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}