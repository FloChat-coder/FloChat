# Routing and Pages

This guide explains how the GlobalBank template handles routing, how to add new pages, and how to configure navigation. The template uses React Router DOM 7.9.1 for client-side routing.

## Table of Contents

- [Router Setup](#router-setup)
- [Existing Routes](#existing-routes)
- [Adding New Pages](#adding-new-pages)
- [Navigation Configuration](#navigation-configuration)
- [Route Protection](#route-protection)
- [Dynamic Routes](#dynamic-routes)
- [Page Components Structure](#page-components-structure)

## Router Setup

The routing system is configured in `src/app/router.jsx` using React Router DOM's `createBrowserRouter`.

### Key Files
- `src/app/router.jsx` - Route definitions and configuration
- `src/app/provider.jsx` - Router provider setup
- `src/app/routes/` - Individual page components

### Router Configuration

```jsx
// src/app/router.jsx
import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Loading from '@components/common/loading';

// Lazy-loaded page components for better performance
const HomePage = lazy(() => import('@routes/home'));
const AboutPage = lazy(() => import('@routes/about'));
// ... more pages

// Suspense wrapper for loading states
const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={<Loading />}>
    {children}
  </Suspense>
);
```

### Route Creation Helper

The template includes a helper function to create routes consistently:

```jsx
const createRoute = (path, Component, name, label = null, showInNav = false) => ({
  path,
  name,
  label,
  showInNav,
  element: (
    <SuspenseWrapper>
      <Component />
    </SuspenseWrapper>
  ),
});
```

## Existing Routes

### Current Page Structure

| Route | Component | Navigation | Description |
|-------|-----------|------------|-------------|
| `/` | HomePage | ✅ Home | Landing page with hero and features |
| `/about` | AboutPage | ✅ About | Company information and team |
| `/pricing` | PricingPage | ✅ Pricing | Service pricing and plans |
| `/blog` | BlogPage | ✅ Blog | Blog listing page |
| `/blog/:slug` | BlogSinglePage | ❌ | Individual blog post |
| `/contact` | ContactPage | ✅ Contact | Contact form and information |
| `/login` | LoginPage | ❌ | User login form |
| `/register` | RegisterPage | ❌ | User registration form |

### Route Definitions

```jsx
// src/app/router.jsx:32-41
const routes = [
  createRoute('/', HomePage, 'home', 'Home', true),
  createRoute('/about', AboutPage, 'about', 'About', true),
  createRoute('/pricing', PricingPage, 'pricing', 'Pricing', true),
  createRoute('/blog', BlogPage, 'blog', 'Blog', true),
  createRoute('/blog/:slug', BlogSinglePage, 'blog-single'),
  createRoute('/contact', ContactPage, 'contact', 'Contact', true),
  createRoute('/login', LoginPage, 'login', 'Login'),
  createRoute('/register', RegisterPage, 'register', 'Register'),
];
```

## Adding New Pages

### Step 1: Create the Page Component

1. **Create a new page file** in `src/app/routes/`:
   ```jsx
   // src/app/routes/services.jsx
   import React, { useEffect } from 'react';
   import PageLayout from '@components/layout/page-layout';

   function ServicesPage() {
     useEffect(() => {
       document.title = 'Services - GlobalBank';
     }, []);

     return (
       <PageLayout>
         <div className="container mx-auto px-4 py-16">
           <h1 className="text-4xl font-bold text-center mb-8">Our Services</h1>
           {/* Your page content here */}
         </div>
       </PageLayout>
     );
   }

   export default ServicesPage;
   ```

### Step 2: Add Route to Router

1. **Import the new component** in `src/app/router.jsx`:
   ```jsx
   const ServicesPage = lazy(() => import('@routes/services'));
   ```

2. **Add the route definition**:
   ```jsx
   const routes = [
     // ... existing routes
     createRoute('/services', ServicesPage, 'services', 'Services', true),
   ];
   ```

### Step 3: Update Navigation (Optional)

If you want the page to appear in navigation, set `showInNav` to `true` in the `createRoute` call (as shown above).

### Step 4: Test Your New Route

```bash
npm run dev
```

Navigate to `http://localhost:5173/services` to see your new page.

## Navigation Configuration

### How Navigation Works

Navigation items are automatically generated from routes with `showInNav: true`:

```jsx
// src/app/router.jsx:58-63
export const getNavigationRoutes = () => {
  return routes.filter(route => route.showInNav).map(route => ({
    to: route.path,
    label: route.label,
    name: route.name
  }));
};
```

### Navigation Usage

The navigation system is used in:
- **Desktop navigation** (`src/components/layout/nav-bar.jsx:25`)
- **Mobile navigation** (`src/components/layout/nav-bar.jsx:89`)

### Customizing Navigation Order

To change navigation order, reorder the routes array:

```jsx
const routes = [
  createRoute('/', HomePage, 'home', 'Home', true),
  createRoute('/services', ServicesPage, 'services', 'Services', true), // New page
  createRoute('/about', AboutPage, 'about', 'About', true),
  createRoute('/pricing', PricingPage, 'pricing', 'Pricing', true),
  // ... other routes
];
```

### Hiding Routes from Navigation

Set `showInNav` to `false` or omit the parameter:

```jsx
createRoute('/private-page', PrivatePage, 'private', 'Private'), // Hidden from nav
```

## Route Protection

### Basic Authentication Check

To protect routes, you can create a wrapper component:

```jsx
// src/components/common/protected-route.jsx
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  const isAuthenticated = /* your auth logic */;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
```

### Using Protected Routes

```jsx
// In router.jsx
const createProtectedRoute = (path, Component, name, label, showInNav) => ({
  path,
  name,
  label,
  showInNav,
  element: (
    <SuspenseWrapper>
      <ProtectedRoute>
        <Component />
      </ProtectedRoute>
    </SuspenseWrapper>
  ),
});
```

## Dynamic Routes

### URL Parameters

The template includes an example with blog posts:

```jsx
// Route definition
createRoute('/blog/:slug', BlogSinglePage, 'blog-single')

// Usage in component
import { useParams } from 'react-router-dom';

function BlogSinglePage() {
  const { slug } = useParams();
  // Use slug to fetch specific blog post
}
```

### Route Helpers

The template provides utility functions for working with routes:

```jsx
// Get route path by name
const getRouteByName = (name) => {
  const route = routes.find(r => r.name === name);
  return route ? route.path : '/';
};

// Generate path with parameters
const generatePath = (name, params = {}) => {
  let path = getRouteByName(name);
  Object.keys(params).forEach(key => {
    path = path.replace(`:${key}`, params[key]);
  });
  return path;
};

// Usage examples
const homePath = getRouteByName('home'); // '/'
const blogPath = generatePath('blog-single', { slug: 'my-post' }); // '/blog/my-post'
```

## Page Components Structure

### Standard Page Structure

Most pages follow this pattern:

```jsx
import React, { useEffect } from 'react';
import PageLayout from '@components/layout/page-layout';

function YourPage() {
  // Set page title
  useEffect(() => {
    document.title = 'Page Title - GlobalBank';
  }, []);

  return (
    <PageLayout>
      {/* Your page content */}
    </PageLayout>
  );
}

export default YourPage;
```

### HomePage Exception

The HomePage has a unique structure with custom header:

```jsx
function HomePage() {
  return (
    <div className="antialiased bg-body text-body font-body">
      <TopBar />
      <header className="bg-gradient-to-t from-pink-300 via-pink-700 to-darkPink-900">
        <div className="container mx-auto px-4">
          <NavBar theme="light" transparent />
          <HeroSection />
        </div>
      </header>
      <main>
        {/* Page sections */}
      </main>
      <Footer />
    </div>
  );
}
```

### Page Layout Components

- **PageLayout** (`src/components/layout/page-layout.jsx`) - Standard layout with header and footer
- **NavBar** (`src/components/layout/nav-bar.jsx`) - Navigation component
- **Header** (`src/components/layout/header.jsx`) - Standard page header
- **Footer** (`src/components/layout/footer.jsx`) - Site footer

## Best Practices

### 1. Consistent Naming
- Route names: kebab-case (`'about-us'`)
- Component names: PascalCase (`AboutUsPage`)
- File names: kebab-case (`about-us.jsx`)

### 2. SEO Optimization
```jsx
useEffect(() => {
  document.title = 'Descriptive Page Title - GlobalBank';
  document.meta['description'] = 'Page description for SEO';
}, []);
```

### 3. Error Boundaries
The template includes error boundaries for robust error handling:

```jsx
// src/app/provider.jsx
<ErrorBoundary>
  <RouterProvider router={router} />
</ErrorBoundary>
```

### 4. Lazy Loading
All routes use lazy loading for better performance:

```jsx
const YourPage = lazy(() => import('@routes/your-page'));
```

## Troubleshooting

### Common Issues

1. **Route not found**: Ensure the route is properly defined in the routes array
2. **Navigation not updating**: Check that `showInNav` is set to `true`
3. **Component not loading**: Verify the lazy import path is correct
4. **Styling issues**: Ensure you're using the correct layout component

### Debugging Routes

```jsx
// Add this to see all registered routes
console.log('Registered routes:', routes);

// Check navigation routes
console.log('Navigation routes:', getNavigationRoutes());
```

## Next Steps

- **[Configure layouts](layout-system.md)** - Customize headers and footers
- **[Manage page content](data-management.md)** - Update page data
- **[Style your pages](styling-guide.md)** - Customize page appearance
- **[Add components](components-guide.md)** - Create reusable page elements