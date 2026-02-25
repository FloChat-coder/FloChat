export const rootPaths = {
  root: '/',
  pagesRoot: 'pages',
  errorRoot: 'error',
  authRoot: 'authentication'
};

const paths = {
  dashboard: `/${rootPaths.pagesRoot}/dashboard`,
  
  // FloChat Internal Paths
  integrations: {
    all: `/${rootPaths.pagesRoot}/integrations/all`,
    googleSheets: `/${rootPaths.pagesRoot}/integrations/google-sheets`,
    drive: `/${rootPaths.pagesRoot}/integrations/drive`,
  },
  aiSettings: `/${rootPaths.pagesRoot}/ai-settings`,
  leads: `/${rootPaths.pagesRoot}/leads`,
  chats: `/${rootPaths.pagesRoot}/chats`,
  inbox: `/${rootPaths.pagesRoot}/inbox`,
  analytics: `/${rootPaths.pagesRoot}/analytics`,
  widget: `/${rootPaths.pagesRoot}/widget`,
  settings: `/${rootPaths.pagesRoot}/settings`,

  // External Auth Paths
  login: 'https://flochat.com/signin',
  signup: 'https://flochat.com/register',

  404: `/${rootPaths.errorRoot}/404`,
};

export default paths;