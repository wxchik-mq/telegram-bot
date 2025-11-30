"use client";

import { useState, useEffect } from "react";
import { Search, MessageSquare, Upload } from "lucide-react";
import Sidebar from "./_components/Sidebar";
import DocumentList from "./_components/DocumentList";
import AddDocumentModal from "./_components/AddDocumentModal";
import ViewModal from "./_components/ViewModal";
import EditModal from "./_components/EditModal";

import DeleteConfirmationModal from "./_components/DeleteConfirmationModal";

interface Document {
    id: number;
    documentType: string;
    title?: string | null;
    metadata?: any;
    createdAt: string;
    updatedAt: string;
}

export default function KnowledgeBasePage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addModalMode, setAddModalMode] = useState<"faq" | "file">("file");

    // View/Edit Modal State
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchDocuments = async (documentType?: string) => {
        setIsLoading(true);
        try {
            const url = documentType && documentType !== "all"
                ? `/api/document?documentType=${documentType}`
                : "/api/document";
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to fetch documents");
            const data = await response.json();
            setDocuments(data);
            setFilteredDocuments(data);
        } catch (error) {
            console.error("Error fetching documents:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments(filterType === "all" ? undefined : filterType);
    }, [filterType]);

    useEffect(() => {
        let filtered = documents;
        if (searchQuery) {
            filtered = filtered.filter((doc) =>
                doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                doc.documentType.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        setFilteredDocuments(filtered);
    }, [searchQuery, documents]);

    const handleUpload = async (data: any) => {
        try {
            const formData = new FormData();

            if (data.file) {
                formData.append("file", data.file);
                formData.append("requestBody", JSON.stringify({ documentType: data.documentType }));
            } else {
                const response = await fetch("/api/document", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });

                if (!response.ok) throw new Error("Upload failed");
                await fetchDocuments(filterType === "all" ? undefined : filterType);
                return;
            }

            const response = await fetch("/api/document", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("Upload failed");
            await fetchDocuments(filterType === "all" ? undefined : filterType);
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload document");
            throw error;
        }
    };

    const confirmDelete = async () => {
        if (!documentToDelete) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`/api/document/${documentToDelete.id}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Delete failed");
            await fetchDocuments(filterType === "all" ? undefined : filterType);
            setIsDeleteModalOpen(false);
            setDocumentToDelete(null);
        } catch (error) {
            console.error("Delete error:", error);
            alert("Failed to delete document");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteClick = (id: number) => {
        const doc = documents.find((d) => d.id === id);
        if (doc) {
            setDocumentToDelete(doc);
            setIsDeleteModalOpen(true);
        }
    };

    const handleUpdate = async (id: number, data: any) => {
        try {
            const formData = new FormData();

            if (data.file) {
                formData.append("file", data.file);
                formData.append("requestBody", JSON.stringify({ documentType: data.documentType }));
            } else {
                const response = await fetch(`/api/document/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });

                if (!response.ok) throw new Error("Update failed");
                await fetchDocuments(filterType === "all" ? undefined : filterType);
                return;
            }

            const response = await fetch(`/api/document/${id}`, {
                method: "PUT",
                body: formData,
            });

            if (!response.ok) throw new Error("Update failed");
            await fetchDocuments(filterType === "all" ? undefined : filterType);
        } catch (error) {
            console.error("Update error:", error);
            alert("Failed to update document");
            throw error;
        }
    };

    const handleView = (doc: Document) => {
        setSelectedDocument(doc);
        setIsViewModalOpen(true);
    };

    const handleEdit = (doc: Document) => {
        setSelectedDocument(doc);
        setIsEditModalOpen(true);
        // Close view modal if open
        setIsViewModalOpen(false);
    };

    const documentTypes = [
        { value: "all", label: "All Documents" },
        { value: "pdf", label: "PDF Documents" },
        { value: "docx", label: "Word Documents" },
        { value: "txt", label: "Text Files" },
        { value: "faq", label: "FAQs" },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />

            <main className="flex-1">
                {/* Top Section */}
                <div className="bg-white border-b border-gray-200 px-8 py-6">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => {
                                        setAddModalMode("faq");
                                        setIsAddModalOpen(true);
                                    }}
                                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    <span>Add FAQ</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setAddModalMode("file");
                                        setIsAddModalOpen(true);
                                    }}
                                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <Upload className="w-4 h-4" />
                                    <span>Upload File</span>
                                </button>
                            </div>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {documentTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Knowledge Base"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                />
                            </div>
                            <div className="ml-4 text-sm text-gray-600">
                                {documents.length} {documents.length === 1 ? "document" : "documents"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Document List */}
                <div className="px-8 py-6">
                    <div className="max-w-6xl mx-auto">
                        {isLoading ? (
                            <div className="text-center py-12 text-gray-500">
                                <p>Loading documents...</p>
                            </div>
                        ) : (
                            <DocumentList
                                documents={filteredDocuments}
                                onDelete={handleDeleteClick}
                                onView={handleView}
                                onEdit={handleEdit}
                            />
                        )}
                    </div>
                </div>
            </main>

            <AddDocumentModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleUpload}
                mode={addModalMode}
            />

            <ViewModal
                isOpen={isViewModalOpen}
                document={selectedDocument}
                onClose={() => setIsViewModalOpen(false)}
                onEdit={handleEdit}
            />

            <EditModal
                isOpen={isEditModalOpen}
                document={selectedDocument}
                onClose={() => setIsEditModalOpen(false)}
                onSubmit={handleUpdate}
            />

            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title={documentToDelete?.title || "this document"}
                isDeleting={isDeleting}
            />
        </div>
    );
}
