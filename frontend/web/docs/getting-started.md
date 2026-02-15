# Getting Started

Welcome to GlobalBank, a modern React banking template designed for financial institutions and fintech companies. This template provides a comprehensive foundation for building professional banking websites with modern UI/UX patterns.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development Server](#development-server)
- [Building for Production](#building-for-production)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [Next Steps](#next-steps)

## Prerequisites

Before getting started, ensure you have the following installed on your system:

- **Node.js** (version 18.0.0 or higher)
- **npm** (comes with Node.js) or **yarn**
- **Git** (optional, for version control)

To check your Node.js version:
```bash
node --version
```

## Installation

1. **Extract the template** to your desired location
2. **Navigate to the project directory**:
   ```bash
   cd globalbank
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
   or with yarn:
   ```bash
   yarn install
   ```

## Development Server

Start the development server to begin working on your template:

```bash
npm run dev
```

or with yarn:
```bash
yarn dev
```

The development server will start at `http://localhost:5173`. The page will automatically reload when you make changes to the code.

### Development Features

- **Hot Module Replacement (HMR)** - Changes reflect instantly
- **Fast refresh** - React state is preserved during updates
- **Error overlay** - Build errors are displayed in the browser
- **Path aliases** - Clean imports using `@components`, `@features`, etc.

## Building for Production

When you're ready to deploy your website:

```bash
npm run build
```

This will:
- Create an optimized production build in the `dist/` folder
- Minify and compress all assets
- Generate source maps for debugging
- Optimize images and other static assets

### Preview Production Build

To preview your production build locally:

```bash
npm run preview
```

## Project Structure

```
globalbank/
├── public/                 # Static assets
│   ├── images/            # Image assets
│   ├── favicon.png        # Website favicon
│   └── template-assets/   # Template-specific assets
├── src/
│   ├── app/               # App configuration and routing
│   │   ├── provider.jsx   # App providers and context
│   │   ├── router.jsx     # Route definitions
│   │   └── routes/        # Page components
│   ├── components/        # Reusable UI components
│   │   ├── common/        # Common components (loading, errors)
│   │   ├── layout/        # Layout components (header, footer)
│   │   └── ui/           # UI elements (buttons, forms)
│   ├── config/           # Configuration files
│   ├── data/             # JSON data files
│   ├── features/         # Feature-specific components
│   ├── hooks/            # Custom React hooks
│   ├── index.css         # Global styles and Tailwind CSS
│   └── main.jsx          # Application entry point
├── docs/                 # Documentation
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite configuration
└── README.md            # Project overview
```

## Key Features

### 🚀 **Modern Technology Stack**
- React 19.1.1 with latest features
- Vite 6.3.6 for lightning-fast development
- Tailwind CSS 4.1.13 for utility-first styling
- React Router DOM 7.9.1 for client-side routing

### 📱 **Responsive Design**
- Mobile-first approach
- Optimized for all screen sizes
- Touch-friendly interactions

### 🔧 **Developer Experience**
- ESLint configuration for code quality
- Hot module replacement
- Path aliases for clean imports
- TypeScript support ready

### 📊 **Data-Driven Content**
- JSON-based content management
- Easy to update without code changes
- Structured data for blogs, pricing, testimonials

### ⚡ **Performance Optimized**
- Lazy loading for routes
- Code splitting
- Image optimization
- Minimal bundle size

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint to check code quality

## Next Steps

Now that you have the template running, here's what you should do next:

1. **[Customize your template](customization-guide.md)** - Update logo, favicon, and colors
2. **[Understand the routing system](routing-and-pages.md)** - Learn how to add new pages
3. **[Manage your content](data-management.md)** - Update JSON data files with your content
4. **[Explore components](components-guide.md)** - Understand the component structure
5. **[Style your template](styling-guide.md)** - Customize the design with Tailwind CSS

## Support

If you encounter any issues:

1. Check the [Troubleshooting guide](troubleshooting.md)
2. Review the relevant documentation sections
3. Ensure all dependencies are properly installed
4. Verify Node.js version compatibility

Happy coding! 🎉