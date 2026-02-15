# Data Management

This comprehensive guide explains how to manage content in the GlobalBank template using JSON data files. The template uses a data-driven approach that allows you to update content without modifying code.

## Table of Contents

- [Overview](#overview)
- [Data Structure](#data-structure)
- [JSON Files Reference](#json-files-reference)
- [Navigation Data](#navigation-data)
- [Blog Content](#blog-content)
- [Pricing Plans](#pricing-plans)
- [Features and Benefits](#features-and-benefits)
- [Testimonials](#testimonials)
- [FAQ Content](#faq-content)
- [Company Information](#company-information)
- [Best Practices](#best-practices)
- [Adding New Data Types](#adding-new-data-types)

## Overview

The GlobalBank template separates content from code using JSON data files located in `src/data/`. This approach provides several benefits:

- **Easy Content Updates**: Non-developers can update content
- **Maintainability**: Content changes don't require code modifications
- **Scalability**: Easy to add new data types and structures
- **Version Control**: Content changes are tracked separately

### Data Files Location

```
src/data/
├── navigation.json       # Main navigation menu
├── auth.json           # Authentication pages content
├── blog.json           # Blog posts and metadata
├── pricing.json        # Pricing plans and features
├── features.json       # Product features and descriptions
├── about.json          # About page content and team info
├── contact.json        # Contact information and form
└── testimonials.json   # Customer testimonials
```

## Data Structure

### Common Patterns

All JSON files follow consistent patterns:

1. **Array Format**: For lists of items (testimonials, features, etc.)
2. **Object Format**: For structured data (blog data, FAQ data)
3. **Nested Objects**: For complex data relationships

### Data Loading

Components import and use data files directly:

```jsx
import testimonials from '@data/testimonials.json';
import { features } from '@data/features.json';
```

## JSON Files Reference

## Navigation Data

**File**: `src/data/navigation.json`

Controls the main site navigation menu.

### Structure

```json
[
  {
    "to": "/",
    "label": "Home"
  },
  {
    "to": "/about",
    "label": "About"
  }
]
```

### Fields

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `to` | string | Route path | ✅ |
| `label` | string | Display text | ✅ |

### Usage

```jsx
import navigation from '@data/navigation.json';

// Render navigation items
{navigation.map(item => (
  <Link key={item.to} to={item.to}>{item.label}</Link>
))}
```

### Adding Navigation Items

1. Add new route to `src/app/router.jsx`
2. Add navigation item to `navigation.json`:

```json
{
  "to": "/services",
  "label": "Services"
}
```

> **Note**: The router configuration (`src/app/router.jsx`) controls which items appear in navigation via the `showInNav` property.

## Blog Content

**File**: `src/data/blog.json`

Manages blog posts, categories, and featured content.

### Structure

```json
{
  "categories": ["Trending", "Accounting", "Entrepreneurship"],
  "featuredPost": {
    "title": "Effective email marketing on a budget",
    "date": "17 Jul 2023",
    "excerpt": "Learn proven strategies...",
    "category": "Trending",
    "image": "/images/blog-placeholder-pink.png",
    "slug": "effective-email-marketing-budget",
    "author": "Marketing Team",
    "readTime": "8 min read",
    "content": {
      "intro": "Email marketing remains...",
      "keyTakeaways": ["Point 1", "Point 2"],
      "sections": [
        {
          "title": "Section Title",
          "content": "Section content..."
        }
      ]
    }
  },
  "posts": [
    // Array of blog posts with same structure as featuredPost
  ]
}
```

### Blog Post Fields

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `title` | string | Post title | ✅ |
| `date` | string | Publication date | ✅ |
| `excerpt` | string | Short description | ✅ |
| `category` | string | Post category | ✅ |
| `image` | string | Featured image path | ✅ |
| `slug` | string | URL slug | ✅ |
| `author` | string | Author name | ✅ |
| `readTime` | string | Estimated read time | ✅ |
| `content` | object | Full post content | ✅ |

### Content Object Structure

```json
{
  "intro": "Introduction paragraph",
  "keyTakeaways": ["Key point 1", "Key point 2"],
  "sections": [
    {
      "title": "Section Title",
      "content": "Section content with markdown support"
    }
  ],
  "conclusion": "Concluding thoughts",
  "callToAction": {
    "text": "Get started today",
    "link": "/pricing"
  }
}
```

### Adding Blog Posts

1. **Create new post object**:

```json
{
  "title": "Your New Blog Post",
  "date": "20 Sep 2024",
  "excerpt": "Brief description of your post content...",
  "category": "Accounting",
  "image": "/images/your-post-image.jpg",
  "slug": "your-new-blog-post",
  "author": "Your Name",
  "readTime": "5 min read",
  "content": {
    "intro": "Your introduction...",
    "keyTakeaways": [
      "First key takeaway",
      "Second key takeaway"
    ],
    "sections": [
      {
        "title": "First Section",
        "content": "Your section content..."
      }
    ]
  }
}
```

2. **Add to posts array** in `blog.json`
3. **Add image** to `public/images/`

### Blog Categories

Update categories array to add new categories:

```json
{
  "categories": ["Trending", "Accounting", "Entrepreneurship", "New Category"]
}
```

## Pricing Plans

**File**: `src/data/pricing.json`

Defines service pricing tiers and features.

### Structure

```json
{
  "plans": [
    {
      "name": "Basic",
      "monthlyPrice": 9,
      "yearlyPrice": 97,
      "period": "month",
      "features": [
        "Customized invoices",
        "Automated reminders"
      ]
    },
    {
      "name": "Pro",
      "monthlyPrice": 29,
      "yearlyPrice": 313,
      "period": "month",
      "recommended": true,
      "features": [
        "Cashflow tracking",
        "Add unlimited collaborators"
      ]
    }
  ]
}
```

### Plan Fields

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `name` | string | Plan name | ✅ |
| `monthlyPrice` | number | Monthly price | ✅ |
| `yearlyPrice` | number | Yearly price | ✅ |
| `period` | string | Billing period | ✅ |
| `recommended` | boolean | Show as recommended | ❌ |
| `features` | array | List of features | ✅ |

### Adding New Plans

```json
{
  "name": "Enterprise",
  "monthlyPrice": 99,
  "yearlyPrice": 999,
  "period": "month",
  "recommended": false,
  "features": [
    "All Pro features",
    "Priority support",
    "Custom integrations",
    "Dedicated account manager"
  ]
}
```

### Custom Pricing

For custom pricing plans:

```json
{
  "name": "Enterprise",
  "monthlyPrice": null,
  "yearlyPrice": null,
  "customPrice": "Contact us",
  "period": "custom",
  "features": ["Custom feature set"]
}
```

## Features and Benefits

**File**: `src/data/features.json`

Defines product features with icons and descriptions.

### Structure

```json
[
  {
    "id": 1,
    "title": "Simple Accounting",
    "icon": "/images/features-money-icon.svg",
    "image": "/images/feature-dashboard-pink-1.png",
    "gradient": "bg-gradient-to-b from-pink-300 via-pink-700 to-darkPink-900",
    "features": [
      "Automated financial tracking",
      "Easy invoicing and payment reminders",
      "Real-time access to your financial data"
    ]
  }
]
```

### Feature Fields

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `id` | number | Unique identifier | ✅ |
| `title` | string | Feature title | ✅ |
| `icon` | string | Icon image path | ✅ |
| `image` | string | Feature image path | ✅ |
| `gradient` | string | Tailwind gradient class | ✅ |
| `features` | array | Feature descriptions | ✅ |

### Adding Features

```json
{
  "id": 5,
  "title": "Advanced Reporting",
  "icon": "/images/features-report-icon.svg",
  "image": "/images/feature-dashboard-pink-5.png",
  "gradient": "bg-gradient-to-r from-blue-300 via-blue-700 to-blue-900",
  "features": [
    "Comprehensive financial reports",
    "Custom report builder",
    "Export to multiple formats"
  ]
}
```

## Testimonials

**File**: `src/data/testimonials.json`

Customer testimonials and reviews.

### Structure

```json
[
  {
    "id": 1,
    "content": "We're very happy that they are created this amazing bookkeeping software.",
    "highlightText": "very happy",
    "author": {
      "name": "Cooper Levin",
      "title": "Founder of AIME Inc.",
      "image": "/images/testimonial-avatar-1.png"
    }
  }
]
```

### Testimonial Fields

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `id` | number | Unique identifier | ✅ |
| `content` | string | Testimonial text | ✅ |
| `highlightText` | string | Text to highlight | ❌ |
| `author.name` | string | Customer name | ✅ |
| `author.title` | string | Customer title | ✅ |
| `author.image` | string | Customer photo | ✅ |

### Adding Testimonials

```json
{
  "id": 4,
  "content": "GlobalBank has transformed our financial operations. Highly recommended!",
  "highlightText": "streamlined our entire",
  "author": {
    "name": "Sarah Johnson",
    "title": "CFO, TechStart Inc.",
    "image": "/images/testimonial-avatar-4.png"
  }
}
```

## FAQ Content

**File**: `src/data/faqData.json`

Frequently asked questions and answers.

### Structure

```json
{
  "faqs": [
    {
      "question": "How to add company details on my invoice?",
      "answer": "You can easily add your company details by navigating..."
    }
  ]
}
```

### FAQ Fields

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `question` | string | Question text | ✅ |
| `answer` | string | Answer text | ✅ |

### Adding FAQs

```json
{
  "question": "Do you offer customer support?",
  "answer": "Yes, we provide 24/7 customer support through email, chat, and phone. Our dedicated support team is always ready to help you with any questions or issues you might have."
}
```

## Company Information

### Company Stats

**File**: `src/data/companyStats.json`

Company metrics and statistics.

### Job Openings

**File**: `src/data/jobOpenings.json`

Current job opportunities and career listings.

### Investors

**File**: `src/data/investors.json`

Investor information and funding details.

### Hiring Process

**File**: `src/data/hiring-process.json`

Steps in the company hiring workflow.

## Best Practices

### 1. Data Validation

Always validate your JSON before saving:

```bash
# Use a JSON validator
cat src/data/yourfile.json | jq '.'
```

### 2. Consistent Naming

- Use camelCase for field names
- Use descriptive, clear field names
- Maintain consistent structure across similar data types

### 3. Image Paths

Always use absolute paths for images:

```json
{
  "image": "/images/your-image.jpg"  // ✅ Correct
  "image": "../images/your-image.jpg"  // ❌ Avoid
}
```

### 4. Content Guidelines

- Keep excerpts under 150 characters
- Use consistent date formatting
- Provide alt text considerations for images
- Write clear, concise content

### 5. Performance Considerations

- Keep JSON files reasonably sized (< 1MB)
- Use image optimization for referenced images
- Consider pagination for large datasets

## Adding New Data Types

### Step 1: Create JSON File

```json
// src/data/services.json
{
  "services": [
    {
      "id": 1,
      "name": "Tax Preparation",
      "description": "Professional tax preparation services",
      "price": "$99",
      "features": ["Expert review", "E-filing included"]
    }
  ]
}
```

### Step 2: Create Component

```jsx
// src/components/services-list.jsx
import servicesData from '@data/services.json';

function ServicesList() {
  const { services } = servicesData;

  return (
    <div>
      {services.map(service => (
        <div key={service.id}>
          <h3>{service.name}</h3>
          <p>{service.description}</p>
          <span>{service.price}</span>
        </div>
      ))}
    </div>
  );
}
```

### Step 3: Use in Pages

```jsx
import ServicesList from '@components/services-list';

function ServicesPage() {
  return (
    <PageLayout title="Our Services">
      <ServicesList />
    </PageLayout>
  );
}
```

## Data Backup and Version Control

### 1. Regular Backups

Keep backups of your data files:

```bash
# Create backup
cp -r src/data src/data-backup-$(date +%Y%m%d)
```

### 2. Version Control

Use Git to track changes:

```bash
# Commit data changes
git add src/data/
git commit -m "Update pricing plans and testimonials"
```

### 3. Environment-Specific Data

For different environments:

```js
// src/config/data-config.js
const dataConfig = {
  development: {
    blogUrl: 'http://localhost:3000/api/blog',
    useLocalData: true
  },
  production: {
    blogUrl: 'https://api.yourdomain.com/blog',
    useLocalData: false
  }
};
```

## Troubleshooting

### Common Issues

1. **JSON Syntax Errors**: Use a JSON validator
2. **Missing Images**: Check file paths and ensure images exist
3. **Component Not Updating**: Clear browser cache or restart dev server
4. **Import Errors**: Verify file paths and JSON structure

### Debugging Data Issues

```jsx
// Add debugging to components
console.log('Loaded data:', testimonials);

// Validate data structure
if (!testimonials || !Array.isArray(testimonials)) {
  console.error('Invalid testimonials data');
}
```

## Next Steps

- **[Customize components](components-guide.md)** - Learn how components use this data
- **[Style your content](styling-guide.md)** - Visual customization techniques
- **[Optimize performance](loading-and-performance.md)** - Data loading optimization
- **[Deploy your site](deployment.md)** - Deploy with updated content