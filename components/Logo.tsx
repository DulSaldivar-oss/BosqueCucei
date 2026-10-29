export function Logo({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="#2d5a3d" />
      <circle cx="20" cy="22" r="12" fill="none" stroke="#b5d334" strokeWidth="1.6" opacity=".35" />
      <circle cx="20" cy="22" r="7.5" fill="none" stroke="#b5d334" strokeWidth="1.6" opacity=".55" />
      <path d="M20 31v-9" stroke="#f6f1e7" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M20 22c-4.6 0-7.5-2.9-7.5-7.5 4.6 0 7.5 2.9 7.5 7.5Z" fill="#b5d334" />
      <path d="M20 19.5c0-4.2 2.6-7 7-7 0 4.2-2.8 7-7 7Z" fill="#f6f1e7" />
    </svg>
  );
}
