"use client";

import { Calendar, Trash2, FileText, FileType, FileCode, HelpCircle, File } from "lucide-react";
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
        const iconClass = "w-6 h-6";
        switch (type.toLowerCase()) {
            case "pdf":
                return <File className={`${iconClass} text-blue-500`} />;
            case "docx":
                return <FileText className={`${iconClass} text-green-500`} />;
            case "txt":
                return <FileType className={`${iconClass} text-gray-500`} />;
            case "faq":
                return <HelpCircle className={`${iconClass} text-purple-500`} />;
            default:
                return <File className={`${iconClass} text-red-500`} />;
        }
    };

    const getDocumentTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case "pdf":
                return "bg-blue-100 text-blue-800";
            case "docx":
                return "bg-green-100 text-green-800";
            case "txt":
                return "bg-gray-100 text-gray-800";
            case "faq":
                return "bg-purple-100 text-purple-800";
            default:
                return "bg-red-100 text-red-800";
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
        <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
            {documents.map((doc) => (
                <div
                    key={doc.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors cursor-pointer group"
                    onClick={() => onView(doc)}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                            <div className="flex items-center justify-center">{getDocumentIcon(doc.documentType)}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getDocumentTypeColor(doc.documentType)}`}>
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
                                onClick={() => onDelete(doc.id)}
                                className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete"
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
