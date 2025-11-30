"use client";

import { Calendar, Trash2 } from "lucide-react";
import { useState } from "react";

interface Document {
    id: number;
    documentType: string;
    title?: string | null;
    metadata?: any;
    createdAt: string;
    updatedAt: string;
}

interface DocumentListProps {
    documents: Document[];
    onDelete: (id: number) => void;
}

export default function DocumentList({ documents, onDelete, onView, onEdit }: DocumentListProps & { onView: (doc: Document) => void; onEdit: (doc: Document) => void }) {
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const getDocumentIcon = (type: string) => {
        switch (type.toLowerCase()) {
            case "pdf":
                return "📄";
            case "docx":
                return "📝";
            case "txt":
                return "📃";
            case "faq":
                return "❓";
            default:
                return "📋";
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }).format(date);
    };

    if (documents.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <p>No documents yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {documents.map((doc) => (
                <div
                    key={doc.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer group"
                    onClick={() => onView(doc)}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                            <span className="text-2xl">{getDocumentIcon(doc.documentType)}</span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                        {doc.documentType.toUpperCase()}
                                    </span>
                                </div>
                                <h3 className="text-base font-medium text-gray-900 mb-1">
                                    {doc.title || `Document #${doc.id}`}
                                </h3>
                                {doc.metadata?.pageCount && (
                                    <p className="text-sm text-gray-600 mb-1">
                                        {doc.metadata.pageCount} pages
                                    </p>
                                )}
                                {doc.metadata?.totalQAPairs && (
                                    <p className="text-sm text-gray-600 mb-1">
                                        {doc.metadata.totalQAPairs} Q&A pairs
                                    </p>
                                )}
                                {doc.documentType === "faq" && doc.metadata?.answer && (
                                    <p className="text-sm text-gray-600 mb-1 line-clamp-2">
                                        {doc.metadata.answer}
                                    </p>
                                )}
                                <div className="flex items-center text-xs text-gray-500 mt-2">
                                    <Calendar className="w-3.5 h-3.5 mr-1" />
                                    <span>{formatDate(doc.createdAt)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => onEdit(doc)}
                                className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
                                title="Edit"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-4 h-4"
                                >
                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => {
                                    if (deletingId === doc.id) {
                                        onDelete(doc.id);
                                        setDeletingId(null);
                                    } else {
                                        setDeletingId(doc.id);
                                        setTimeout(() => setDeletingId(null), 3000);
                                    }
                                }}
                                className={`p-2 rounded-lg transition-colors ${deletingId === doc.id
                                    ? "bg-red-500 text-white hover:bg-red-600"
                                    : "text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100"
                                    }`}
                                title={deletingId === doc.id ? "Click again to confirm" : "Delete"}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
