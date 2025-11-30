"use client";

import { X, Upload, Plus, Minus } from "lucide-react";
import { useState, useEffect } from "react";

interface Document {
    id: number;
    documentType: string;
    title?: string | null;
    metadata?: any;
}

interface EditModalProps {
    isOpen: boolean;
    document: Document | null;
    onClose: () => void;
    onSubmit: (id: number, data: any) => Promise<void>;
}

export default function EditModal({ isOpen, document, onClose, onSubmit }: EditModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [faqPairs, setFaqPairs] = useState<{ question: string; answer: string }[]>([
        { question: "", answer: "" },
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (document?.documentType === "faq") {
            if (document.metadata?.qaPairs) {
                setFaqPairs(document.metadata.qaPairs);
            } else if (document.metadata?.question && document.metadata?.answer) {
                setFaqPairs([{ question: document.metadata.question, answer: document.metadata.answer }]);
            }
        }
    }, [document]);

    if (!isOpen || !document) return null;

    const handleAddFaqPair = () => {
        setFaqPairs([...faqPairs, { question: "", answer: "" }]);
    };

    const handleRemoveFaqPair = (index: number) => {
        if (faqPairs.length > 1) {
            setFaqPairs(faqPairs.filter((_, i) => i !== index));
        }
    };

    const handleFaqChange = (index: number, field: "question" | "answer", value: string) => {
        const updated = [...faqPairs];
        updated[index][field] = value;
        setFaqPairs(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            if (document.documentType === "faq") {
                await onSubmit(document.id, {
                    documentType: document.documentType,
                    records: faqPairs.filter((pair) => pair.question && pair.answer),
                });
            } else {
                if (!file) {
                    alert("Please select a file");
                    return;
                }
                await onSubmit(document.id, {
                    documentType: document.documentType,
                    file,
                });
            }
            handleClose();
        } catch (error) {
            console.error("Update failed:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setFaqPairs([{ question: "", answer: "" }]);
        setIsSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-in shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-white z-10 rounded-t-2xl px-6 py-4 flex items-center justify-between border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Edit Document</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {document.title || `Document #${document.id}`}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Document Type Display */}
                    <div className="flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-sm font-medium text-gray-600">Document Type:</span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                            {document.documentType.toUpperCase()}
                        </span>
                    </div>

                    {/* File Upload for PDF/DOCX/TXT */}
                    {document.documentType !== "faq" && (
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Upload Replacement File
                            </label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept={
                                        document.documentType === "pdf"
                                            ? ".pdf"
                                            : document.documentType === "docx"
                                                ? ".docx"
                                                : ".txt"
                                    }
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="hidden"
                                    id="edit-file-upload"
                                />
                                <label
                                    htmlFor="edit-file-upload"
                                    className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 transition-colors cursor-pointer bg-blue-50/50 hover:bg-blue-50"
                                >
                                    <Upload className="w-12 h-12 text-blue-500 mb-2" />
                                    <span className="text-sm font-medium text-gray-700">
                                        {file ? file.name : "Click to upload replacement file"}
                                    </span>
                                    <span className="text-xs text-gray-500 mt-1">
                                        {document.documentType.toUpperCase()} files only (Max 10MB)
                                    </span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* FAQ Input */}
                    {document.documentType === "faq" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-semibold text-gray-700">
                                    FAQ Questions & Answers
                                </label>
                                <button
                                    type="button"
                                    onClick={handleAddFaqPair}
                                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-sm font-medium transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add Q&A</span>
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                                {faqPairs.map((pair, index) => (
                                    <div
                                        key={index}
                                        className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 animate-slide-in"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-semibold text-gray-700">
                                                Q&A Pair #{index + 1}
                                            </span>
                                            {faqPairs.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFaqPair(index)}
                                                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                                                >
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                                Question
                                            </label>
                                            <input
                                                type="text"
                                                value={pair.question}
                                                onChange={(e) => handleFaqChange(index, "question", e.target.value)}
                                                placeholder="e.g., What is your return policy?"
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1.5">
                                                Answer
                                            </label>
                                            <textarea
                                                value={pair.answer}
                                                onChange={(e) => handleFaqChange(index, "answer", e.target.value)}
                                                placeholder="e.g., You can return items within 30 days..."
                                                rows={3}
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none bg-white"
                                                required
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-6 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2.5 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {isSubmitting ? "Updating..." : "Update Document"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
