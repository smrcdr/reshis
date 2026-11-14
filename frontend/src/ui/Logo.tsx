export function Logo({ size = 40 }: {
    size?: number;
}) {
    return (<svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" className="logo">
      <rect width="40" height="40" rx="10" fill="var(--accent)"/>
      <path d="M9 23.5 31 13l-3.6 5.2-8.4 2.6 3.8 7.2-2.8 1-5.2-6.2-4.6 1.4z" fill="#fff" strokeLinejoin="round"/>
    </svg>);
}
