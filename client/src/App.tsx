import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layout/main-layout";
import Home from "@/pages/home";
import ProjectUpload from "@/pages/project-upload";
import AnalysisOverview from "@/pages/analysis-overview";
import RelationshipVisualization from "@/pages/relationship-visualization";
import Documentation from "@/pages/documentation";
import Download from "@/pages/download";
import AuthPage from "@/pages/auth-page";
import { ThemeProvider } from "@/context/theme-context";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/upload" component={ProjectUpload} />
      <ProtectedRoute path="/analysis/:id" component={AnalysisOverview} />
      <ProtectedRoute path="/visualization/:id" component={RelationshipVisualization} />
      <ProtectedRoute path="/documentation/:id" component={Documentation} />
      <ProtectedRoute path="/download/:id" component={Download} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <MainLayout>
              <Router />
            </MainLayout>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
