"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { useToast } from "@/lib/useToast";

export default function DocumentsPage() {
  const [showUpload, setShowUpload] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<any>(null);
  const { toast, ToastContainer } = useToast();

  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All Types");

  const [uploadForm, setUploadForm] = useState({
    name: "",
    category: "legal",
    description: "",
    fileUrl: "",
    fileType: "pdf",
    fileSize: 0,
  });

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (filterType !== "All Types") params.set("category", filterType.toLowerCase());
      const res = await fetch(`/api/documents?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      setDocuments(data);
      setError("");
    } catch (e: any) {
      setError(e.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterType]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.category || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "All Types" || doc.category === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: uploadForm.name,
          entityType: "general",
          entityId: "system",
          category: uploadForm.category,
          description: uploadForm.description || undefined,
          fileUrl: uploadForm.fileUrl || "https://placeholder.com/document",
          fileType: uploadForm.fileType,
          fileSize: uploadForm.fileSize || 0,
          uploadedBy: "Admin",
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to upload document");
      }
      toast("Document uploaded successfully", "success");
      setShowUpload(false);
      setUploadForm({ name: "", category: "legal", description: "", fileUrl: "", fileType: "pdf", fileSize: 0 });
      fetchDocuments();
    } catch (e: any) {
      toast(e.message || "Failed to upload document", "error");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 KB";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Document Control Management (DCM)</h1>
        <button onClick={() => setShowUpload(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
          + Upload Document
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-md text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <div className="stat-card-value text-blue-600">{documents.length}</div>
          <div className="stat-card-label">Total Documents</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value text-green-600">{documents.filter((d) => !d.isArchived).length}</div>
          <div className="stat-card-label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value text-orange-600">{documents.filter((d) => d.expiryDate && new Date(d.expiryDate) > new Date() && new Date(d.expiryDate) < new Date(Date.now() + 90 * 86400000)).length}</div>
          <div className="stat-card-label">Expiring Soon</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-value text-red-600">{documents.filter((d) => d.expiryDate && new Date(d.expiryDate) < new Date()).length}</div>
          <div className="stat-card-label">Expired</div>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Search documents..."
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-96"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option>All Types</option>
          <option>Legal</option>
          <option>Certificate</option>
          <option>Contract</option>
          <option>ID Proof</option>
          <option>Other</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading documents...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Entity</th>
                <th>Version</th>
                <th>Size</th>
                <th>Expiry</th>
                <th>Uploaded By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map((doc) => (
                <tr key={doc.id}>
                  <td className="font-medium">{doc.name}</td>
                  <td>
                    <span className="status-badge bg-gray-100 text-gray-800">{doc.category || "N/A"}</span>
                  </td>
                  <td>{doc.entityType}</td>
                  <td>v{doc.version}</td>
                  <td className="text-muted-foreground">{formatSize(doc.fileSize)}</td>
                  <td>
                    {doc.expiryDate ? (
                      <span className={`text-sm ${new Date(doc.expiryDate) < new Date() ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                        {new Date(doc.expiryDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td>{doc.uploadedBy}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => { setViewingDoc(doc); setShowViewModal(true); }} className="px-2 py-1 text-xs border rounded hover:bg-muted">View</button>
                      <button onClick={() => toast("Downloading document...", "info")} className="px-2 py-1 text-xs border rounded hover:bg-muted">Download</button>
                      <button onClick={() => toast("Share link copied to clipboard", "success")} className="px-2 py-1 text-xs border rounded hover:bg-muted">Share</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDocuments.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No documents found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Upload Document</h2>
              <button onClick={() => setShowUpload(false)} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
            </div>
            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="form-group">
                <label className="text-sm font-medium">Document Name *</label>
                <input
                  type="text"
                  className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full"
                  placeholder="Enter document name"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="text-sm font-medium">Category</label>
                  <select
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full"
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm((p) => ({ ...p, category: e.target.value }))}
                  >
                    <option value="legal">Legal</option>
                    <option value="certificate">Certificate</option>
                    <option value="contract">Contract</option>
                    <option value="id_proof">ID Proof</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">File Type</label>
                  <input
                    type="text"
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full"
                    placeholder="e.g., pdf, docx"
                    value={uploadForm.fileType}
                    onChange={(e) => setUploadForm((p) => ({ ...p, fileType: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">File Size (bytes)</label>
                  <input
                    type="number"
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full"
                    placeholder="e.g., 1024000"
                    value={uploadForm.fileSize || ""}
                    onChange={(e) => setUploadForm((p) => ({ ...p, fileSize: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="form-group">
                  <label className="text-sm font-medium">File URL</label>
                  <input
                    type="text"
                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full"
                    placeholder="https://example.com/file.pdf"
                    value={uploadForm.fileUrl}
                    onChange={(e) => setUploadForm((p) => ({ ...p, fileUrl: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="text-sm font-medium">Description</label>
                <input
                  type="text"
                  className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm w-full"
                  placeholder="Brief description of the document"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => setShowUpload(false)} className="px-4 py-2 border rounded-md text-sm font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewingDoc && (
        <div className="modal-overlay" onClick={() => { setShowViewModal(false); setViewingDoc(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Document Details</h2>
              <button onClick={() => { setShowViewModal(false); setViewingDoc(null); }} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">ID</span>
                <span className="text-sm font-medium font-mono">{viewingDoc.id}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="text-sm font-medium">{viewingDoc.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Category</span>
                <span className="status-badge bg-gray-100 text-gray-800">{viewingDoc.category || "N/A"}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Entity Type</span>
                <span className="text-sm font-medium">{viewingDoc.entityType}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Version</span>
                <span className="text-sm font-medium">v{viewingDoc.version}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Size</span>
                <span className="text-sm font-medium">{formatSize(viewingDoc.fileSize)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">File Type</span>
                <span className="text-sm font-medium">{viewingDoc.fileType}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Expiry</span>
                <span className="text-sm font-medium">{viewingDoc.expiryDate ? new Date(viewingDoc.expiryDate).toLocaleDateString() : "No expiry"}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm text-muted-foreground">Uploaded By</span>
                <span className="text-sm font-medium">{viewingDoc.uploadedBy}</span>
              </div>
              {viewingDoc.description && (
                <div className="flex justify-between py-2 border-b">
                  <span className="text-sm text-muted-foreground">Description</span>
                  <span className="text-sm font-medium max-w-[300px] text-right">{viewingDoc.description}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => toast("Downloading document...", "info")} className="px-4 py-2 border rounded-md text-sm font-medium">Download</button>
              <button onClick={() => { setShowViewModal(false); setViewingDoc(null); }} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </AppShell>
  );
}
