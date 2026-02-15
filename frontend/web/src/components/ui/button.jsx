import React from 'react';

/**
 * Button component for consistent styling across the application
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {'primary'|'outline'|'ghost'} [props.variant='primary'] - Button style variant
 * @param {'small'|'default'|'large'} [props.size='default'] - Button size
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {boolean} [props.disabled=false] - Whether button is disabled
 * @param {'button'|'submit'|'reset'} [props.type='button'] - Button type
 */
function Button({
  children,
  variant = 'primary',
  size = 'default',
  className = '',
  disabled = false,
  type = 'button',
  ...props
}) {
  const baseClasses = 'inline-block font-medium rounded-full transition duration-300 focus:ring-4 focus:ring-opacity-40 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'px-8 py-4 tracking-tighter bg-green-400 hover:bg-green-500 text-white focus:ring-green-500',
    outline: 'px-8 py-4 text-white hover:text-white tracking-tighter hover:bg-green-400 border-2 border-white focus:border-green-400/40 hover:border-green-400 focus:ring-green-400',
    ghost: 'px-4 py-2 text-white hover:text-green-400 hover:bg-green-400/10 focus:ring-green-400'
  };

  const sizeClasses = {
    small: 'px-4 py-2 text-sm',
    default: 'px-8 py-4',
    large: 'px-12 py-6 text-lg'
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      className={classes}
      disabled={disabled}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;