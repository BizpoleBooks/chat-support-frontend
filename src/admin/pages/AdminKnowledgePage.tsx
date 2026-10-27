// import { useState } from "react";
// import TenantList from "./TenantList";
// import KnowledgeList from "./KnowledgeList";
// import AdminAIPrompt from "./AdminAIPrompt";

// export default function AdminKnowledgePage() {
//   const [selectedTenant, setSelectedTenant] = useState<any>(null);

//   return (
//     <div className="p-8 text-white">

//       {/* Tenant Selection */}
//       <TenantList onSelect={setSelectedTenant} />

//       {selectedTenant && (
//         <>
//           <div className="mt-8 mb-6">
//             <h1 className="text-2xl font-bold">
//               Tenant: {selectedTenant.name}
//             </h1>
//             <p className="text-slate-400 text-sm">
//               Slug: {selectedTenant.slug}
//             </p>
//           </div>

//           {/* Knowledge Base */}
//           <KnowledgeList tenantSlug={selectedTenant.slug} />

//           {/* AI Prompt Management */}
//           <div className="mt-12">
//             <AdminAIPrompt tenantSlug={selectedTenant.slug} />
//           </div>
//         </>
//       )}
//     </div>
//   );
// }
