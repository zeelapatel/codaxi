import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, RouteProps } from "wouter";
import { FC } from "react";

type ProtectedRouteProps = {
  path: string;
  component: FC<any>;
};

export function ProtectedRoute({ 
  path, 
  component: Component 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  return (
    <Route
      path={path}
      component={(params) => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        if (!user) {
          return <Redirect to="/auth" />;
        }

        return <Component {...params} />;
      }}
    />
  );
}