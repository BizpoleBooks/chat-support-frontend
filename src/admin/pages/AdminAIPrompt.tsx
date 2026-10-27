import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useParams, useNavigate } from "react-router-dom";

interface Prompt {
  id: number;
  name: string;
  system_prompt: string;
  is_active: boolean;
}

export default function AdminAIPrompt() {
  const { slug } = useParams();
  const tenantSlug = slug;
  const navigate = useNavigate();

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [editing, setEditing] = useState<Prompt | null>(null);
  const [form, setForm] = useState({ name: "", system_prompt: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<number | null>(null);

  const fetchPrompts = async () => {
    if (!tenantSlug) return;

    setIsLoading(true);
    try {
      const res = await api.get("/admin/ai", {
        headers: { "x-tenant-slug": tenantSlug },
      });
      setPrompts(res.data);
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [tenantSlug]);

  const config = {
    headers: { "x-tenant-slug": tenantSlug },
  };

  const handleSave = async () => {
    if (!form.name || !form.system_prompt) {
      alert("All fields are required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editing) {
        await api.put(`/admin/ai/${editing.id}`, form, config);
      } else {
        await api.post("/admin/ai", form, config);
      }

      setEditing(null);
      setForm({ name: "", system_prompt: "" });
      await fetchPrompts();
    } catch (error) {
      console.error("Failed to save prompt:", error);
      alert("Failed to save prompt. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this prompt? This action cannot be undone.")) {
      return;
    }

    try {
      await api.delete(`/admin/ai/${id}`, config);
      await fetchPrompts();
    } catch (error) {
      console.error("Failed to delete prompt:", error);
      alert("Failed to delete prompt. Please try again.");
    }
  };

  const handleActivate = async (id: number) => {
    setSelectedPrompt(id);
    try {
      await api.post(`/admin/ai/activate/${id}`, {}, config);
      await fetchPrompts();
    } catch (error) {
      console.error("Failed to activate prompt:", error);
      alert("Failed to activate prompt. Please try again.");
    } finally {
      setSelectedPrompt(null);
    }
  };

  const handleDeactivate = async (id: number) => {
    setSelectedPrompt(id);
    try {
      await api.post(`/admin/ai/deactivate/${id}`, {}, config);
      await fetchPrompts();
    } catch (error) {
      console.error("Failed to deactivate prompt:", error);
      alert("Failed to deactivate prompt. Please try again.");
    } finally {
      setSelectedPrompt(null);
    }
  };

  const startEdit = (prompt: Prompt) => {
    setEditing(prompt);
    setForm({
      name: prompt.name,
      system_prompt: prompt.system_prompt,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({ name: "", system_prompt: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-5xl mx-auto">
        
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

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                AI Prompt Management
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-slate-400">Tenant:</span>
                <code className="px-3 py-1 bg-slate-800 rounded-lg text-purple-400 font-mono text-sm">
                  {tenantSlug}
                </code>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4">
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl px-4 py-2">
                <div className="text-2xl font-bold text-white">{prompts.length}</div>
                <div className="text-xs text-slate-400">Total Prompts</div>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl px-4 py-2">
                <div className="text-2xl font-bold text-emerald-400">
                  {prompts.filter(p => p.is_active).length}
                </div>
                <div className="text-xs text-slate-400">Active</div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-xl" />
          <div className="relative bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-purple-500 rounded-full" />
              <h2 className="text-2xl font-semibold text-white">
                {editing ? "Edit Prompt" : "Create New Prompt"}
              </h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Prompt Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  placeholder="e.g., Customer Support Assistant"
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl 
                           text-white placeholder-slate-500 focus:outline-none focus:ring-2 
                           focus:ring-purple-500/50 focus:border-transparent transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  System Prompt
                </label>
                <textarea
                  rows={8}
                  value={form.system_prompt}
                  placeholder="You are a helpful assistant that specializes in..."
                  onChange={(e) => setForm({ ...form, system_prompt: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl 
                           text-white placeholder-slate-500 focus:outline-none focus:ring-2 
                           focus:ring-purple-500/50 focus:border-transparent transition-all 
                           resize-none font-mono text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Define the behavior and context for the AI assistant
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className={`px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 
                           hover:from-purple-700 hover:to-blue-700 text-white font-medium 
                           rounded-xl transition-all duration-200 transform hover:scale-[1.02]
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                           shadow-lg shadow-purple-600/25 flex-1`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    editing ? "Update Prompt" : "Create Prompt"
                  )}
                </button>

                {editing && (
                  <button
                    onClick={cancelEdit}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 
                             font-medium rounded-xl transition-all duration-200 border border-slate-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Prompts List */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-blue-500 rounded-full" />
            <h2 className="text-2xl font-semibold text-white">All Prompts</h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64 bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl">
              <div className="relative">
                <div className="w-12 h-12 border-4 border-slate-800 border-t-purple-500 rounded-full animate-spin" />
              </div>
            </div>
          ) : prompts.length === 0 ? (
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4 opacity-50">🤖</div>
              <h3 className="text-xl font-semibold text-white mb-2">No prompts yet</h3>
              <p className="text-slate-400">Create your first prompt to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {prompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 
                           rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 
                           hover:shadow-xl hover:shadow-purple-500/5"
                >
                  {/* Status indicator */}
                  <div className="absolute top-4 right-4">
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${
                      prompt.is_active 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-slate-500/10 text-slate-400'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        prompt.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                      }`} />
                      <span className="text-xs font-medium">
                        {prompt.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="pr-24">
                    <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-purple-400 
                                 transition-colors duration-200">
                      {prompt.name}
                    </h3>
                    
                    <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
                      <p className="text-sm text-slate-300 font-mono line-clamp-3">
                        {prompt.system_prompt}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-800">
                    {prompt.is_active ? (
                      <button
                        onClick={() => handleDeactivate(prompt.id)}
                        disabled={selectedPrompt === prompt.id}
                        className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 
                                 hover:text-red-300 font-medium rounded-lg transition-all 
                                 duration-200 border border-red-600/20 hover:border-red-600/30 
                                 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {selectedPrompt === prompt.id ? (
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          'Deactivate'
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleActivate(prompt.id)}
                        disabled={selectedPrompt === prompt.id}
                        className="px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 
                                 hover:text-emerald-300 font-medium rounded-lg transition-all 
                                 duration-200 border border-emerald-600/20 hover:border-emerald-600/30 
                                 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {selectedPrompt === prompt.id ? (
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          'Activate'
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => startEdit(prompt)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 
                               font-medium rounded-lg transition-all duration-200 text-sm"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(prompt.id)}
                      className="px-4 py-2 bg-slate-800 hover:bg-red-600/20 text-slate-300 
                               hover:text-red-400 font-medium rounded-lg transition-all 
                               duration-200 text-sm"
                    >
                      Delete
                    </button>
                  </div>

                  {/* Decorative gradient */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 
                                transition-opacity duration-500 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-blue-600/5 rounded-2xl" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}