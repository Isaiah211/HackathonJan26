import React from 'react';
import clsx from 'clsx';

/**
 * Input Component
 * Form input with label, error handling, and validation states
 */
export const Input = React.forwardRef(({ 
  label,
  error,
  helpText,
  required = false,
  className = '',
  containerClassName = '',
  leftIcon = null,
  rightIcon = null,
  ...props 
}, ref) => {
  const hasError = Boolean(error);
  
  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && (
        <label 
          htmlFor={props.id} 
          className="label"
        >
          {label}
          {required && <span className="text-accent-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          className={clsx(
            'input',
            hasError && 'input-error',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            className
          )}
          aria-invalid={hasError}
          aria-describedby={error ? `${props.id}-error` : helpText ? `${props.id}-help` : undefined}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p 
          id={`${props.id}-error`}
          className="mt-2 text-sm text-accent-600 flex items-center gap-1"
          role="alert"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p 
          id={`${props.id}-help`}
          className="mt-2 text-sm text-neutral-500"
        >
          {helpText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
