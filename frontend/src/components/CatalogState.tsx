export function CatalogState({
  status,
  error,
  onRetry,
  emptyCopy,
}: {
  status: 'loading' | 'empty' | 'error'
  error?: string
  onRetry?: () => void
  emptyCopy: string
}) {
  if (status === 'loading') {
    return (
      <p className="mt-16 text-sm text-wood/60" role="status">
        Завантажуємо помешкання…
      </p>
    )
  }

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
