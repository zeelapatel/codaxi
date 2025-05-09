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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/upload" component={ProjectUpload} />
      <Route path="/analysis/:id" component={AnalysisOverview} />
      <Route path="/visualization/:id" component={RelationshipVisualization} />
      <Route path="/documentation/:id" component={Documentation} />
      <Route path="/download/:id" component={Download} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MainLayout>
          <Router />
        </MainLayout>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
