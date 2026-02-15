/* eslint-disable react-refresh/only-export-components */
import { Suspense, lazy } from 'react';
import { Outlet, createBrowserRouter } from 'react-router-dom';
import paths from './paths';
import MainLayout from 'layouts/main-layout';
import Splash from 'components/loading/Splash';
import PageLoader from 'components/loading/PageLoader';

// 1. Dashboard Import
const Dashboard = lazy(() => import('pages/dashboard'));

// 2. Integration Imports
const GoogleSheets = lazy(() => import('pages/integrations/GoogleSheets'));

// 3. AI Configuration Imports
const AiSettings = lazy(() => import('pages/ai-configuration/AiSettings'));

// Fallback App Component
const App = lazy(() => import('App'));

const router = createBrowserRouter(
  [
    {
      element: (
        <Suspense fallback={<Splash />}>
          <App />
        </Suspense>
      ),
      children: [
        {
          path: '/',
          element: (
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </MainLayout>
          ),
          children: [
            {
              index: true,
              element: <Dashboard />,
            },
            // --- FLOCHAT INTEGRATIONS ---
            {
              path: paths.integrations.googleSheets,
              element: <GoogleSheets />,
            },
            {
              path: paths.integrations.drive,
              element: <GoogleSheets />, // Placeholder until Drive page is built
            },
            // --- FLOCHAT AI SETTINGS ---
            {
              path: paths.ai.prompt,
              element: <AiSettings />,
            },
            {
              path: paths.ai.apiKeys,
              element: <AiSettings />, // Placeholder until API Key page is built
            },
          ],
        },
      ],
    },
    {
      path: '*',
      element: <Dashboard />,
    },
  ],
  {
    // IMPORTANT: If running on localhost, change this to '/'
    // If deploying to a specific folder (like GitHub Pages), keep '/dashdarkX'
    basename: '/dashdarkX', 
  },
);

export default router;