import { visibleWizardSteps, type WizardStepId } from '../../lib/publicBooking/bookingDraft'

export function BookingSteps({
  active,
  locked,
  summaries,
  onEdit,
}: {
  active: WizardStepId
  locked: boolean
  summaries: Partial<Record<WizardStepId, string>>
  onEdit: (step: WizardStepId) => void
}) {
  const steps = visibleWizardSteps(locked)
  const activeIndex = steps.findIndex((step) => step.id === active)
  return (
    <ol className="mb-4 grid gap-2 sm:grid-cols-5">
      {steps.map((step, index) => {
        const done = index < activeIndex
        const current = index === activeIndex
        return (
          <li key={step.id} className={current ? 'text-clay' : done ? 'text-wood' : 'text-wood/40'}>
            <p className="text-[0.62rem] tracking-[0.12em] uppercase">{step.label}</p>
            {done && summaries[step.id] ? (
              <div className="mt-1 flex items-start justify-between gap-2">
                <p className="text-xs leading-snug text-wood/70">{summaries[step.id]}</p>
                <button
                  type="button"
                  className="shrink-0 text-[0.62rem] tracking-[0.12em] uppercase underline decoration-wood/30 underline-offset-4"
                  onClick={() => onEdit(step.id)}
                >
                  Змінити
                </button>
              </div>
            ) : null}
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
