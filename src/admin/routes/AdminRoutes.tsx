import { Routes, Route } from "react-router-dom";
import AdminLayout from "../layout/AdminLayout";
import Dashboard from "../pages/Dashboard";

import KnowledgeList from "../pages/KnowledgeList";
import AdminTicketList from "../pages/AdminTicketList";
import AdminTicketDetail from "../pages/AdminTicketDetails";
import AdminAIPrompt from "../pages/AdminAIPrompt";
import TenantList from "../pages/TenantList";
import Conversations from "../pages/Conversations";
// import AdminKnowledgePage from "../pages/AdminKnowledgePage";
// import Tenants from "../pages/Tenants";
// import Conversations from "../pages/Conversations";
// import Knowledge from "../pages/Knowledge";
import AdminEnquiries from './../pages/AdminEnquiries';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        
        {/* ✅ Default route when visiting /admin */}
        <Route index element={<Dashboard />} />

        {/* ✅ Explicit routes */}
        <Route path="dashboard" element={<Dashboard />} />
            <Route path="knowledge" element={<KnowledgeList />} />
            <Route path="ticket" element={<AdminTicketList />} />
            <Route path="tickets/:id" element={<AdminTicketDetail />} />
            <Route path="admin/ai-settings" element={<AdminAIPrompt />} />
        <Route path="tenant" element={<TenantList />} />
        <Route path="enquiries" element={<AdminEnquiries />} /> {/* New route */}
        <Route path="conversations" element={<Conversations />} />
<Route path="tenant/:slug/knowledge" element={<KnowledgeList />} />
<Route path="tenant/:slug/prompts" element={<AdminAIPrompt />} />
        {/* 
        <Route path="tenants" element={<Tenants />} />
        <Route path="conversations" element={<Conversations />} />
        <Route path="knowledge" element={<Knowledge />} />
        */}

      </Route>
    </Routes>
  );
}
