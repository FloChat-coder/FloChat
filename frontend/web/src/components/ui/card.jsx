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

  const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${className}`;

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export default Card;