export default function Mark({ className = 'size-10' }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-indigo ${className}`}
      aria-hidden="true"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="7.25" stroke="white" strokeWidth="1.75" />
        <circle cx="12" cy="12" r="2.1" fill="white" />
      </svg>
    </span>
  )
}
