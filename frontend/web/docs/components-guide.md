# Components Guide

This comprehensive guide explains the component architecture of the GlobalBank template, how to use existing components, and how to create new ones. The template follows a modular component structure for maximum reusability and maintainability.

## Table of Contents

- [Component Architecture](#component-architecture)
- [Component Categories](#component-categories)
- [UI Components](#ui-components)
- [Layout Components](#layout-components)
- [Common Components](#common-components)
- [Feature Components](#feature-components)
- [Creating Custom Components](#creating-custom-components)
- [Component Props and Usage](#component-props-and-usage)
- [Best Practices](#best-practices)

## Component Architecture

The GlobalBank template uses a hierarchical component structure:

```
src/components/
├── common/          # Shared utility components
│   ├── error-boundary.jsx
│   ├── loading.jsx
│   └── top-bar.jsx
├── layout/          # Layout and structural components
│   ├── header.jsx
│   ├── nav-bar.jsx
│   ├── footer.jsx
│   └── page-layout.jsx
└── ui/              # Basic UI building blocks
    ├── button.jsx
    ├── card.jsx
    ├── input.jsx
    └── index.js

src/features/        # Feature-specific components
├── home/
│   └── components/
├── auth/
│   └── components/
├── pricing/
│   └── components/
└── [feature]/
    └── components/
```

### Design Principles

1. **Single Responsibility**: Each component has one clear purpose
2. **Reusability**: Components are designed to be used across different contexts
3. **Composition**: Complex UIs are built by composing simpler components
4. **Props Interface**: Clear, documented props for easy usage
5. **Accessibility**: Components include proper ARIA attributes and semantic markup

## Component Categories

### 1. UI Components (`src/components/ui/`)
Basic building blocks for user interface elements.

### 2. Layout Components (`src/components/layout/`)
Structural components that define page layout and navigation.

### 3. Common Components (`src/components/common/`)
Utility components used across different features.

### 4. Feature Components (`src/features/[feature]/components/`)
Components specific to particular features or pages.

## UI Components

### Button Component

**Location**: `src/components/ui/button.jsx`

A versatile button component with multiple variants and sizes.

#### Usage

```jsx
import Button from '@components/ui/button';

// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="primary">Primary Button</Button>
<Button variant="outline">Outline Button</Button>
<Button variant="ghost">Ghost Button</Button>
<Button variant="white">White Button</Button>

// With sizes
<Button size="small">Small</Button>
<Button size="default">Default</Button>
<Button size="large">Large</Button>

// With additional props
<Button
  variant="primary"
  size="large"
  disabled={false}
  onClick={handleClick}
  className="custom-class"
>
  Get Started
</Button>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | - | Button content |
| `variant` | string | `'primary'` | Style variant: `'primary'`, `'outline'`, `'ghost'`, `'white'` |
| `size` | string | `'default'` | Size: `'small'`, `'default'`, `'large'` |
| `disabled` | boolean | `false` | Whether button is disabled |
| `type` | string | `'button'` | HTML button type |
| `className` | string | `''` | Additional CSS classes |
| `onClick` | function | - | Click handler |

#### Styling Customization

To add new button variants:

```jsx
// In button.jsx, add to variantClasses
const variantClasses = {
  // ... existing variants
  secondary: 'bg-gray-500 hover:bg-gray-600 text-white focus:ring-gray-400',
  danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400'
};
```

### Card Component

**Location**: `src/components/ui/card.jsx`

A flexible container component for content grouping.

#### Usage

```jsx
import Card from '@components/ui/card';

<Card className="p-6">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>

// With hover effects
<Card hover className="p-6">
  <h3>Hoverable Card</h3>
</Card>
```

### Input Component

**Location**: `src/components/ui/input.jsx`

Form input component with validation states.

#### Usage

```jsx
import Input from '@components/ui/input';

<Input
  type="email"
  placeholder="Enter your email"
  value={email}
  onChange={setEmail}
  error={emailError}
  required
/>
```

## Layout Components

### Page Layout

**Location**: `src/components/layout/page-layout.jsx`

Main wrapper component for page structure. See [Layout System Guide](layout-system.md) for detailed usage.

```jsx
import PageLayout from '@components/layout/page-layout';

<PageLayout title="Page Title">
  <YourContent />
</PageLayout>
```

### Navigation Bar

**Location**: `src/components/layout/nav-bar.jsx`

Responsive navigation component with mobile menu support.

```jsx
import NavBar from '@components/layout/nav-bar';

<NavBar theme="light" />  // For dark backgrounds
<NavBar theme="dark" />   // For light backgrounds
```

### Header and Footer

**Location**: `src/components/layout/header.jsx`, `src/components/layout/footer.jsx`

Standard page header and footer components. See [Layout System Guide](layout-system.md) for customization.

## Common Components

### Loading Component

**Location**: `src/components/common/loading.jsx`

Simple loading spinner for async operations.

```jsx
import Loading from '@components/common/loading';

// Basic usage
<Loading />

// In Suspense fallback
<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>
```

#### Customizing Loading Spinner

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
```

### Error Boundary

**Location**: `src/components/common/error-boundary.jsx`

React error boundary for graceful error handling.

```jsx
import ErrorBoundary from '@components/common/error-boundary';

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

### Top Bar

**Location**: `src/components/common/top-bar.jsx`

Promotional or announcement bar. See [Layout System Guide](layout-system.md) for customization.

## Feature Components

Feature components are organized by functionality and located in `src/features/[feature]/components/`.

### Home Feature Components

**Location**: `src/features/home/components/`

#### Hero Section

**File**: `hero-section.jsx`

Main landing page hero with call-to-action.

```jsx
import HeroSection from '@features/home/components/hero-section';

<HeroSection />
```

#### Features Section

**File**: `features-section.jsx`

Displays product features from JSON data.

```jsx
import FeaturesSection from '@features/home/components/features-section';

<FeaturesSection />
```

#### Testimonials Section

**File**: `testimonials-section.jsx`

Customer testimonials carousel.

```jsx
import TestimonialsSection from '@features/home/components/testimonials-section';

<TestimonialsSection />
```

### Pricing Feature Components

**Location**: `src/features/pricing/components/`

Components specific to pricing pages.

### Authentication Feature Components

**Location**: `src/features/auth/components/`

Login and registration form components.

## Creating Custom Components

### Step 1: Component Structure

```jsx
// src/components/ui/your-component.jsx
import React from 'react';

/**
 * Description of your component
 * @param {Object} props - Component props
 * @param {string} props.title - Component title
 * @param {React.ReactNode} props.children - Child components
 * @param {string} [props.className=''] - Additional CSS classes
 */
function YourComponent({
  title,
  children,
  className = '',
  ...props
}) {
  return (
    <div className={`base-classes ${className}`} {...props}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export default YourComponent;
```

### Step 2: Add to Index File

```jsx
// src/components/ui/index.js
export { default as Button } from './button';
export { default as Card } from './card';
export { default as Input } from './input';
export { default as YourComponent } from './your-component';
```

### Step 3: Usage

```jsx
import { YourComponent } from '@components/ui';

<YourComponent title="Hello World" className="custom-styles">
  <p>Component content</p>
</YourComponent>
```

### Component Template

```jsx
import React from 'react';
import PropTypes from 'prop-types';

/**
 * [Component Name] - Brief description
 *
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child elements
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {string} [props.variant='default'] - Component variant
 */
function ComponentName({
  children,
  className = '',
  variant = 'default',
  ...otherProps
}) {
  // Component logic here
  const baseClasses = 'base styles here';
  const variantClasses = {
    default: 'default styles',
    alternate: 'alternate styles'
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  return (
    <div className={combinedClasses} {...otherProps}>
      {children}
    </div>
  );
}

// PropTypes for development validation
ComponentName.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'alternate'])
};

export default ComponentName;
```

## Component Props and Usage

### Props Patterns

#### 1. Children Prop Pattern

```jsx
function Container({ children, ...props }) {
  return <div {...props}>{children}</div>;
}

// Usage
<Container className="p-4">
  <Content />
</Container>
```

#### 2. Render Prop Pattern

```jsx
function DataProvider({ render, data }) {
  return render(data);
}

// Usage
<DataProvider
  data={someData}
  render={(data) => <DataDisplay data={data} />}
/>
```

#### 3. Compound Component Pattern

```jsx
function Card({ children }) {
  return <div className="card">{children}</div>;
}

Card.Header = ({ children }) => <div className="card-header">{children}</div>;
Card.Body = ({ children }) => <div className="card-body">{children}</div>;
Card.Footer = ({ children }) => <div className="card-footer">{children}</div>;

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>
```

### Common Props

Most components accept these standard props:

| Prop | Type | Description |
|------|------|-------------|
| `className` | string | Additional CSS classes |
| `children` | ReactNode | Child components/content |
| `style` | object | Inline styles |
| `id` | string | HTML id attribute |
| `data-*` | any | Data attributes |

## Best Practices

### 1. Component Documentation

Always document your components:

```jsx
/**
 * Button component with multiple variants
 *
 * @example
 * <Button variant="primary" size="large">
 *   Click me
 * </Button>
 *
 * @param {Object} props - Component props
 * @param {string} props.variant - Button style variant
 * @param {string} props.size - Button size
 */
```

### 2. Prop Validation

Use PropTypes or TypeScript for prop validation:

```jsx
import PropTypes from 'prop-types';

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  children: PropTypes.node.isRequired
};
```

### 3. Default Props

Provide sensible defaults:

```jsx
Button.defaultProps = {
  variant: 'primary',
  size: 'medium',
  type: 'button'
};
```

### 4. Accessibility

Include proper ARIA attributes:

```jsx
<button
  aria-label={ariaLabel}
  aria-pressed={isPressed}
  role="button"
  tabIndex={tabIndex}
>
  {children}
</button>
```

### 5. Performance Optimization

Use React.memo for expensive components:

```jsx
import { memo } from 'react';

const ExpensiveComponent = memo(({ data }) => {
  // Component logic
  return <div>{/* Render logic */}</div>;
});
```

### 6. Custom Hooks

Extract component logic into custom hooks:

```jsx
// useButton.js
function useButton({ variant, size, disabled }) {
  const classes = useMemo(() => {
    return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
  }, [variant, size]);

  return { classes };
}

// Button component
function Button(props) {
  const { classes } = useButton(props);
  return <button className={classes}>{props.children}</button>;
}
```

### 7. Component Testing

Create testable components:

```jsx
// Button.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

test('renders button with text', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByText('Click me')).toBeInTheDocument();
});

test('calls onClick when clicked', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  fireEvent.click(screen.getByText('Click me'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

## Component Styling Guidelines

### 1. Tailwind CSS Classes

Use Tailwind for styling:

```jsx
// Good: Utility classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">

// Avoid: Inline styles
<div style={{ display: 'flex', padding: '1rem' }}>
```

### 2. Conditional Classes

Use template literals for conditional styling:

```jsx
const buttonClasses = `
  px-4 py-2 rounded
  ${variant === 'primary' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}
  ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
`;
```

### 3. Component Variants

Create clear variant systems:

```jsx
const variants = {
  primary: 'bg-pink-500 text-white',
  secondary: 'bg-gray-500 text-white',
  outline: 'border border-pink-500 text-pink-500'
};
```

## Next Steps

- **[Customize styling](styling-guide.md)** - Learn advanced styling techniques
- **[Optimize performance](loading-and-performance.md)** - Component performance tips
- **[Manage component data](data-management.md)** - Connect components to data
- **[Test components](troubleshooting.md)** - Testing and debugging guide