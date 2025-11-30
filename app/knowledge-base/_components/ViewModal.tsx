"use client";

import { X, FileText } from "lucide-react";

interface Document {
    id: number;
    documentType: string;
    title?: string | null;
    metadata?: any;
    createdAt: string;
    updatedAt: string;
}

interface ViewModalProps {
    isOpen: boolean;
    document: Document | null;
    onClose: () => void;
}

export default function ViewModal({ isOpen, document, onClose, onEdit }: ViewModalProps & { onEdit?: (doc: Document) => void }) {
    if (!isOpen || !document) return null;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-slide-in shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white z-10 rounded-t-2xl px-6 py-4 flex items-center justify-between border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {document.title || `Document #${document.id}`}
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">Document Details</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        {onEdit && (
                            <button
                                onClick={() => onEdit(document)}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                                title="Edit"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                                </svg>
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Document Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs font-medium text-gray-500 mb-1">Document Type</p>
                            <p className="font-semibold text-gray-900">
                                {document.documentType.toUpperCase()}
                            </p>
                        </div>
                        {/* <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs font-medium text-gray-500 mb-1">Document ID</p>
                            <p className="font-semibold text-gray-900">#{document.id}</p>
                        </div> */}
                        {/* <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs font-medium text-gray-500 mb-1">Created At</p>
                            <p className="text-sm text-gray-900">{formatDate(document.createdAt)}</p>
                        </div> */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                            <p className="text-xs font-medium text-gray-500 mb-1">Updated At</p>
                            <p className="text-sm text-gray-900">{formatDate(document.updatedAt)}</p>
                        </div>
                    </div>

                    {/* Metadata */}
                    {document.metadata && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">Document Content</h3>

                            {/* For PDF/DOCX/TXT */}
                            {(document.documentType === 'pdf' || document.documentType === 'docx' || document.documentType === 'txt') && (
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                    {document.metadata?.rawText ? (
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 mb-2">Full Document Text</p>
                                            <div className="bg-white rounded-lg p-4 max-h-[50vh] overflow-y-auto border border-gray-200">
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                                    {document.metadata.rawText}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No text content available.</p>
                                    )}
                                </div>
                            )}

                            {/* For FAQ */}
                            {document.metadata.qaPairs && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-gray-700">
                                            Q&A Pairs
                                        </span>
                                        <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-bold">
                                            {document.metadata.totalQAPairs || document.metadata.qaPairs.length}
                                        </span>
                                    </div>
                                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                        {document.metadata.qaPairs.map((pair: any, index: number) => (
                                            <div key={index} className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100">
                                                <div className="flex items-start space-x-2">
                                                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-bold">
                                                        Q
                                                    </span>
                                                    <p className="text-sm font-semibold text-gray-900 flex-1">
                                                        {pair.question}
                                                    </p>
                                                </div>
                                                <div className="flex items-start space-x-2">
                                                    <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-xs font-bold">
                                                        A
                                                    </span>
                                                    <p className="text-sm text-gray-700 flex-1">{pair.answer}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Single FAQ (if structure is different) */}
                            {document.metadata.question && document.metadata.answer && (
                                <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100">
                                    <div className="flex items-start space-x-2">
                                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-bold">
                                            Q
                                        </span>
                                        <p className="text-sm font-semibold text-gray-900 flex-1">
                                            {document.metadata.question}
                                        </p>
                                    </div>
                                    <div className="flex items-start space-x-2">
                                        <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-xs font-bold">
                                            A
                                        </span>
                                        <p className="text-sm text-gray-700 flex-1">{document.metadata.answer}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 rounded-b-2xl px-6 py-4 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
