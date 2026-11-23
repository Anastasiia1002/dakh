import { visibleWizardSteps, type WizardStepId } from '../../lib/publicBooking/bookingDraft'

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
    <ol className="grid w-full min-w-0 max-w-full grid-cols-5 gap-1 overflow-hidden">
      {steps.map((step, index) => {
        const current = index === activeIndex
        const done = index < activeIndex || (step.id === 'stay' && roomSelected && !current)
        return (
          <li
            key={step.id}
            className={`min-w-0 max-w-full overflow-hidden ${current ? 'text-clay' : done ? 'text-wood' : 'text-wood/35'}`}
            aria-current={current ? 'step' : undefined}
          >
            <p className="flex flex-col items-start gap-1 text-[0.58rem] font-medium leading-tight tracking-[0.04em] uppercase sm:flex-row sm:items-baseline sm:gap-1.5 sm:text-[0.68rem] sm:tracking-[0.12em]">
              <span className={`inline-flex size-5 shrink-0 items-center justify-center border text-[0.62rem] ${
                current ? 'border-clay bg-clay text-linen' : done ? 'border-wood/30 text-wood' : 'border-wood/20'
              }`}>
                {index + 1}
              </span>
              <span className="min-w-0 break-words">{step.label}</span>
            </p>
          </li>
        )
      })}
    </ol>
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
    <div className="mt-8 flex flex-wrap gap-3">
      {backHidden ? null : (
        <button
          type="button"
          onClick={onBack}
          className="min-h-11 border border-wood/20 px-5 text-[0.78rem] font-semibold tracking-[0.16em] uppercase"
        >
          Назад
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="min-h-11 bg-clay px-5 text-[0.78rem] font-semibold tracking-[0.16em] uppercase text-linen disabled:cursor-not-allowed disabled:bg-wood/20 disabled:text-wood/50"
      >
        {nextLabel}
      </button>
    </div>
  )
}
