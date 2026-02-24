/* eslint-disable react-refresh/only-export-components */
import { Suspense, lazy } from 'react';
import { Outlet, createBrowserRouter } from 'react-router-dom';
import paths from './paths';
import MainLayout from 'layouts/main-layout';
import Splash from 'components/loading/Splash';
import PageLoader from 'components/loading/PageLoader';

// --- Imports ---
const Dashboard = lazy(() => import('pages/dashboard'));
const GoogleSheets = lazy(() => import('pages/integrations/GoogleSheets'));
const AiSettings = lazy(() => import('pages/ai-configuration/AiSettings'));
const Inbox = lazy(() => import('pages/inbox/Inbox'));
const Chats = lazy(() => import('pages/chats/Chats'));
const Leads = lazy(() => import('pages/leads/Leads'));
const Analytics = lazy(() => import('pages/analytics/Analytics')); // <-- Ensure this is imported!
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
          // EVERYTHING INSIDE THIS MAINLAYOUT BLOCK GETS THE SIDEBAR
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
            {
              path: paths.integrations.googleSheets,
              element: <GoogleSheets />,
            },
            {
              path: paths.integrations.drive,
              element: <GoogleSheets />,
            },
            {
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
            {
              path: paths.leads,
              element: <Leads />,
            },
            {
              path: paths.analytics,
              element: <Analytics />, // <-- Placed securely inside MainLayout!
            },
          ],
        },
      ],
    },
    {
      path: '*',
      element: (
        <MainLayout>
          <Dashboard />
        </MainLayout>
      ),
    },
  ],
  {
    basename: '/dashboard', 
  }
);

export default router;