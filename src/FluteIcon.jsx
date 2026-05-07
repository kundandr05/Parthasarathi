export const FluteIcon = ({ size = 24, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5"
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 4.5l-2.5-2.5a1 1 0 0 0-1.4 0L2 17.1a1 1 0 0 0 0 1.4l2.5 2.5a1 1 0 0 0 1.4 0L21 5.9a1 1 0 0 0 0-1.4z" />
    {/* Holes */}
    <circle cx="14" cy="10" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="11.5" cy="12.5" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="9" cy="15" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="6.5" cy="17.5" r="0.8" fill="currentColor" stroke="none" />
    {/* Decorative bands */}
    <line x1="17.5" y1="3.5" x2="20.5" y2="6.5" />
    <line x1="15.5" y1="5.5" x2="18.5" y2="8.5" />
  </svg>
);
