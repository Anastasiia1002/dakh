export function CatalogSkeleton({ columns = 3 }: { columns?: 2 | 3 }) {
  const grid = columns === 2 ? 'md:grid-cols-2 xl:grid-cols-3' : 'md:grid-cols-3'
  return (
    <div className={`mt-14 grid gap-14 ${grid}`} role="status" aria-busy="true">
      <p className="sr-only">Завантажуємо помешкання…</p>
      {Array.from({ length: columns }, (_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-[4/3] bg-beige" />
          <div className="mt-5 h-3 w-24 bg-beige" />
          <div className="mt-4 h-8 w-2/3 bg-beige" />
          <div className="mt-3 h-3 w-full bg-beige" />
        </div>
      ))}
    </div>
  )
}

export function CatalogState({
  status,
  error,
  onRetry,
  emptyCopy,
  columns = 3,
}: {
  status: 'loading' | 'empty' | 'error'
  error?: string
  onRetry?: () => void
  emptyCopy: string
  columns?: 2 | 3
}) {
  if (status === 'loading') return <CatalogSkeleton columns={columns} />

  if (status === 'error') {
    return (
      <div className="mt-16 max-w-xl" role="alert">
        <p className="text-sm leading-relaxed text-wood/75">{error}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 border border-wood/20 px-5 py-3 text-[0.72rem] font-semibold tracking-[0.14em] uppercase"
          >
            Спробувати ще раз
          </button>
        ) : null}
      </div>
    )
  }

  return <p className="mt-16 text-sm text-wood/70">{emptyCopy}</p>
}
