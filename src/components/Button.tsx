import React from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  to?: string;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  to,
  variant = 'primary',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium text-[17px] leading-[22px] tracking-[-0.085px] rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent select-none';

  const variantClasses =
    variant === 'primary'
      ? 'h-12 px-8 bg-accent text-background hover:bg-accent-strong active:bg-accent-strong disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-accent'
      : 'h-12 px-8 bg-surface text-text hover:bg-divider/40 active:bg-divider/60 disabled:opacity-40 disabled:cursor-not-allowed';

  const widthClass = fullWidth ? 'w-full' : '';
  const combinedClasses = `${baseClasses} ${variantClasses} ${widthClass} ${className}`.trim();

  if (to && !disabled) {
    return (
      <Link to={to} className={combinedClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

