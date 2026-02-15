import React from 'react';

/**
 * Card component for consistent container styling
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {'default'|'light'|'darker'} [props.variant='default'] - Card background variant
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {'none'|'small'|'default'|'large'} [props.padding='default'] - Padding size
 */
function Card({
  children,
  variant = 'default',
  className = '',
  padding = 'default',
  ...props
}) {
  const baseClasses = 'bg-gradient-radial-dark border border-gray-900/30 rounded-5xl overflow-hidden';

  const variantClasses = {
    default: '',
    light: 'bg-gradient-radial-dark-light',
    darker: 'bg-gradient-radial-darker'
  };

  const paddingClasses = {
    none: '',
    small: 'p-4',
    default: 'p-8',
    large: 'p-16'
  };

  // If using sub-components like CardContent, we might want to disable outer padding via props
  const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

// --- Sub-components required for Login Page ---

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={`flex flex-col space-y-1.5 mb-4 ${className || ''}`} {...props} />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={`font-semibold leading-none tracking-tight ${className || ''}`} {...props} />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={`text-sm text-gray-400 ${className || ''}`} {...props} />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={`${className || ''}`} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={`flex items-center pt-4 ${className || ''}`} {...props} />
))
CardFooter.displayName = "CardFooter"

// Export both Named and Default to satisfy all imports
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
export default Card;