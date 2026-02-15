import sitemap from 'routes/sitemap';

export const topListData = sitemap.filter((item) => {
  // Everything goes to top list EXCEPT settings
  return item.id !== 'settings';
});

export const bottomListData = sitemap.filter(() => {
  // Can add 'help' or 'logout' here later
  return false; 
});

export const profileListData = sitemap.find((item) => item.id === 'settings');