# Layout System

This guide explains the layout system of the GlobalBank template, including how to customize headers, footers, navigation, and overall page layouts. The template uses a flexible layout system that allows for easy customization while maintaining consistency.

## Table of Contents

- [Layout Components Overview](#layout-components-overview)
- [Page Layout Component](#page-layout-component)
- [Header Customization](#header-customization)
- [Navigation Bar](#navigation-bar)
- [Footer Customization](#footer-customization)
- [Top Bar Component](#top-bar-component)
- [Responsive Design](#responsive-design)
- [Custom Layouts](#custom-layouts)

## Layout Components Overview

The template's layout system consists of several key components:

```
Layout Architecture:
├── PageLayout (Main wrapper)
│   ├── TopBar (Optional promotional bar)
│   ├── Header (Standard page header)
│   │   └── NavBar (Navigation component)
│   ├── Main (Page content)
│   └── Footer (Site footer)
└── HomePage (Special layout)
    ├── TopBar
    ├── Custom Header with NavBar
    ├── Main (Page sections)
    └── Footer
```

### Key Layout Files

- `src/components/layout/page-layout.jsx` - Main layout wrapper
- `src/components/layout/header.jsx` - Standard page header
- `src/components/layout/nav-bar.jsx` - Navigation component
- `src/components/layout/footer.jsx` - Site footer
- `src/components/common/top-bar.jsx` - Top promotional bar

## Page Layout Component

### Basic Usage

The `PageLayout` component (`src/components/layout/page-layout.jsx`) provides a consistent layout structure for most pages:

```jsx
import PageLayout from '@components/layout/page-layout';

function YourPage() {
  return (
    <PageLayout title="Your Page Title">
      <div className="container mx-auto px-4 py-16">
        {/* Your page content */}
      </div>
    </PageLayout>
  );
}
```

### PageLayout Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | - | Page content (required) |
| `title` | string | - | Page title for document.title |
| `showTopBar` | boolean | `true` | Show/hide top promotional bar |
| `showHeader` | boolean | `true` | Show/hide main header |
| `showFooter` | boolean | `true` | Show/hide footer |
| `className` | string | `''` | Additional CSS classes |

### Advanced PageLayout Usage

```jsx
<PageLayout
  title="Custom Page - GlobalBank"
  showTopBar={false}
  showHeader={true}
  showFooter={true}
  className="custom-page-styles"
>
  <YourContent />
</PageLayout>
```

## Header Customization

### Standard Header Structure

The standard header (`src/components/layout/header.jsx`) is simple and focused:

```jsx
function Header() {
  return (
    <header className="bg-darkPink-900">
      <div className="container mx-auto px-4">
        <NavBar theme="light" />
      </div>
    </header>
  );
}
```

### Customizing Header Background

Update the header background color:

```jsx
// Change from dark pink to your brand color
<header className="bg-your-brand-color">
```

### Adding Header Content

You can extend the header with additional content:

```jsx
function Header() {
  return (
    <header className="bg-darkPink-900">
      <div className="container mx-auto px-4">
        <NavBar theme="light" />
        {/* Add breadcrumbs, announcements, etc. */}
        <div className="py-4 border-t border-white/10">
          <Breadcrumbs />
        </div>
      </div>
    </header>
  );
}
```

### HomePage Header

The HomePage uses a special gradient header:

```jsx
<header className="bg-gradient-to-t from-pink-300 via-pink-700 to-darkPink-900">
  <div className="container mx-auto px-4">
    <NavBar theme="light" transparent />
    <HeroSection />
  </div>
</header>
```

## Navigation Bar

### NavBar Configuration

The NavBar component (`src/components/layout/nav-bar.jsx`) is highly configurable:

```jsx
<NavBar theme="light" />  // Light theme (white logo, for dark backgrounds)
<NavBar theme="dark" />   // Dark theme (black logo, for light backgrounds)
```

### Navigation Structure

```jsx
// Desktop Navigation
<ul className="hidden lg:flex gap-2 p-1 rounded-full bg-white/10">
  {navItems.map((item) => (
    <li key={item.to}>
      <Link to={item.to}>{item.label}</Link>
    </li>
  ))}
</ul>

// Mobile Navigation (hamburger menu)
<button className="lg:hidden" onClick={toggleMobileNav}>
  {/* Hamburger icon */}
</button>
```

### Customizing Navigation Styles

#### Desktop Navigation Styling

```jsx
// Current styling (rounded pill style)
<ul className="hidden lg:flex gap-2 p-1 rounded-full bg-white/10">

// Alternative: Simple horizontal list
<ul className="hidden lg:flex gap-8">
  {navItems.map((item) => (
    <li key={item.to}>
      <Link className="text-white hover:text-pink-300 transition-colors">
        {item.label}
      </Link>
    </li>
  ))}
</ul>
```

#### Mobile Navigation Customization

The mobile navigation is a slide-out panel. Customize its appearance:

```jsx
// Mobile nav container
<div className="fixed top-0 left-0 bottom-0 w-5/6 max-w-xs z-[9999]">
  <nav className="relative p-8 w-full h-full bg-white overflow-y-auto">
    {/* Navigation content */}
  </nav>
</div>
```

### Adding Authentication Links

The template includes authentication links:

```jsx
// Desktop sign-in link
<Link
  className="hidden lg:flex items-center gap-2 text-white hover:text-pink-500"
  to={getRouteByName('login')}
>
  <span className="text-sm font-medium">Sign in</span>
  <svg>{/* Arrow icon */}</svg>
</Link>
```

To add a "Get Started" button:

```jsx
<div className="hidden lg:flex items-center gap-4">
  <Link to="/register" className="btn btn-primary">
    Get Started
  </Link>
  <Link to="/login" className="text-white hover:text-pink-500">
    Sign in
  </Link>
</div>
```

## Footer Customization

### Footer Structure

The footer (`src/components/layout/footer.jsx`) includes:
- Logo
- Link columns
- Social media icons
- Copyright notice

```jsx
<footer className="bg-darkPink-900 py-20">
  <div className="container mx-auto px-4">
    <div className="pb-20 border-b border-white/30 mb-10">
      {/* Logo and link columns */}
    </div>
    <div className="flex justify-between items-center">
      {/* Copyright and social links */}
    </div>
  </div>
</footer>
```

### Customizing Footer Links

Update the footer navigation links:

```jsx
// Add new link column
<div className="w-full sm:w-1/2 lg:w-1/6 p-4">
  <ul className="flex flex-col gap-6">
    <li>
      <Link to="/services" className="text-white hover:text-opacity-70 text-xl">
        Services
      </Link>
    </li>
    <li>
      <Link to="/support" className="text-white hover:text-opacity-70 text-xl">
        Support
      </Link>
    </li>
  </ul>
</div>
```

### Social Media Links

Update social media links in the footer:

```jsx
<div className="flex flex-wrap gap-6">
  <a href="https://twitter.com/yourcompany">
    <img src="/images/social-twitter-x-logo.svg" alt="Follow us on X (Twitter)" />
  </a>
  <a href="https://linkedin.com/company/yourcompany">
    <img src="/images/social-linkedin-logo.svg" alt="Follow us on LinkedIn" />
  </a>
  {/* Add more social links */}
</div>
```

### Footer Newsletter Signup

Add a newsletter signup section:

```jsx
<div className="w-full lg:w-1/3 p-4">
  <h3 className="text-white text-xl font-semibold mb-4">Stay Updated</h3>
  <form className="flex gap-2">
    <input
      type="email"
      placeholder="Enter your email"
      className="flex-1 px-4 py-2 rounded"
    />
    <button className="btn btn-primary">Subscribe</button>
  </form>
</div>
```

## Top Bar Component

### Current Top Bar

The top bar (`src/components/common/top-bar.jsx`) displays a promotional message:

```jsx
<aside className="mb-0 py-3 bg-sweetPink-200 text-sweetPink-800 text-center">
  Want to learn how to build templates like this one? Visit{' '}
  <a href="https://www.pixelrocket.store" className="underline hover:no-underline">
    www.pixelrocket.store
  </a>
</aside>
```

### Customizing Top Bar

#### Change the Message

```jsx
<aside className="mb-0 py-3 bg-sweetPink-200 text-sweetPink-800 text-center">
  Free shipping on orders over $50! Use code FREESHIP{' '}
  <a href="/shop" className="underline hover:no-underline">
    Shop Now
  </a>
</aside>
```

#### Hide Top Bar

```jsx
// In any page component
<PageLayout showTopBar={false}>
  {/* Your content */}
</PageLayout>
```

#### Make Top Bar Dismissible

```jsx
import { useState } from 'react';

function TopBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <aside className="mb-0 py-3 bg-sweetPink-200 text-sweetPink-800 text-center relative">
      <span>Your promotional message</span>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-4 top-1/2 transform -translate-y-1/2"
      >
        ✕
      </button>
    </aside>
  );
}
```

## Responsive Design

### Breakpoints

The template uses Tailwind CSS breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px
- `3xl`: 1820px (custom)

### Mobile-First Navigation

```jsx
// Desktop navigation (hidden on mobile)
<ul className="hidden lg:flex">

// Mobile menu button (hidden on desktop)
<button className="lg:hidden">

// Mobile navigation panel
<div className="lg:hidden fixed top-0 left-0">
```

### Responsive Footer

```jsx
// Footer links stack on mobile, grid on desktop
<div className="w-full sm:w-1/2 lg:w-1/6 p-4">
```

## Custom Layouts

### Creating a Special Layout

For pages that need unique layouts (like landing pages):

```jsx
// src/components/layout/landing-layout.jsx
function LandingLayout({ children }) {
  return (
    <div className="antialiased bg-body text-body font-body">
      {/* Custom header for landing pages */}
      <header className="bg-gradient-custom">
        <NavBar theme="light" />
      </header>

      <main>{children}</main>

      {/* Simplified footer for landing pages */}
      <LandingFooter />
    </div>
  );
}
```

### Conditional Layout Rendering

```jsx
function ConditionalPage({ isLandingPage }) {
  if (isLandingPage) {
    return (
      <LandingLayout>
        <LandingContent />
      </LandingLayout>
    );
  }

  return (
    <PageLayout>
      <StandardContent />
    </PageLayout>
  );
}
```

### Layout Context

For complex layout state management:

```jsx
// src/contexts/layout-context.jsx
const LayoutContext = createContext();

export function LayoutProvider({ children }) {
  const [headerStyle, setHeaderStyle] = useState('standard');
  const [footerVisible, setFooterVisible] = useState(true);

  return (
    <LayoutContext.Provider value={{
      headerStyle,
      setHeaderStyle,
      footerVisible,
      setFooterVisible
    }}>
      {children}
    </LayoutContext.Provider>
  );
}
```

## Best Practices

### 1. Consistent Spacing
Use consistent padding and margins:
```jsx
<div className="container mx-auto px-4 py-16">
```

### 2. Responsive Images
```jsx
<img
  src="/images/logo-white.svg"
  alt="Company Logo"
  className="h-8 sm:h-10 lg:h-12"
/>
```

### 3. Accessible Navigation
```jsx
<nav aria-label="Main navigation">
  <ul role="menubar">
    <li role="none">
      <Link role="menuitem" to="/about">About</Link>
    </li>
  </ul>
</nav>
```

### 4. SEO-Friendly Structure
```jsx
<header>
  <nav>
    <h1 className="sr-only">Site Navigation</h1>
    {/* Navigation content */}
  </nav>
</header>
```

## Next Steps

- **[Customize components](components-guide.md)** - Learn about individual components
- **[Manage content](data-management.md)** - Update layout content via JSON
- **[Style layouts](styling-guide.md)** - Advanced styling techniques
- **[Optimize performance](loading-and-performance.md)** - Layout performance tips