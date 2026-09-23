import type { ReactNode } from 'react'

const sizeClass = {
  sm: 'size-7',
  md: 'size-8',
  lg: 'size-10',
} as const

export default function IconBox({
  children,
  size = 'md',
  className = '',
}: {
  children: ReactNode
  size?: keyof typeof sizeClass
  className?: string
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-md border border-line bg-surface text-muted ${sizeClass[size]} ${className}`}
    >
      {children}
    </span>
  )
}
