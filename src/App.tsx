import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AdminRoutes from "./admin/routes/AdminRoutes";

function App() {
  return (
    <Routes>
      {/* Customer side */}
      <Route path="/" element={<LandingPage />} />
      {/* <Route path="/home" element={<HomePage />} /> */}

      {/* Admin side */}
      <Route path="/admin/*" element={<AdminRoutes />} />
    </Routes>
  );
}

export default App;
