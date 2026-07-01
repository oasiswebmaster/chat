export type FolderIconType = 'home' | 'documents' | 'images' | 'video' | 'trash' | 'default';

export const GlossyFolder = ({ 
  color = 'blue', 
  className = '', 
  type = 'default' 
}: { 
  color?: 'blue' | 'purple' | 'cyan' | 'pink' | 'emerald' | 'slate', 
  className?: string, 
  type?: FolderIconType 
}) => {
  const themes = {
    blue: { c1: '#60a5fa', c2: '#2563eb', shadow: 'rgba(37, 99, 235, 0.4)' },
    purple: { c1: '#c084fc', c2: '#7e22ce', shadow: 'rgba(126, 34, 206, 0.4)' },
    emerald: { c1: '#34d399', c2: '#059669', shadow: 'rgba(5, 150, 105, 0.4)' },
    pink: { c1: '#f472b6', c2: '#be185d', shadow: 'rgba(190, 24, 93, 0.4)' },
    cyan: { c1: '#22d3ee', c2: '#0891b2', shadow: 'rgba(8, 145, 178, 0.4)' },
    slate: { c1: '#94a3b8', c2: '#475569', shadow: 'rgba(71, 85, 105, 0.4)' },
  };
  
  const { c1, c2, shadow } = themes[color];

  return (
    <div className={`relative flex flex-col items-center justify-center transition-transform ${className}`}>
      <svg 
        viewBox="0 0 24 24" 
        className="w-full h-full absolute inset-0 transition-all duration-300 transform" 
        style={{ filter: `drop-shadow(0 4px 8px ${shadow})` }}
      >
        <defs>
          <linearGradient id={`grad-solid-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
          
          <mask id={`mask-solid-cutout-${color}-${type}`}>
            <rect x="0" y="0" width="24" height="24" fill="white" />
            {type !== 'default' && (
              <g transform="translate(5.5, 6.5) scale(0.55)" fill="black">
                {type === 'home' && (
                  <path d="M12 3L4 9v12h5v-7h6v7h5V9z" />
                )}
                {type === 'documents' && (
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-2 16H8v-2h4v2zm4-4H8v-2h8v2zm0-4H8V8h8v2z" />
                )}
                {type === 'images' && (
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                )}
                {type === 'video' && (
                  <path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z" />
                )}
                {type === 'trash' && (
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                )}
              </g>
            )}
          </mask>
        </defs>
        
        {/* Solid folder with cut-out mask */}
        <path 
          d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" 
          fill={`url(#grad-solid-${color})`} 
          mask={`url(#mask-solid-cutout-${color}-${type})`} 
        />
        
        {/* Light inner highlight for slickness */}
        <path 
          d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" 
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="0.8"
          mask={`url(#mask-solid-cutout-${color}-${type})`}
        />
      </svg>
    </div>
  );
};
