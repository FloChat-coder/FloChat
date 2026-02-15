# Customization Guide

This guide will help you customize the GlobalBank template to match your brand and requirements. Learn how to update logos, favicons, colors, and other visual elements.

## Table of Contents

- [Logo Customization](#logo-customization)
- [Favicon Update](#favicon-update)
- [Color Scheme](#color-scheme)
- [Typography](#typography)
- [Theme Customization](#theme-customization)
- [Brand Assets](#brand-assets)

## Logo Customization

The template uses different logo variants for different contexts:

### Logo Files Location
```
public/images/
├── logo.svg          # Main logo file
└── [other-logos]     # Additional logo variants
```

### Where Logos are Used

1. **Navigation Bar** (`src/components/layout/nav-bar.jsx:23`)
   - Uses: `/images/logo.svg`

2. **Authentication Pages**
   - Login page: `/images/logo.svg`
   - Register page: `/images/logo.svg`

3. **Mobile Navigation**
   - Uses: `/images/logo.svg`

### How to Replace Logos

1. **Prepare your logo files:**
   - Create SVG versions (recommended for scalability)
   - Name it: `logo.svg`
   - Ensure good contrast and readability

2. **Replace the files:**
   ```bash
   # Replace existing logo in public/images/
   cp your-logo.svg public/images/logo.svg
   ```

3. **Update alt text** (optional):
   ```jsx
   // In nav-bar.jsx, update the alt attribute
   <img src={logoSrc} alt="Your Company Name" />
   ```

### Logo Sizing

- **Desktop navigation:** Default height is auto-sized
- **Mobile navigation:** Default height is auto-sized
- **Auth pages:** Height is set to `h-12` (48px)

To customize logo sizes, update the Tailwind classes:
```jsx
// Example: Make logo larger on auth pages
<img src="/images/logo.svg" alt="GlobalBank" className="h-16 mx-auto" />
```

## Favicon Update

### Current Favicon
- Location: `public/favicon.png`
- Format: PNG
- Size: Multiple sizes supported

### How to Replace Favicon

1. **Prepare your favicon:**
   - Create a PNG file (or ICO for broader compatibility)
   - Recommended sizes: 16x16, 32x32, 48x48, 64x64, 128x128

2. **Replace the file:**
   ```bash
   cp your-favicon.png public/favicon.png
   ```

3. **Update HTML meta tags** (if needed):
   ```html
   <!-- In index.html -->
   <link rel="icon" type="image/png" href="/favicon.png" />
   ```

### Advanced Favicon Setup

For better browser support, you can add multiple favicon sizes:

```html
<!-- Add to index.html -->
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
```

## Color Scheme & Branding

GlobalBank uses a professional color palette that can be customized through Tailwind CSS configuration.

### Current Color Palette

GlobalBank uses a green-based professional color scheme defined in `src/index.css`:

1. **Green Palette** (Primary Brand Colors)
   - `green-400`: `#ccff00` (Bright lime green - primary accent)
   - `green-500`: `#b2e600` (Lime green - primary brand)
   - `green-600`: `#8ab800` (Darker lime green)

2. **Gray Palette** (Neutral Colors)
   - `gray-50`: `#f6f6f6` (Light backgrounds)
   - `gray-900`: `#3d3d3d` (Dark text/backgrounds)
   - `blueGray-950`: `#2a2e35` (Very dark backgrounds)

3. **Body Colors**
   - `body`: `#0e0f11` (Primary body background - very dark)

### How to Customize Colors

1. **Update the CSS variables** in `src/index.css`:
   ```css
   @theme {
     /* Update primary green colors */
     --color-green-400: #your-primary-accent;
     --color-green-500: #your-brand-color;
     --color-green-600: #your-darker-green;

     /* Update background colors */
     --color-body: #your-background-color;
     --color-blueGray-950: #your-dark-surface;
   }
   ```

2. **Generate color variations:**
   - Use tools like [TailwindCSS Color Generator](https://www.tints.dev/)
   - Create 50-900 variations of your brand colors
   - Update all color variables in the palette

3. **Test your changes:**
   ```bash
   npm run dev
   ```

### Key Color Usage Examples

Based on GlobalBank's actual implementation:
- **Primary buttons:** `bg-green-400 hover:bg-green-500`
- **Navigation active states:** `text-green-400`
- **Loading indicators:** `border-green-400`
- **Focus states:** `focus:ring-green-400/40`
- **Top bar background:** `bg-green-500`

## Typography

### Font Configuration

The template uses system fonts defined in Tailwind CSS. To customize typography:

1. **Add custom fonts** in `src/index.css`:
   ```css
   @import url('https://fonts.googleapis.com/css2?family=Your+Font:wght@300;400;500;600;700&display=swap');

   @theme {
     --font-family-sans: 'Your Font', ui-sans-serif, system-ui;
   }
   ```

2. **Update font weights and sizes** as needed:
   ```css
   @theme {
     --font-size-xl: 1.5rem;
     --font-weight-semibold: 600;
   }
   ```

### Typography Classes

Common typography patterns used in the template:
- **Headings:** `text-2xl font-bold`, `text-xl font-semibold`
- **Body text:** `text-base`, `text-sm`
- **Navigation:** `text-sm font-medium`

## Theme Customization


### Custom Breakpoints

The template includes a custom `3xl` breakpoint:
```css
--breakpoint-3xl: 1820px;
```

Add more custom breakpoints as needed:
```css
@theme {
  --breakpoint-4xl: 2048px;
  --breakpoint-xs: 475px;
}
```

## Brand Assets

### Organizing Brand Assets

1. **Create a brand folder:**
   ```
   public/images/brand/
   ├── logos/
   │   └── logo.svg
   ├── favicons/
   │   ├── favicon.png
   │   └── apple-touch-icon.png
   └── patterns/
       └── background-pattern.svg
   ```

2. **Update references** in your components:
   ```jsx
   const logoSrc = '/images/brand/logos/logo.svg';
   ```

### Image Optimization

For better performance:

1. **Use optimized formats:**
   - SVG for logos and icons
   - WebP for photographs
   - PNG for images with transparency

2. **Implement lazy loading:**
   ```jsx
   <img
     src="/images/your-image.jpg"
     alt="Description"
     loading="lazy"
   />
   ```

### Brand Consistency Checklist

- [ ] Logo updated in all locations
- [ ] Favicon replaced
- [ ] Color palette customized
- [ ] Typography updated
- [ ] Brand assets organized
- [ ] Alt text updated
- [ ] Mobile responsiveness tested
- [ ] Cross-browser compatibility checked

## Next Steps

After customizing your brand elements:

1. **[Update your content](data-management.md)** - Modify JSON data files
2. **[Customize components](components-guide.md)** - Adjust component styling
3. **[Test responsiveness](styling-guide.md)** - Ensure mobile compatibility
4. **[Build and deploy](deployment.md)** - Deploy your customized template

Remember to test your changes across different devices and browsers to ensure consistency!