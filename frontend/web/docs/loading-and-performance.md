# Loading and Performance

This guide covers loading states, performance optimization, and best practices for maintaining fast, responsive user experience in the GlobalBank template.

## Table of Contents

- [Loading States](#loading-states)
- [Performance Optimization](#performance-optimization)
- [Code Splitting](#code-splitting)
- [Image Optimization](#image-optimization)
- [Bundle Analysis](#bundle-analysis)
- [Lazy Loading](#lazy-loading)
- [Caching Strategies](#caching-strategies)
- [Monitoring Performance](#monitoring-performance)

## Loading States

The GlobalBank template implements several loading patterns to provide smooth user experience during data fetching and page transitions.

### Loading Component

**Location**: `src/components/common/loading.jsx`

The base loading component provides a consistent spinner across the application:

```jsx
function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );
}
```

### Customizing Loading Spinner

#### Different Sizes

```jsx
function Loading({ size = 'default' }) {
  const sizeClasses = {
    small: 'h-6 w-6',
    default: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className={`animate-spin rounded-full border-b-2 border-pink-600 ${sizeClasses[size]}`}></div>
    </div>
  );
}

// Usage
<Loading size="small" />
<Loading size="large" />
```

#### Custom Loading Messages

```jsx
function Loading({ message = 'Loading...', showMessage = false }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mb-4"></div>
      {showMessage && (
        <p className="text-gray-600 text-sm">{message}</p>
      )}
    </div>
  );
}

// Usage
<Loading message="Loading blog posts..." showMessage={true} />
```

#### Skeleton Loading

For better perceived performance, implement skeleton screens:

```jsx
function BlogPostSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
    </div>
  );
}

// Usage in blog list
{loading ? (
  Array.from({ length: 6 }).map((_, i) => (
    <BlogPostSkeleton key={i} />
  ))
) : (
  blogPosts.map(post => <BlogPost key={post.id} post={post} />)
)}
```

### Route-Level Loading

The template uses Suspense for route-level loading:

```jsx
// src/app/router.jsx
const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={<Loading />}>
    {children}
  </Suspense>
);

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

## Performance Optimization

### React Performance

#### Memoization

Use React.memo for expensive components:

```jsx
import { memo } from 'react';

const ExpensiveComponent = memo(({ data, options }) => {
  // Expensive rendering logic
  return <div>{/* Component content */}</div>;
});

// Only re-render when data or options change
```

#### useMemo and useCallback

Optimize expensive calculations and event handlers:

```jsx
import { useMemo, useCallback } from 'react';

function BlogList({ posts, filters }) {
  // Memoize expensive filtering operation
  const filteredPosts = useMemo(() => {
    return posts.filter(post =>
      filters.categories.includes(post.category) &&
      post.title.toLowerCase().includes(filters.search.toLowerCase())
    );
  }, [posts, filters]);

  // Memoize event handlers
  const handlePostClick = useCallback((postId) => {
    navigate(`/blog/${postId}`);
  }, [navigate]);

  return (
    <div>
      {filteredPosts.map(post => (
        <BlogPost
          key={post.id}
          post={post}
          onClick={handlePostClick}
        />
      ))}
    </div>
  );
}
```

### Component Optimization

#### Avoid Inline Objects and Functions

```jsx
// ❌ Bad - Creates new objects on every render
<Component style={{ marginTop: 10 }} onClick={() => doSomething()} />

// ✅ Good - Define outside render or memoize
const style = { marginTop: 10 };
const handleClick = useCallback(() => doSomething(), []);

<Component style={style} onClick={handleClick} />
```

#### List Optimization

Use proper keys and consider virtualization for long lists:

```jsx
// ✅ Good - Stable, unique keys
{posts.map(post => (
  <BlogPost key={post.id} post={post} />
))}

// For very long lists, consider react-window
import { FixedSizeList as List } from 'react-window';

function VirtualizedList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <BlogPost post={items[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={150}
    >
      {Row}
    </List>
  );
}
```

## Code Splitting

The template implements code splitting at the route level using React.lazy:

### Current Implementation

```jsx
// src/app/router.jsx
const HomePage = lazy(() => import('@routes/home'));
const AboutPage = lazy(() => import('@routes/about'));
const PricingPage = lazy(() => import('@routes/pricing'));
```

### Component-Level Code Splitting

For large components, implement additional splitting:

```jsx
// Lazy load heavy components
const HeavyChart = lazy(() => import('./heavy-chart'));
const DataTable = lazy(() => import('./data-table'));

function Dashboard() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>
        Show Chart
      </button>

      {showChart && (
        <Suspense fallback={<div>Loading chart...</div>}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}
```

### Dynamic Imports

For conditional feature loading:

```jsx
async function loadAdvancedFeatures() {
  const { AdvancedAnalytics } = await import('./advanced-analytics');
  return AdvancedAnalytics;
}

// Use in component
const [AdvancedComponent, setAdvancedComponent] = useState(null);

useEffect(() => {
  if (user.isPremium) {
    loadAdvancedFeatures().then(setAdvancedComponent);
  }
}, [user.isPremium]);
```

## Image Optimization

### Image Formats and Compression

1. **Use modern formats**: WebP for photos, SVG for graphics
2. **Optimize file sizes**: Compress images before adding to `public/images/`
3. **Provide multiple resolutions**: For different screen densities

```jsx
// Responsive images
<img
  src="/images/hero-dashboard-pink-2.png"
  srcSet="
    /images/hero-dashboard-pink-2-mobile.png 480w,
    /images/hero-dashboard-pink-2-tablet.png 768w,
    /images/hero-dashboard-pink-2.png 1200w
  "
  sizes="(max-width: 480px) 480px, (max-width: 768px) 768px, 1200px"
  alt="Dashboard preview"
  loading="lazy"
/>
```

### Lazy Loading Images

```jsx
function LazyImage({ src, alt, className, ...props }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={className}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      )}
    </div>
  );
}
```

### Image Placeholder

```jsx
function ImageWithPlaceholder({ src, alt, className }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {!imageLoaded && !imageFailed && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      <img
        src={src}
        alt={alt}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageFailed(true)}
        className={`${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      />

      {imageFailed && (
        <div className="absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center">
          <span className="text-gray-500 text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  );
}
```

## Bundle Analysis

### Analyzing Your Bundle

```bash
# Build the project
npm run build

# Analyze bundle size (if you add bundle analyzer)
npm install --save-dev @rollup/plugin-analyzer

# Or use webpack-bundle-analyzer for detailed analysis
npx webpack-bundle-analyzer dist/static/js/*.js
```

### Vite Bundle Analysis

Add to `vite.config.js`:

```js
import { defineConfig } from 'vite';
import { analyzer } from '@rollup/plugin-analyzer';

export default defineConfig({
  plugins: [
    // ... other plugins
    analyzer({ summaryOnly: true })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@headlessui/react', '@heroicons/react']
        }
      }
    }
  }
});
```

## Lazy Loading

### Route-Based Lazy Loading

Already implemented in the template:

```jsx
// Lazy load entire pages
const HomePage = lazy(() => import('@routes/home'));
const AboutPage = lazy(() => import('@routes/about'));
```

### Component-Based Lazy Loading

```jsx
// Lazy load sections within pages
const TestimonialsSection = lazy(() =>
  import('@features/home/components/testimonials-section')
);

function HomePage() {
  return (
    <div>
      <HeroSection />
      <FeaturesSection />

      {/* Lazy load below-the-fold content */}
      <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse" />}>
        <TestimonialsSection />
      </Suspense>
    </div>
  );
}
```

### Intersection Observer for Progressive Loading

```jsx
function useProgressiveLoading() {
  const [sectionsToLoad, setSectionsToLoad] = useState([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setSectionsToLoad(prev => [...prev, entry.target.dataset.section]);
          }
        });
      },
      { rootMargin: '100px' }
    );

    document.querySelectorAll('[data-section]').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return sectionsToLoad;
}
```

## Caching Strategies

### Browser Caching

Configure proper cache headers in your deployment:

```js
// For static assets (in your server config)
{
  test: /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/,
  headers: [
    {
      key: 'Cache-Control',
      value: 'public, max-age=31536000, immutable'
    }
  ]
}
```

### Service Worker Caching

Add a service worker for offline caching:

```js
// public/sw.js
const CACHE_NAME = 'globalbank-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/images/logo-white.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

### Memory Caching

Implement in-memory caching for expensive operations:

```jsx
const cache = new Map();

function useExpensiveCalculation(input) {
  return useMemo(() => {
    const cacheKey = JSON.stringify(input);

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    const result = performExpensiveCalculation(input);
    cache.set(cacheKey, result);

    return result;
  }, [input]);
}
```

## Monitoring Performance

### Web Vitals

Monitor Core Web Vitals:

```jsx
// src/utils/web-vitals.js
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics service
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### Performance API

Monitor runtime performance:

```jsx
function usePerformanceMonitor() {
  useEffect(() => {
    // Monitor navigation timing
    const navigation = performance.getEntriesByType('navigation')[0];
    console.log('Page load time:', navigation.loadEventEnd - navigation.loadEventStart);

    // Monitor resource loading
    const resources = performance.getEntriesByType('resource');
    resources.forEach(resource => {
      if (resource.duration > 1000) {
        console.warn('Slow resource:', resource.name, resource.duration);
      }
    });
  }, []);
}
```

### Custom Performance Hooks

```jsx
function useRenderTime(componentName) {
  useEffect(() => {
    const start = performance.now();

    return () => {
      const end = performance.now();
      console.log(`${componentName} render time:`, end - start);
    };
  });
}

// Usage in components
function ExpensiveComponent() {
  useRenderTime('ExpensiveComponent');

  // Component logic
  return <div>...</div>;
}
```

## Performance Checklist

### Development

- [ ] Use React DevTools Profiler to identify slow components
- [ ] Implement proper loading states
- [ ] Optimize re-renders with memo, useMemo, useCallback
- [ ] Use React.lazy for code splitting
- [ ] Optimize images and use lazy loading
- [ ] Monitor bundle size

### Production

- [ ] Enable gzip/brotli compression
- [ ] Configure proper cache headers
- [ ] Use a CDN for static assets
- [ ] Implement service worker for offline functionality
- [ ] Monitor Core Web Vitals
- [ ] Set up performance budgets

### Code Quality

- [ ] Avoid unnecessary re-renders
- [ ] Use proper keys for lists
- [ ] Implement error boundaries
- [ ] Clean up event listeners and subscriptions
- [ ] Use production builds for deployment

## Next Steps

- **[Style optimization](styling-guide.md)** - CSS and styling performance
- **[Deployment optimization](deployment.md)** - Production performance setup
- **[Troubleshooting](troubleshooting.md)** - Debug performance issues
- **[Component optimization](components-guide.md)** - Component-specific performance tips