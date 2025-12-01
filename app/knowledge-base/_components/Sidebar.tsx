"use client";

import { FileText, ChevronLeft, ChevronRight } from "lucide-react";

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    return (
        <aside className={`${isCollapsed ? 'w-16' : 'w-56'} h-screen bg-white border-r border-gray-200 transition-all duration-300`}>
            <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {!isCollapsed && <h1 className="text-lg font-semibold text-gray-900">Knowledge Base</h1>}
                <button
                    onClick={onToggle}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    ) : (
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    )}
                </button>
            </div>
            <nav className="px-3">
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 bg-gray-100 rounded-lg`}>
                    <FileText className="w-5 h-5 text-gray-700" />
                    {!isCollapsed && <span className="text-sm font-medium text-gray-900">Knowledge Base</span>}
                </div>
            </nav>
        </aside>
    );
}
