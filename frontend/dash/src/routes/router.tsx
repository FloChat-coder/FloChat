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

// 4. Inbox
const Inbox = lazy(() => import('pages/inbox/Inbox'));

// Chats
const Chats = lazy(() => import('pages/chats/Chats'));

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
              // CHANGED: Only one path mapped to AiSettings now
              path: paths.aiSettings,
              element: <AiSettings />,
            },
            {
              path: paths.inbox,
              element: <Inbox />,
            },
            {
              path: paths.chats,
              element: <Chats />,
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
    basename: '/dashboard', 
  },
);

export default router;