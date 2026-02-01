import React from 'react';
import clsx from 'clsx';

/**
 * Button Component
 * Reusable button with variants and sizes
 */
export const Button = React.forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'default',
  className = '',
  disabled = false,
  loading = false,
  leftIcon = null,
  rightIcon = null,
  ...props 
}, ref) => {
  const baseClasses = 'btn';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'bg-accent-600 text-white hover:bg-accent-700 focus-visible:ring-accent-500',
    success: 'bg-success-600 text-white hover:bg-success-700 focus-visible:ring-success-500'
  };
  
  const sizeClasses = {
    sm: 'btn-sm',
    default: '',
    lg: 'btn-lg'
  };
  
  return (
    <button
      ref={ref}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        loading && 'opacity-75 cursor-wait',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="w-4 h-4 mr-2 spinner" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {leftIcon && !loading && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
