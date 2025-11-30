"use client";

import { FileText } from "lucide-react";

export default function Sidebar() {
    return (
        <aside className="w-64 h-screen bg-white border-r border-gray-200">
            <div className="p-6">
                <h1 className="text-xl font-semibold text-gray-900">Knowledge Base</h1>
            </div>
            <nav className="px-3">
                <div className="flex items-center space-x-3 px-3 py-2 bg-gray-100 rounded-lg">
                    <FileText className="w-5 h-5 text-gray-700" />
                    <span className="text-sm font-medium text-gray-900">Knowledge Base</span>
                </div>
            </nav>
        </aside>
    );
}
