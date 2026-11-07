import React from 'react';
import { Link } from 'react-router-dom';

interface TextLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to?: string;
  onClick?: () => void;
  showChevron?: boolean;
  state?: unknown;
}

export const TextLink: React.FC<TextLinkProps> = ({
  children,
  to,
  onClick,
  showChevron = true,
  state,
  className = '',
  ...props
}) => {
  const classes =
    `inline-flex items-center gap-1.5 font-medium text-[17px] leading-[22px] tracking-[-0.085px] text-accent hover:text-accent-strong transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm ${className}`.trim();

  const content = (
    <>
      <span>{children}</span>
      {showChevron && (
        <span className="font-normal text-[17px] leading-[22px] select-none text-accent" aria-hidden="true">
          ›
        </span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} state={state} className={classes}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        {content}
      </button>
    );
  }

  return (
    <a className={classes} {...props}>
      {content}
    </a>
  );
};

