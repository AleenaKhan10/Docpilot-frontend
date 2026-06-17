const Logo = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M7 1.5L11.5 5.5H9.5V9.5H4.5V5.5H2.5Z" fill="currentColor" />
    <rect x="2.5" y="11" width="9" height="1.5" rx=".5" fill="currentColor" />
  </svg>
);

export default Logo;
