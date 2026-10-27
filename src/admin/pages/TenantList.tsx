import { useEffect, useState } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";

interface Tenant {
  id: number;
  name: string;
  slug: string;
}

export default function TenantList() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/tenants");
      setTenants(res.data);
    } catch (error) {
      console.error("Failed to fetch tenants:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleSave = async () => {
    if (!name || !slug) {
      alert("Name and slug are required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editing) {
        await api.put(`/tenants/${editing.id}`, { name, slug });
        setTenants(prev =>
          prev.map(t => t.id === editing.id ? { ...t, name, slug } : t
        ));
        setEditing(null);
      } else {
        await api.post("/tenants", { name, slug });
        fetchTenants();
      }
      
      setName("");
      setSlug("");
    } catch (error) {
      console.error("Failed to save tenant:", error);
      alert("Failed to save tenant. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this tenant? This action cannot be undone.")) {
      return;
    }

    try {
      await api.delete(`/tenants/${id}`);
      setTenants(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error("Failed to delete tenant:", error);
      alert("Failed to delete tenant. Please try again.");
    }
  };

  const startEdit = (tenant: Tenant) => {
    setEditing(tenant);
    setName(tenant.name);
    setSlug(tenant.slug);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditing(null);
    setName("");
    setSlug("");
  };

  const generateSlug = () => {
    if (!name) return;
    const generatedSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setSlug(generatedSlug);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            Tenant Management
          </h1>
          <p className="text-slate-400 mt-2">
            Create and manage tenants for your multi-tenant application
          </p>
        </div>

        {/* Form Card */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-xl" />
          <div className="relative bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-purple-500 rounded-full" />
              <h2 className="text-2xl font-semibold text-white">
                {editing ? "Edit Tenant" : "Create New Tenant"}
              </h2>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Tenant Name
                  </label>
                  <input
                    placeholder="e.g., Acme Corporation"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl 
                             text-white placeholder-slate-500 focus:outline-none focus:ring-2 
                             focus:ring-purple-500/50 focus:border-transparent transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Slug
                  </label>
                  <div className="flex gap-2">
                    <input
                      placeholder="e.g., acme-corp"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                      className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl 
                               text-white placeholder-slate-500 focus:outline-none focus:ring-2 
                               focus:ring-purple-500/50 focus:border-transparent transition-all"
                    />
                    <button
                      onClick={generateSlug}
                      className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 
                               rounded-xl transition-colors duration-200 font-medium text-sm"
                      type="button"
                    >
                      Generate
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className={`px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 
                           hover:from-purple-700 hover:to-blue-700 text-white font-medium 
                           rounded-xl transition-all duration-200 transform hover:scale-[1.02]
                           disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                           shadow-lg shadow-purple-600/25`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    editing ? "Update Tenant" : "Create Tenant"
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

        {/* Tenants Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-800 border-t-purple-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4 opacity-50">🏢</div>
            <h3 className="text-xl font-semibold text-white mb-2">No tenants yet</h3>
            <p className="text-slate-400">Create your first tenant to get started</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                className="group relative bg-slate-900/50 backdrop-blur-sm border border-slate-800 
                         rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 
                         hover:shadow-xl hover:shadow-purple-500/5"
              >
                {/* Status indicator */}
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-xs text-slate-500">Active</span>
                  </div>
                </div>

                {/* Tenant info */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-400 
                               transition-colors duration-200">
                    {tenant.name}
                  </h3>
                  <div className="inline-block px-3 py-1 bg-slate-800 rounded-lg">
                    <code className="text-sm text-purple-400">{tenant.slug}</code>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => navigate(`/admin/tenant/${tenant.slug}/knowledge`)}
                    className="w-full px-4 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 
                             text-blue-400 hover:text-blue-300 font-medium rounded-xl 
                             transition-all duration-200 border border-blue-600/20 
                             hover:border-blue-600/30 text-left"
                  >
                    Knowledge Base
                  </button>

                  <button
                    onClick={() => navigate(`/admin/tenant/${tenant.slug}/prompts`)}
                    className="w-full px-4 py-2.5 bg-purple-600/10 hover:bg-purple-600/20 
                             text-purple-400 hover:text-purple-300 font-medium rounded-xl 
                             transition-all duration-200 border border-purple-600/20 
                             hover:border-purple-600/30 text-left"
                  >
                    AI Prompts
                  </button>

                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => startEdit(tenant)}
                      className="px-4 py-2 text-slate-400 hover:text-yellow-400 
                               font-medium rounded-lg transition-colors duration-200 
                               text-sm bg-slate-800/50 hover:bg-slate-800"
                    >
                      Edit
                    </button>
                    
                    <button
                      onClick={() => handleDelete(tenant.id)}
                      className="px-4 py-2 text-slate-400 hover:text-red-400 
                               font-medium rounded-lg transition-colors duration-200 
                               text-sm bg-slate-800/50 hover:bg-slate-800"
                    >
                      Delete
                    </button>
                  </div>
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
  );
}