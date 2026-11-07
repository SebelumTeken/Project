import React from 'react';

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  radius?: '24' | '32';
}

export const Panel: React.FC<PanelProps> = ({
  children,
  radius = '24',
  className = '',
  ...props
}) => {
  const radiusClass = radius === '32' ? 'rounded-[32px]' : 'rounded-[24px]';

  return (
    <div
      className={`bg-surface ${radiusClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
};

