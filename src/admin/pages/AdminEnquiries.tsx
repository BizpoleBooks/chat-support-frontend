import { useEffect, useState } from "react";
import api from "../../api/axios";
import { Mail, Eye, Phone, Package, Calendar, Search, Filter, RefreshCw } from "lucide-react";

interface Enquiry {
  id: number;
  tenant_id: number;
  product: string;
  contact: string;
  created_at: string;
}

export default function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEnquiries = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/admin/enquiries");
      setEnquiries(response.data);
    } catch (error) {
      console.error("Failed to fetch enquiries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  // Get unique products for filter
  const products = ["all", ...new Set(enquiries.map(e => e.product))];

  // Filter enquiries
  const filteredEnquiries = enquiries.filter(enquiry => {
    const matchesSearch = 
      enquiry.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.product.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = selectedProduct === "all" || enquiry.product === selectedProduct;
    return matchesSearch && matchesProduct;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const openEnquiryDetails = (enquiry: Enquiry) => {
    setSelectedEnquiry(enquiry);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Enquiries Management
              </h1>
              <p className="text-slate-400 mt-2">
                View and manage all customer enquiries
              </p>
            </div>
            <button
              onClick={fetchEnquiries}
              className="p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl 
                       transition-all duration-200 border border-slate-700
                       hover:border-purple-500/50 group"
            >
              <RefreshCw className="w-5 h-5 text-slate-400 group-hover:text-purple-400 
                                   transition-colors duration-200" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 border border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Mail className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Enquiries</p>
                <p className="text-3xl font-bold text-white">{enquiries.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-600/10 to-emerald-600/10 border border-green-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <Package className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Unique Products</p>
                <p className="text-3xl font-bold text-white">{products.length - 1}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-600/10 to-cyan-600/10 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Phone className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Unique Contacts</p>
                <p className="text-3xl font-bold text-white">
                  {new Set(enquiries.map(e => e.contact)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search by contact or product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                         text-white placeholder-slate-500 focus:outline-none focus:ring-2 
                         focus:ring-purple-500/50 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="pl-10 pr-8 py-3 bg-slate-800/50 border border-slate-700 rounded-xl
                         text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50
                         focus:border-transparent transition-all cursor-pointer"
              >
                {products.map(product => (
                  <option key={product} value={product}>
                    {product === "all" ? "All Products" : product}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Enquiries Table */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-slate-800 border-t-purple-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4 opacity-50">📧</div>
            <h3 className="text-xl font-semibold text-white mb-2">No enquiries found</h3>
            <p className="text-slate-400">No enquiries match your search criteria</p>
          </div>
        ) : (
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Product</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Contact</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredEnquiries.map((enquiry) => (
                    <tr key={enquiry.id} className="hover:bg-slate-800/30 transition-colors duration-200">
                      <td className="px-6 py-4 text-sm text-slate-300">#{enquiry.id}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-3 py-1 bg-purple-500/10 text-purple-400 
                                       rounded-full text-sm font-medium">
                          {enquiry.product}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-white">{enquiry.contact}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-300">{formatDate(enquiry.created_at)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openEnquiryDetails(enquiry)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg 
                                   transition-colors duration-200 group"
                        >
                          <Eye className="w-4 h-4 text-slate-400 group-hover:text-purple-400 
                                        transition-colors duration-200" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Enquiry Details */}
      {isModalOpen && selectedEnquiry && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
             onClick={() => setIsModalOpen(false)}>
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 
                        rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
               onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Enquiry Details</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors duration-200"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">Enquiry ID</label>
                  <p className="text-white font-mono mt-1">#{selectedEnquiry.id}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Date</label>
                  <p className="text-white mt-1">{formatDate(selectedEnquiry.created_at)}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-slate-400">Product</label>
                <p className="text-white text-lg font-semibold mt-1">{selectedEnquiry.product}</p>
              </div>
              
              <div>
                <label className="text-sm text-slate-400">Contact Information</label>
                <div className="mt-2 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-purple-400" />
                    <p className="text-white font-mono">{selectedEnquiry.contact}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white 
                         rounded-xl transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}