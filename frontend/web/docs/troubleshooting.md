# Troubleshooting

This comprehensive troubleshooting guide helps you identify, diagnose, and resolve common issues you might encounter while working with the GlobalBank React template.

## Table of Contents

- [Development Environment Issues](#development-environment-issues)
- [Build and Deployment Issues](#build-and-deployment-issues)
- [Runtime Errors](#runtime-errors)
- [Styling and Layout Issues](#styling-and-layout-issues)
- [Performance Problems](#performance-problems)
- [Data and Component Issues](#data-and-component-issues)
- [Browser Compatibility](#browser-compatibility)
- [Debugging Tools and Techniques](#debugging-tools-and-techniques)

## Development Environment Issues

### Node.js and npm Issues

#### Issue: "node: command not found"

**Solution**:
```bash
# Install Node.js (visit nodejs.org)
# Or use a version manager like nvm

# Install nvm (macOS/Linux)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node.js
nvm install 18
nvm use 18
```

#### Issue: "npm ERR! peer dep missing"

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# If peer dependency issues persist
npm install --legacy-peer-deps
```

#### Issue: "Module not found" errors

**Solution**:
```bash
# Check if path aliases are correct in vite.config.js
# Verify imports use correct paths:

// ✅ Correct
import Button from '@components/ui/button';

// ❌ Incorrect
import Button from '../../../components/ui/button';
```

### Development Server Issues

#### Issue: "EADDRINUSE: address already in use"

**Solution**:
```bash
# Find process using port 5173
lsof -ti:5173

# Kill the process
kill -9 $(lsof -ti:5173)

# Or use a different port
npm run dev -- --port 3000
```

#### Issue: Hot Module Replacement not working

**Solution**:
```js
// vite.config.js
export default defineConfig({
  server: {
    hmr: {
      overlay: true
    }
  }
})
```

#### Issue: "Failed to resolve import" errors

**Solution**:
```bash
# Check file extensions and case sensitivity
# Ensure imports match actual file names

// Check these common issues:
// 1. File extension missing
import Component from './component';  // Add .jsx if needed

// 2. Incorrect case
import button from './Button';  // Should match actual filename case

// 3. Path alias not configured
// Verify vite.config.js aliases are correct
```

## Build and Deployment Issues

### Build Failures

#### Issue: "Build failed with errors"

**Diagnostic Steps**:
```bash
# Run build with verbose output
npm run build -- --debug

# Check for TypeScript errors (if using TypeScript)
npx tsc --noEmit

# Run linting
npm run lint
```

**Common Solutions**:
```bash
# 1. Clear build cache
rm -rf dist node_modules/.vite

# 2. Update dependencies
npm update

# 3. Check for syntax errors
npm run lint
```

#### Issue: "out of memory" during build

**Solution**:
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Or add to package.json scripts
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' vite build"
  }
}
```

#### Issue: Bundle size too large

**Diagnostic**:
```bash
# Analyze bundle
npx vite-bundle-analyzer dist/assets/*.js

# Check what's included
npm run build && ls -lah dist/assets/
```

**Solutions**:
```js
// vite.config.js - Enable code splitting
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    }
  }
})
```

### Deployment Issues

#### Issue: "404 errors on page refresh"

**Problem**: Single Page Application routing not configured on server.

**Solutions**:

```nginx
# Nginx configuration
location / {
  try_files $uri $uri/ /index.html;
}
```

```apache
# Apache .htaccess
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

```json
// Vercel vercel.json
{
  "routes": [
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

#### Issue: Assets not loading after deployment

**Solutions**:
```js
// vite.config.js - Set correct base URL
export default defineConfig({
  base: '/your-subdirectory/', // If deployed to subdirectory
  // or
  base: '/', // For root domain
})
```

## Runtime Errors

### JavaScript Errors

#### Issue: "Cannot read property of undefined"

**Common Causes and Solutions**:

```jsx
// ❌ Problem: Data not loaded yet
function Component({ user }) {
  return <div>{user.name}</div>; // Error if user is undefined
}

// ✅ Solution: Add null checks
function Component({ user }) {
  if (!user) return <div>Loading...</div>;
  return <div>{user.name}</div>;
}

// ✅ Alternative: Optional chaining
function Component({ user }) {
  return <div>{user?.name || 'Loading...'}</div>;
}
```

#### Issue: "React Hook useEffect has missing dependency"

**Solution**:
```jsx
// ❌ Problem: Missing dependency
useEffect(() => {
  fetchData(userId);
}, []); // userId should be in dependency array

// ✅ Solution: Add all dependencies
useEffect(() => {
  fetchData(userId);
}, [userId]);

// ✅ Alternative: Use useCallback for functions
const fetchUserData = useCallback((id) => {
  // fetch logic
}, []);

useEffect(() => {
  fetchUserData(userId);
}, [fetchUserData, userId]);
```

#### Issue: "Maximum update depth exceeded"

**Common Causes**:
```jsx
// ❌ Problem: Infinite re-render
function Component() {
  const [count, setCount] = useState(0);

  // This runs on every render!
  setCount(count + 1);

  return <div>{count}</div>;
}

// ✅ Solution: Use useEffect
function Component() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(count + 1);
  }, []); // Run only once

  return <div>{count}</div>;
}
```

### Route-Related Errors

#### Issue: "Cannot GET /about" on page refresh

**Problem**: Server doesn't handle client-side routing.

**Solution**: Configure server to serve `index.html` for all routes (see deployment section above).

#### Issue: Routes not updating

**Diagnostic**:
```jsx
// Check if router is properly configured
import { createBrowserRouter } from 'react-router-dom';

// Verify routes array is correct
const routes = [
  { path: '/', element: <HomePage /> },
  { path: '/about', element: <AboutPage /> }
];

// Check for exact path matching
{ path: '/blog/:slug', element: <BlogPost /> } // Should match /blog/any-slug
```

## Styling and Layout Issues

### Tailwind CSS Issues

#### Issue: Tailwind classes not applying

**Solutions**:
```bash
# 1. Check if Tailwind is properly imported
# Verify src/index.css contains:
@import "tailwindcss";

# 2. Clear build cache
rm -rf node_modules/.vite

# 3. Restart development server
npm run dev
```

#### Issue: Custom colors not working

**Check configuration**:
```css
/* src/index.css */
@theme {
  --color-brand-500: #your-color; /* Make sure this is defined */
}
```

```jsx
// Usage
<div className="bg-brand-500">Content</div> // Should work
```

#### Issue: Responsive classes not working

**Diagnostic**:
```jsx
// ✅ Correct responsive syntax
<div className="text-sm md:text-lg lg:text-xl">

// ❌ Incorrect
<div className="md:text-lg text-sm lg:text-xl"> // Order doesn't matter in Tailwind 3+
```

### Layout Issues

#### Issue: Content overflowing on mobile

**Solutions**:
```jsx
// Add proper responsive containers
<div className="container mx-auto px-4"> // Adds horizontal padding
  <div className="max-w-4xl mx-auto"> // Limits max width
    Content
  </div>
</div>

// Ensure images are responsive
<img className="w-full h-auto" src="..." alt="..." />
```

#### Issue: Flexbox/Grid layout problems

**Common fixes**:
```jsx
// Flex container issues
<div className="flex flex-col md:flex-row"> // Responsive flex direction
  <div className="flex-1">Item 1</div> // Equal flex
  <div className="flex-1">Item 2</div>
</div>

// Grid issues
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</div>
```

## Performance Problems

### Slow Loading

#### Issue: Large bundle size

**Diagnostic**:
```bash
# Analyze what's in your bundle
npm run build
npx vite-bundle-analyzer dist/assets/*.js
```

**Solutions**:
```jsx
// 1. Implement code splitting
const LazyComponent = lazy(() => import('./LazyComponent'));

// 2. Optimize images
<img
  src="/images/optimized-image.webp"
  loading="lazy"
  alt="Description"
/>

// 3. Remove unused dependencies
npm uninstall unused-package
```

#### Issue: Slow component rendering

**Solutions**:
```jsx
// 1. Use React.memo for expensive components
const ExpensiveComponent = memo(({ data }) => {
  return <div>{/* expensive rendering */}</div>;
});

// 2. Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// 3. Optimize list rendering
{items.map(item => (
  <Item key={item.id} item={item} /> // Stable keys
))}
```

### Memory Leaks

#### Issue: Memory usage keeps increasing

**Common Causes and Solutions**:
```jsx
// ❌ Problem: Event listeners not cleaned up
useEffect(() => {
  window.addEventListener('scroll', handleScroll);
  // Missing cleanup!
}, []);

// ✅ Solution: Cleanup event listeners
useEffect(() => {
  window.addEventListener('scroll', handleScroll);
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}, [handleScroll]);

// ❌ Problem: Timers not cleared
useEffect(() => {
  const timer = setTimeout(() => {
    // do something
  }, 1000);
  // Missing cleanup!
}, []);

// ✅ Solution: Clear timers
useEffect(() => {
  const timer = setTimeout(() => {
    // do something
  }, 1000);
  return () => clearTimeout(timer);
}, []);
```

## Data and Component Issues

### State Management Issues

#### Issue: State not updating

**Common Causes**:
```jsx
// ❌ Problem: Mutating state directly
const [items, setItems] = useState([]);

const addItem = (newItem) => {
  items.push(newItem); // Don't mutate directly!
  setItems(items);
};

// ✅ Solution: Create new array
const addItem = (newItem) => {
  setItems([...items, newItem]);
};

// ✅ For objects
const updateUser = (updates) => {
  setUser({ ...user, ...updates });
};
```

#### Issue: Props not updating child components

**Solution**:
```jsx
// Check if you're comparing objects correctly
const ChildComponent = memo(({ data }) => {
  return <div>{data.name}</div>;
});

// ❌ This will cause unnecessary re-renders
<ChildComponent data={{ name: 'John' }} />

// ✅ Define data outside render or use useMemo
const userData = useMemo(() => ({ name: 'John' }), []);
<ChildComponent data={userData} />
```

### API and Data Fetching Issues

#### Issue: "CORS errors" when calling APIs

**Solutions**:
```js
// 1. Configure Vite proxy for development
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://api.example.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})

// 2. Add CORS headers on your API server
// 3. Use JSONP for read-only data (if applicable)
```

#### Issue: Data not loading

**Diagnostic Steps**:
```jsx
// Add debugging to data fetching
useEffect(() => {
  console.log('Fetching data...');
  fetchData()
    .then(data => {
      console.log('Data received:', data);
      setData(data);
    })
    .catch(error => {
      console.error('Fetch error:', error);
      setError(error);
    });
}, []);
```

## Browser Compatibility

### IE11 Support (if needed)

**Issues and Solutions**:
```js
// vite.config.js - Add polyfills if needed
export default defineConfig({
  build: {
    target: 'es2015', // or 'es5' for wider support
    polyfillModulePreload: false
  }
})
```

### Safari-Specific Issues

#### Issue: Date parsing errors

```jsx
// ❌ Problem: Safari doesn't parse "YYYY-MM-DD" format
const date = new Date('2023-12-25'); // Works in Chrome, fails in Safari

// ✅ Solution: Use ISO format or Date constructor
const date = new Date('2023-12-25T00:00:00.000Z');
// or
const date = new Date(2023, 11, 25); // Month is 0-indexed
```

### Mobile Browser Issues

#### Issue: Touch events not working

```jsx
// Add touch event handlers
<div
  onTouchStart={handleTouchStart}
  onTouchEnd={handleTouchEnd}
  onClick={handleClick} // Fallback for non-touch devices
>
  Touchable element
</div>
```

## Debugging Tools and Techniques

### Browser DevTools

#### React Developer Tools

1. Install React DevTools browser extension
2. Use the Components tab to inspect component props/state
3. Use the Profiler tab to identify performance bottlenecks

#### Performance Debugging

```jsx
// Add performance marks
useEffect(() => {
  performance.mark('component-render-start');

  return () => {
    performance.mark('component-render-end');
    performance.measure(
      'component-render',
      'component-render-start',
      'component-render-end'
    );
  };
});
```

### Console Debugging

#### Debugging state changes

```jsx
// Add useEffect to log state changes
useEffect(() => {
  console.log('State changed:', { user, loading, error });
}, [user, loading, error]);
```

#### Debugging renders

```jsx
// Add console.log to track renders
function Component(props) {
  console.log('Component rendered with props:', props);
  return <div>...</div>;
}
```

### Error Boundaries for Debugging

```jsx
class DebugErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    // Send to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // errorReportingService.log(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            <summary>Error details (click to expand)</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
          <button onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Network Debugging

```jsx
// Debug API calls
const apiCall = async (url, options) => {
  console.log('API call:', url, options);

  try {
    const response = await fetch(url, options);
    console.log('API response:', response.status, response.statusText);

    const data = await response.json();
    console.log('API data:', data);

    return data;
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
};
```

## Getting Help

### Community Resources

1. **React Documentation**: https://react.dev/
2. **Vite Documentation**: https://vitejs.dev/
3. **Tailwind CSS Documentation**: https://tailwindcss.com/
4. **Stack Overflow**: Tag questions with `reactjs`, `vite`, `tailwindcss`
5. **React Discord**: https://discord.gg/react
6. **GitHub Issues**: Check the template repository for known issues

### Creating Good Bug Reports

When reporting issues, include:

1. **Environment information**:
   ```bash
   node --version
   npm --version
   # Browser version
   # Operating system
   ```

2. **Steps to reproduce**:
   - What you did
   - What you expected
   - What actually happened

3. **Code samples**:
   - Minimal reproducible example
   - Relevant configuration files

4. **Error messages**:
   - Full error text
   - Browser console errors
   - Network tab information

### Debugging Checklist

When encountering issues:

- [ ] Check browser console for errors
- [ ] Verify Node.js and npm versions
- [ ] Clear cache and restart development server
- [ ] Check network tab for failed requests
- [ ] Verify file paths and imports
- [ ] Test in incognito/private browsing mode
- [ ] Check for typos in configuration files
- [ ] Ensure all dependencies are installed
- [ ] Try with a fresh npm install
- [ ] Test in different browsers

Remember: Most issues have simple solutions. Start with the basics (restart server, clear cache) before diving into complex debugging.