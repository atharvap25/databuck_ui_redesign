import { useState, type FormEvent } from 'react'
import type { LayoutId } from './AppShell.tsx'
import Mark from './Mark.tsx'

type Field = 'username' | 'password'

type FormValues = Record<Field, string>

type FormErrors = Partial<Record<Field, string>>

const emptyValues: FormValues = { username: '', password: '' }

function fieldError(field: Field, value: string): string | undefined {
  if (field === 'username' && value.trim() === '') return 'Enter a username.'
  if (field === 'password' && value === '') return 'Enter a password.'
  return undefined
}

export default function LoginScreen({
  onOpenLayout,
}: {
  onOpenLayout: (layout: LayoutId) => void
}) {
  const [values, setValues] = useState<FormValues>(emptyValues)
  const [errors, setErrors] = useState<FormErrors>({})

  function updateField(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      const message = fieldError(field, value)
      if (message) next[field] = message
      else delete next[field]
      return next
    })
  }

  function handleBlur(field: Field) {
    const message = fieldError(field, values[field])
    setErrors((current) => {
      const next = { ...current }
      if (message) next[field] = message
      else delete next[field]
      return next
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrors({
      username: fieldError('username', values.username),
      password: fieldError('password', values.password),
    })
  }

  return (
    <main className="flex min-h-svh flex-col md:flex-row">
      <section className="flex items-center justify-center bg-ink px-6 py-16 md:w-1/2 md:px-12 md:py-0">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-3">
            <Mark />
            <h1 className="text-4xl leading-none font-bold tracking-[-0.04em] text-white">
              Databuck
            </h1>
          </div>
          <p className="mt-2 text-sm text-tagline">
            Agentic AI for Enterprise Data Trust at Scale
          </p>
        </div>
      </section>

      <section className="flex flex-1 items-start justify-center bg-canvas px-6 py-10 md:w-1/2 md:items-center md:py-12">
        <form
          className="w-full max-w-[360px]"
          onSubmit={handleSubmit}
          noValidate
        >
          <Field
            id="username"
            label="Username"
            type="text"
            autoComplete="username"
            placeholder="Enter your username"
            value={values.username}
            error={errors.username}
            onChange={(value) => updateField('username', value)}
            onBlur={() => handleBlur('username')}
          />
          <Field
            id="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={values.password}
            error={errors.password}
            onChange={(value) => updateField('password', value)}
            onBlur={() => handleBlur('password')}
            className="mt-5"
          />

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              className="inline-flex h-11 min-h-11 flex-1 items-center justify-center rounded-md border border-line-strong bg-canvas px-2 font-label text-xs font-medium tracking-[0.08em] text-ink uppercase transition-colors duration-150 ease-databuck hover:border-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo md:h-10 md:min-h-10"
            >
              Single sign-on
            </button>
            <button
              type="submit"
              className="inline-flex h-11 min-h-11 flex-1 items-center justify-center rounded-md bg-indigo px-2 font-label text-xs font-medium tracking-[0.08em] text-white uppercase transition-colors duration-150 ease-databuck hover:bg-indigo-hover active:bg-indigo-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:h-10 md:min-h-10"
            >
              Login
            </button>
          </div>

          <p className="mt-6 text-center font-sans text-xs text-outline">
            2026 © FirstEigen
          </p>

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => onOpenLayout('layout-1')}
              className="inline-flex h-11 min-h-11 flex-1 items-center justify-center rounded-md border border-line-strong bg-canvas px-3 font-sans text-sm font-medium text-ink transition-colors duration-150 ease-databuck hover:border-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo md:h-10 md:min-h-10"
            >
              Layout 1
            </button>
            <button
              type="button"
              onClick={() => onOpenLayout('layout-2')}
              className="inline-flex h-11 min-h-11 flex-1 items-center justify-center rounded-md border border-line-strong bg-canvas px-3 font-sans text-sm font-medium text-ink transition-colors duration-150 ease-databuck hover:border-ink hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo md:h-10 md:min-h-10"
            >
              Layout 2
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

function Field({
  id,
  label,
  type,
  autoComplete,
  placeholder,
  value,
  error,
  onChange,
  onBlur,
  className = '',
}: {
  id: string
  label: string
  type: 'text' | 'password'
  autoComplete: string
  placeholder: string
  value: string
  error?: string
  onChange: (value: string) => void
  onBlur: () => void
  className?: string
}) {
  const errorId = `${id}-error`

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-2 block font-label text-xs font-medium tracking-[0.14em] text-muted uppercase"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className={`h-11 w-full rounded-md bg-container-high px-3 font-sans text-base text-ink transition-[box-shadow,background-color] duration-150 ease-databuck placeholder:text-tagline focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo md:h-10 ${
          error ? 'ring-2 ring-danger focus-visible:ring-danger' : ''
        }`}
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
