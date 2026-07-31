import { Redirect, Route, type RouteProps } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAdminAuth } from '../hooks/useAdminAuth';
import { AdminLoading } from '../components/common/AdminState';

type ProtectedAdminRouteProps = Omit<RouteProps, 'render' | 'children'> & {
  children: ReactNode;
};

export function ProtectedAdminRoute({ children, ...props }: ProtectedAdminRouteProps) {
  const { session, isLoading } = useAdminAuth();

  return (
    <Route
      {...props}
      render={({ location }) => {
        if (isLoading) return <AdminLoading />;
        if (!session) return <Redirect to={{ pathname: '/admin/login', state: { from: location } }} />;
        return children;
      }}
    />
  );
}
