"use client";

import { X, Plus, Minus } from "lucide-react";
import { useState } from "react";

interface AddDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    mode: "faq" | "file";
}

export default function AddDocumentModal({ isOpen, onClose, onSubmit, mode }: AddDocumentModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [faqPairs, setFaqPairs] = useState<{ question: string; answer: string }[]>([
        { question: "", answer: "" },
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

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
            if (mode === "faq") {
                await onSubmit({
                    documentType: "faq",
                    records: faqPairs.filter((pair) => pair.question && pair.answer),
                });
            } else {
                if (!file) {
                    alert("Please select a file");
                    return;
                }
                const fileExt = file.name.split(".").pop()?.toLowerCase();
                await onSubmit({
                    documentType: fileExt,
                    file,
                });
            }
            handleClose();
        } catch (error) {
            console.error("Upload failed:", error);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {mode === "faq" ? "Add FAQ" : "Upload File"}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="p-1 rounded hover:bg-gray-100 text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {mode === "file" ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select File
                            </label>
                            <input
                                type="file"
                                accept=".pdf,.docx,.txt"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                required
                            />
                            {file && (
                                <p className="mt-2 text-sm text-gray-600">Selected: {file.name}</p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {faqPairs.map((pair, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">
                                            Q&A Pair #{index + 1}
                                        </span>
                                        {faqPairs.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveFaqPair(index)}
                                                className="p-1 text-gray-400 hover:text-red-600"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            QUESTION
                                        </label>
                                        <input
                                            type="text"
                                            value={pair.question}
                                            onChange={(e) => handleFaqChange(index, "question", e.target.value)}
                                            placeholder="e.g. What is your return policy?"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                            ANSWER
                                        </label>
                                        <textarea
                                            value={pair.answer}
                                            onChange={(e) => handleFaqChange(index, "answer", e.target.value)}
                                            placeholder="e.g. You can return items within 30 days..."
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                                            required
                                        />
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleAddFaqPair}
                                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                            >
                                + Add another Q&A pair
                            </button>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? "Saving..." : mode === "faq" ? "Save FAQs" : "Upload File"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
