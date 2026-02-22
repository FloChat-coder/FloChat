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
  aiSettings: `/${rootPaths.pagesRoot}/ai-settings`,
  leads: `/${rootPaths.pagesRoot}/leads`,
  inbox: `/${rootPaths.pagesRoot}/inbox`,
  analytics: `/${rootPaths.pagesRoot}/analytics`,
  widget: `/${rootPaths.pagesRoot}/widget`,
  settings: `/${rootPaths.pagesRoot}/settings`,

  // External Auth Paths
  login: 'https://flochat.com/signin',
  signup: 'https://flochat.com/register',

  404: `/${rootPaths.errorRoot}/404`,
};