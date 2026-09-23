import type { ReactNode } from 'react'

function Glyph({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function DashboardIcon() {
  return (
    <Glyph>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Glyph>
  )
}

export function ConnectionsIcon() {
  return (
    <Glyph>
      <path d="M9 7v4" />
      <path d="M15 7v4" />
      <path d="M7 11h10v3a5 5 0 0 1-10 0v-3z" />
      <path d="M12 19v2" />
    </Glyph>
  )
}

export function QualityIcon() {
  return (
    <Glyph>
      <path d="M12 3 19 6v6c0 4.2-2.8 7.2-7 8.5C7.8 19.2 5 16.2 5 12V6l7-3z" />
      <path d="m9 12 2 2 4-4" />
    </Glyph>
  )
}

export function MatchingIcon() {
  return (
    <Glyph>
      <circle cx="6" cy="6" r="2.25" />
      <circle cx="18" cy="18" r="2.25" />
      <path d="M8 6h5a4 4 0 0 1 4 4v2" />
      <path d="M16 18H11a4 4 0 0 1-4-4v-2" />
    </Glyph>
  )
}

export function ObservabilityIcon() {
  return (
    <Glyph>
      <path d="M3 12h4l2.5-6 4.5 12L16.5 12H21" />
    </Glyph>
  )
}

export function JobsIcon() {
  return (
    <Glyph>
      <path d="M9 6h11" />
      <path d="M9 12h11" />
      <path d="M9 18h11" />
      <path d="m3.5 6 1.2 1.2L7 5" />
      <path d="m3.5 12 1.2 1.2L7 11" />
      <path d="m3.5 18 1.2 1.2L7 17" />
    </Glyph>
  )
}

export function AdminIcon() {
  return (
    <Glyph>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6" />
    </Glyph>
  )
}

export function BellIcon() {
  return (
    <Glyph>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 2.5 7 2.5 9H3.5C3.5 15 6 15 6 8" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </Glyph>
  )
}

export function SunIcon() {
  return (
    <Glyph>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
    </Glyph>
  )
}

export function SparkIcon() {
  return (
    <Glyph>
      <path d="M12 2.5 13.8 8 19.5 9.8 13.8 11.6 12 17.1 10.2 11.6 4.5 9.8 10.2 8 12 2.5z" />
      <path d="M18.5 14.5 19.2 16.8 21.5 17.5 19.2 18.2 18.5 20.5 17.8 18.2 15.5 17.5 17.8 16.8 18.5 14.5z" />
    </Glyph>
  )
}

export function LogoutIcon() {
  return (
    <Glyph>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </Glyph>
  )
}

export function ChevronIcon({ size = 20 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="m6 9 6 6 6-6" />
    </Glyph>
  )
}

export function CheckIcon() {
  return (
    <Glyph>
      <path d="M5 12.5 9.5 17 19 7.5" />
    </Glyph>
  )
}

export function SearchIcon() {
  return (
    <Glyph>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </Glyph>
  )
}

export function ExportIcon() {
  return (
    <Glyph>
      <path d="M12 4v10" />
      <path d="m8 10 4 4 4-4" />
      <path d="M5 19h14" />
    </Glyph>
  )
}

export function DatabaseIcon({ size = 20 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <ellipse cx="12" cy="7" rx="6.5" ry="2.75" />
      <path d="M5.5 7v9c0 1.6 2.9 2.75 6.5 2.75s6.5-1.15 6.5-2.75V7" />
      <path d="M5.5 11.5c0 1.5 2.9 2.5 6.5 2.5s6.5-1 6.5-2.5" />
    </Glyph>
  )
}

export function TableIcon({ size = 20 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <path d="M4 9.5h16" />
      <path d="M9 9.5V19" />
    </Glyph>
  )
}

export function EllipsisIcon({ size = 20 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <circle cx="6" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="1.15" fill="currentColor" stroke="none" />
    </Glyph>
  )
}

export function BackIcon() {
  return (
    <Glyph>
      <path d="M15 6 9 12l6 6" />
    </Glyph>
  )
}

export function PlusIcon({ size = 16 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Glyph>
  )
}

export function ClockIcon({ size = 20 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3.2 2" />
    </Glyph>
  )
}

export function ListIcon({ size = 16 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M9 6h12" />
      <path d="M9 12h12" />
      <path d="M9 18h12" />
      <circle cx="4" cy="6" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1.1" fill="currentColor" stroke="none" />
    </Glyph>
  )
}

export function CardIcon({ size = 16 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    </Glyph>
  )
}

export function FilterIcon({ size = 16 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M4 5h16l-6.2 7.2V19l-3.6-1.8v-5L4 5z" />
    </Glyph>
  )
}

export function SidebarIcon({ size = 20 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18" />
    </Glyph>
  )
}

export function InboxIcon({ size = 20 }: { size?: number }) {
  return (
    <Glyph size={size}>
      <path d="M4 12.5 6.6 5h10.8l2.6 7.5" />
      <path d="M4 12.5V18a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 18v-5.5" />
      <path d="M4 12.5h5.2c.3 1.4 1.4 2.3 2.8 2.3s2.5-.9 2.8-2.3H20" />
    </Glyph>
  )
}
