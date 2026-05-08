import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { ROUTE_PATHS } from "@/lib/index";

import { AuthProvider, useAuth } from "@/context/AuthContext";

// Pages — Public
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import FiliereDetail from "@/pages/FiliereDetail";

// Pages — Admin
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminModules from "@/pages/admin/Modules";
import AdminFilieres from "@/pages/admin/Filieres";
import AdminGroupes from "@/pages/admin/Groupes";
import AdminUtilisateurs from "@/pages/admin/Utilisateurs";
import AdminDemandes from "@/pages/admin/Demandes";
import AdminAbsences from "@/pages/admin/Absences";
import AdminNotes from "@/pages/admin/Notes";
import AdminClubs from "@/pages/admin/Clubs";
import AdminEmploisDuTemps from "@/pages/admin/EmploisDuTemps";

// Pages — Formateur
import FormateurDashboard from "@/pages/formateur/Dashboard";
import FormateurMesModules from "@/pages/formateur/MesModules";
import FormateurAbsencesStagiaires from "@/pages/formateur/AbsencesStagiaires";
import FormateurNotesStagiaires from "@/pages/formateur/NotesStagiaires";

// Pages — Stagiaire
import StagiaireDashboard from "@/pages/stagiaire/Dashboard";
import StagiaireEmploiDuTemps from "@/pages/stagiaire/EmploiDuTemps";
import StagiaireNotes from "@/pages/stagiaire/Notes";
import StagiaireAbsences from "@/pages/stagiaire/Absences";
import StagiaireClubs from "@/pages/stagiaire/Clubs";
import StagiaireDemandes from "@/pages/stagiaire/Demandes";

const queryClient = new QueryClient();

// ─── ProtectedRoute ───────────────────────────────────────────
function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles: string[];
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTE_PATHS.LOGIN} replace />;
  }

  if (!roles.includes(user.role)) {
    const redirect =
      user.role === "Administrateur"
        ? ROUTE_PATHS.ADMIN_DASHBOARD
        : user.role === "Formateur"
        ? ROUTE_PATHS.FORMATEUR_DASHBOARD
        : ROUTE_PATHS.STAGIAIRE_DASHBOARD;

    return <Navigate to={redirect} replace />;
  }

  return <>{children}</>;
}

// ─── Routes ───────────────────────────────────────────────────
function AppRoutes() {
  return (
    <AuthProvider>
      <Routes>

        {/* ── PUBLIC ─────────────────────────────────────── */}
        <Route path={ROUTE_PATHS.HOME}          element={<Home />} />
        <Route path="/filiere/:id"              element={<FiliereDetail />} />
        <Route path={ROUTE_PATHS.LOGIN}         element={<Login />} />
        <Route path={ROUTE_PATHS.SIGNUP}        element={<SignUp />} />

        {/* ── ADMIN ──────────────────────────────────────── */}
        <Route path={ROUTE_PATHS.ADMIN_DASHBOARD}
          element={<ProtectedRoute roles={["Administrateur"]}><AdminDashboard /></ProtectedRoute>} />
        <Route path={ROUTE_PATHS.ADMIN_MODULES}
          element={<ProtectedRoute roles={["Administrateur"]}><AdminModules /></ProtectedRoute>} />
        <Route path={ROUTE_PATHS.ADMIN_FILIERES}
          element={<ProtectedRoute roles={["Administrateur"]}><AdminFilieres /></ProtectedRoute>} />
        <Route path={ROUTE_PATHS.ADMIN_GROUPES}
          element={<ProtectedRoute roles={["Administrateur"]}><AdminGroupes /></ProtectedRoute>} />
        <Route path={ROUTE_PATHS.ADMIN_UTILISATEURS}
          element={<ProtectedRoute roles={["Administrateur"]}><AdminUtilisateurs /></ProtectedRoute>} />
        <Route path={ROUTE_PATHS.ADMIN_DEMANDES}
          element={<ProtectedRoute roles={["Administrateur"]}><AdminDemandes /></ProtectedRoute>} />
        <Route path={ROUTE_PATHS.ADMIN_ABSENCES}
          element={<ProtectedRoute roles={["Administrateur"]}><AdminAbsences /></ProtectedRoute>} />
        <Route path={ROUTE_PATHS.ADMIN_NOTES}
          element={<ProtectedRoute roles={["Administrateur"]}><AdminNotes /></ProtectedRoute>} />
        <Route path={ROUTE_PATHS.ADMIN_CLUBS}
          element={<ProtectedRoute roles={["Administrateur"]}><AdminClubs /></ProtectedRoute>} />
        <Route path={ROUTE_PATHS.ADMIN_EMPLOIS_DU_TEMPS}
          element={<ProtectedRoute roles={["Administrateur"]}><AdminEmploisDuTemps /></ProtectedRoute>} />

        {/* ── FORMATEUR ──────────────────────────────────── */}
        <Route path={ROUTE_PATHS.FORMATEUR_DASHBOARD}
          element={<ProtectedRoute roles={["Formateur"]}><FormateurDashboard /></ProtectedRoute>} />
        <Route path={ROUTE_PATHS.FORMATEUR_MES_MODULES}
          element={<ProtectedRoute roles={["Formateur"]}><FormateurMesModules /></ProtectedRoute>} />
        <Route path={ROUTE_PATHS.FORMATEUR_ABSENCES_STAGIAIRES}
          element={<ProtectedRoute roles={["Formateur"]}><FormateurAbsencesStagiaires /></ProtectedRoute>} />
        <Route path={ROUTE_PATHS.FORMATEUR_NOTES_STAGIAIRES}
          element={<ProtectedRoute roles={["Formateur"]}><FormateurNotesStagiaires /></ProtectedRoute>} />

        {/* ── STAGIAIRE ──────────────────────────────────── */}
        <Route path={ROUTE_PATHS.STAGIAIRE_DASHBOARD}
          element={<ProtectedRoute roles={["Stagiaire"]}><StagiaireDashboard /></ProtectedRoute>} />
        <Route path={ROUTE_PATHS.STAGIAIRE_EMPLOI_DU_TEMPS}
          element={<ProtectedRoute roles={["Stagiaire"]}><StagiaireEmploiDuTemps /></ProtectedRoute>} />
        <Route path={ROUTE_PATHS.STAGIAIRE_NOTES}
          element={<ProtectedRoute roles={["Stagiaire"]}><StagiaireNotes /></ProtectedRoute>} />
        <Route path={ROUTE_PATHS.STAGIAIRE_ABSENCES}
          element={<ProtectedRoute roles={["Stagiaire"]}><StagiaireAbsences /></ProtectedRoute>} />
        <Route path={ROUTE_PATHS.STAGIAIRE_CLUBS}
          element={<ProtectedRoute roles={["Stagiaire"]}><StagiaireClubs /></ProtectedRoute>} />
        <Route path={ROUTE_PATHS.STAGIAIRE_DEMANDES}
          element={<ProtectedRoute roles={["Stagiaire"]}><StagiaireDemandes /></ProtectedRoute>} />

        {/* ── FALLBACK ───────────────────────────────────── */}
        <Route path="*" element={<Navigate to={ROUTE_PATHS.HOME} replace />} />

      </Routes>
    </AuthProvider>
  );
}

// ─── Root ─────────────────────────────────────────────────────
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}