import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import ErrorBoundary from '@components/common/error-boundary';

export function AppProvider() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}