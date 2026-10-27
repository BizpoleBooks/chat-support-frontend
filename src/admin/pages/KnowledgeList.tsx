import { useEffect, useState } from "react";
import api from "../../api/axios";
import { Plus, Pencil, Trash2, FileText, Calendar, ExternalLink } from "lucide-react";
import AdminUpload from "./AdminUpload";
import { useParams, useNavigate } from "react-router-dom";

export default function KnowledgeList() {
  const [docs, setDocs] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<number | null>(null);
  
  const { slug } = useParams();
  const tenantSlug = slug;
  const navigate = useNavigate();

  const fetchDocs = async () => {
    if (!tenantSlug) return;

    setIsLoading(true);
    try {
      const res = await api.get("/knowledge", {
        headers: { "x-tenant-slug": tenantSlug },
      });
      setDocs(res.data);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [tenantSlug]);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return;
    }

    setSelectedDoc(id);
    try {
      await api.delete(`/knowledge/${id}`, {
        headers: { "x-tenant-slug": tenantSlug },
      });
      await fetchDocs();
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Failed to delete document. Please try again.");
    } finally {
      setSelectedDoc(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getFileIcon = (files: any[]) => {
    if (!files || files.length === 0) return '📄';

    const file = files[0]; // show first file icon
    if (file.file_type === "image") return '🟣';
    return '🔴'; // pdf
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header with back button */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/tenant')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200 mb-4 group"
          >
            <svg 
              className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Tenants
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Knowledge Base
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-slate-400">Tenant:</span>
                <code className="px-3 py-1 bg-slate-800 rounded-lg text-purple-400 font-mono text-sm">
                  {tenantSlug}
                </code>
              </div>
              <p className="text-slate-400 text-sm mt-2">
                Manage training documents for your AI assistant
              </p>
            </div>

            <div className="flex gap-4">
              {/* Stats */}
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl px-4 py-2">
                <div className="text-2xl font-bold text-white">{docs.length}</div>
                <div className="text-xs text-slate-400">Total Documents</div>
              </div>
              
              <button
                onClick={() => {
                  setEditData(null);
                  setShowModal(true);
                }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 
                         px-6 py-3 rounded-xl flex items-center gap-2 
                         hover:scale-105 transition-all duration-200 shadow-lg
                         shadow-purple-600/25 font-medium"
              >
                <Plus size={18} /> Add Document
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-800 border-t-purple-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        ) : docs.length === 0 ? (
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-16 text-center">
            <div className="text-6xl mb-4 opacity-50">📚</div>
            <h3 className="text-2xl font-semibold text-white mb-2">No Documents Yet</h3>
            <p className="text-slate-400 mb-8">
              Start building your knowledge base by adding your first document.
            </p>
            <button
              onClick={() => {
                setEditData(null);
                setShowModal(true);
              }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 
                       px-6 py-3 rounded-xl inline-flex items-center gap-2 
                       hover:scale-105 transition-all duration-200 shadow-lg
                       shadow-purple-600/25 font-medium"
            >
              <Plus size={18} /> Add Your First Document
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="group relative bg-slate-900/50 backdrop-blur-sm 
                         border border-slate-800 rounded-2xl p-6
                         hover:border-purple-500/50 hover:shadow-xl 
                         hover:shadow-purple-500/5 transition-all duration-300"
              >
                {/* Decorative header gradient */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r 
                              from-purple-500 to-blue-500 rounded-t-2xl opacity-0 
                              group-hover:opacity-100 transition-opacity duration-300" />

                {/* File type indicator */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getFileIcon(doc.files)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-white group-hover:text-purple-400 
                                   transition-colors duration-200 line-clamp-1">
                        {doc.title || 'Untitled Document'}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <Calendar size={12} />
                        {formatDate(doc.created_at)}
                      </div>
                    </div>
                  </div>

                  {doc.files?.length > 0 && (
                    <a
                      href={doc.files[0].file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-purple-500/10 text-purple-400 rounded-lg 
                               hover:bg-purple-500/20 transition-all duration-200"
                      title="View File"
                    >
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>

                {/* Content preview */}
                <div className="relative">
                  <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <FileText size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-300 line-clamp-3 leading-relaxed">
                        {doc.content || 'No description available'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
              <div className="pt-4 border-t border-slate-800 space-y-3">

  {/* 🔥 Quick Action Row */}
  <div className="flex items-center gap-2">

    {/* Toggle */}
    <input
      type="checkbox"
      checked={doc.is_quick_action || false}
      onChange={async () => {
        await api.put(`/knowledge/${doc.id}/quick-action`, {
          is_quick_action: !doc.is_quick_action
        }, {
          headers: { "x-tenant-slug": tenantSlug }
        });

        fetchDocs();
      }}
      className="accent-yellow-400 cursor-pointer"
    />

    {/* Label */}
    <input
      type="text"
      placeholder="Enter question (e.g. What is pricing?)"
      defaultValue={doc.quick_action_label || ""}
      onBlur={async (e) => {
        await api.put(`/knowledge/${doc.id}/quick-action`, {
          quick_action_label: e.target.value
        }, {
          headers: { "x-tenant-slug": tenantSlug }
        });

        fetchDocs();
      }}
      className="bg-slate-800 border border-slate-700 text-white 
                 px-2 py-1 rounded text-xs w-full
                 focus:outline-none focus:ring-1 focus:ring-yellow-400"
    />

  </div>

  {/* 🔧 Actions Row */}
  <div className="flex items-center justify-end gap-2">

    <button
      onClick={() => {
        setEditData(doc);
        setShowModal(true);
      }}
      className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 
                 hover:text-yellow-400 transition-all duration-200"
    >
      <Pencil size={18} />
    </button>

    <button
      onClick={() => handleDelete(doc.id)}
      disabled={selectedDoc === doc.id}
      className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 
                 hover:text-red-400 transition-all duration-200"
    >
      <Trash2 size={18} />
    </button>

  </div>
</div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <AdminUpload
          existingData={editData}
          onClose={() => setShowModal(false)}
          onSuccess={fetchDocs}
          tenantSlug={tenantSlug!}
        />
      )}
    </div>
  );
}