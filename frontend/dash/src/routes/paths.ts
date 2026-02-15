export const rootPaths = {
  root: '/',
  pagesRoot: 'pages',
  errorRoot: 'error',
  authRoot: 'authentication'
};

export default {
  dashboard: `/${rootPaths.pagesRoot}/dashboard`,
  
  // FloChat Internal Paths
  integrations: {
    googleSheets: `/${rootPaths.pagesRoot}/integrations/google-sheets`,
    drive: `/${rootPaths.pagesRoot}/integrations/drive`,
  },
  ai: {
    prompt: `/${rootPaths.pagesRoot}/ai/prompt`,
    apiKeys: `/${rootPaths.pagesRoot}/ai/api-keys`,
  },
  leads: `/${rootPaths.pagesRoot}/leads`,
  analytics: `/${rootPaths.pagesRoot}/analytics`,
  widget: `/${rootPaths.pagesRoot}/widget`,
  settings: `/${rootPaths.pagesRoot}/settings`,

  // External Auth (Handled by GlobalBank app)
  login: 'https://flochat.com/signin',
  signup: 'https://flochat.com/register',

  404: `/${rootPaths.errorRoot}/404`,
};