"use client";

import { useState } from "react";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetDocuments } from "../api/use-get-documents";
import DocumentCard from "../components/document-card";
import DocumentViewerModal from "../components/document-viewer-modal";
import { Card, CardContent } from "@/components/ui/card";
import { FileTextIcon, SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const DocumentsClient = () => {
  const workspaceId = useWorkspaceId();
  const { data: documents, isLoading } = useGetDocuments({ workspaceId });
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDocuments = documents?.filter(
    (doc) =>
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.task.project?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Documents</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="w-full h-32 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileTextIcon className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Documents</h1>
            <p className="text-gray-600">
              All documents from tasks in this workspace
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm">
          {filteredDocuments?.length || 0} files
        </Badge>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search documents, tasks, or projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Documents Grid */}
      {filteredDocuments && filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
              onClick={() => setSelectedDocument(document)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileTextIcon className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {searchTerm ? "No documents found" : "No documents uploaded yet"}
            </h3>
            <p className="text-gray-500 text-center max-w-md">
              {searchTerm
                ? "Try adjusting your search terms or clear the search to see all documents."
                : "Documents uploaded to tasks will appear here. Upload files to tasks to get started."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        isOpen={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
        document={selectedDocument}
      />
    </div>
  );
};

export default DocumentsClient;
