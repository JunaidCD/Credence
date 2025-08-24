import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./context/AuthContext.jsx";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing.jsx";
import UserDashboard from "@/pages/UserDashboard.jsx";
import VerifierDashboard from "@/pages/VerifierDashboard.jsx";
import IssuerDashboard from "@/pages/IssuerDashboard.jsx";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard/user" component={UserDashboard} />
      <Route path="/dashboard/verifier" component={VerifierDashboard} />
      <Route path="/dashboard/issuer" component={IssuerDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen gradient-bg">
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;