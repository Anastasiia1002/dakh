import { visibleWizardSteps, type WizardStepId } from '../../lib/publicBooking/bookingDraft'
import { bookingBtnGhost, bookingBtnPrimary } from './bookingChrome'

export function BookingSteps({
  active,
  roomSelected = false,
}: {
  active: WizardStepId
  locked?: boolean
  roomSelected?: boolean
}) {
  const steps = visibleWizardSteps()
  const activeIndex = steps.findIndex((step) => step.id === active)
  return (
    <div>
      <ol className="flex w-full min-w-0 max-w-full items-center">
        {steps.map((step, index) => {
          const current = index === activeIndex
          const done = index < activeIndex || (step.id === 'stay' && roomSelected && !current)
          return (
            <li
              key={step.id}
              className="flex min-w-0 flex-1 items-center"
              aria-current={current ? 'step' : undefined}
            >
              <span className="flex min-w-0 flex-col items-center gap-1.5 sm:items-start">
                <span
                  className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[0.72rem] font-semibold ${
                    current
                      ? 'bg-clay text-linen shadow-[0_8px_18px_rgba(178,95,56,0.35)]'
                      : done
                        ? 'bg-wood text-linen'
                        : 'bg-beige text-wood/40'
                  }`}
                >
                  {done && !current ? (
                    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5 fill-none stroke-current stroke-[2]">
                      <path d="M3.5 8.2 6.4 11l6.1-7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={`hidden max-w-[6.5rem] truncate text-[0.68rem] font-medium leading-tight sm:block ${
                    current ? 'text-clay' : done ? 'text-wood' : 'text-wood/35'
                  }`}
                >
                  {step.label}
                </span>
              </span>
              {index < steps.length - 1 ? (
                <span
                  className={`mx-1.5 h-px min-w-2 flex-1 sm:mx-2 ${done || current ? 'bg-clay/35' : 'bg-wood/12'}`}
                  aria-hidden="true"
                />
              ) : null}
            </li>
          )
        })}
      </ol>
      <p className="mt-3 text-sm text-wood/55 sm:hidden">
        Крок {activeIndex + 1} з {steps.length} · {steps[activeIndex]?.label}
      </p>
    </div>
  )
}

export function WizardNav({
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  backHidden,
}: {
  onBack: () => void
  onNext: () => void
  nextLabel: string
  nextDisabled?: boolean
  backHidden?: boolean
}) {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-3">
      {backHidden ? null : (
        <button type="button" onClick={onBack} className={bookingBtnGhost}>
          Назад
        </button>
      )}
      <button type="button" onClick={onNext} disabled={nextDisabled} className={bookingBtnPrimary}>
        {nextLabel}
      </button>
    </div>
  )
}
