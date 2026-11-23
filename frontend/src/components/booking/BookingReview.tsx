import { Photo } from '../Photo'
import { formatDate } from '../../lib/format'
import { adultCountLabel, childCountLabel, nightCountLabel } from '../../lib/ukrainian'
import { PriceSummary } from './PriceSummary'
import { bookingEdit } from './bookingChrome'
import type { PublicQuoteResponse } from '../../lib/publicBooking/types'

export type ReviewExtra = { serviceId: string; name: string; quantity: number }

function SectionLabel({
  children,
  onEdit,
  editLabel = 'Змінити',
}: {
  children: string
  onEdit?: () => void
  editLabel?: string
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs font-medium tracking-[0.08em] uppercase text-wood/45">{children}</p>
      {onEdit ? (
        <button type="button" className={bookingEdit} onClick={onEdit}>
          {editLabel}
        </button>
      ) : null}
    </div>
  )
}

export function BookingReview({
  roomName,
  cover,
  checkIn,
  checkOut,
  nights,
  adults,
  children,
  extras,
  extrasEntered = false,
  guest,
  quote,
  onEditStay,
  onEditDates,
  onEditExtras,
  onEditContacts,
}: {
  roomName: string
  cover?: { url: string; coverKey: string; alt: string }
  checkIn: string
  checkOut: string
  nights: number
  adults: number
  children: number
  extras: readonly ReviewExtra[]
  extrasEntered?: boolean
  guest: { firstName: string; lastName: string; phone: string; email: string; comment: string }
  quote: PublicQuoteResponse | null
  onEditStay?: () => void
  onEditDates?: () => void
  onEditExtras?: () => void
  onEditContacts?: () => void
}) {
  const hasRoom = Boolean(roomName && roomName !== 'Помешкання')
  const hasStay = Boolean(checkIn && checkOut)
  const hasContacts = Boolean(
    guest.firstName.trim() || guest.lastName.trim() || guest.email.trim() || guest.phone.trim() || guest.comment.trim(),
  )
  const showExtras = extrasEntered || extras.length > 0
  return (
    <div className="divide-y divide-wood/10 text-sm text-wood">
      {hasRoom ? (
      <section className="pb-5">
        <SectionLabel onEdit={onEditStay}>Розміщення</SectionLabel>
        <div className="mt-3 flex gap-3">
          {cover ? (
            <span className="relative size-[4.5rem] shrink-0 overflow-hidden rounded-2xl bg-beige">
              <Photo src={cover.url} alt="" coverKey={cover.coverKey} sizes="72px" className="h-full w-full" />
            </span>
          ) : null}
          <p className="min-w-0 pt-0.5 font-medium leading-snug">{roomName}</p>
        </div>
      </section>
      ) : null}

      {hasStay ? (
      <section className="py-5">
        <SectionLabel onEdit={onEditDates ?? onEditStay} editLabel="Змінити дати">
          Проживання
        </SectionLabel>
        <dl className="mt-3 space-y-1.5 text-wood/75">
          {checkIn ? (
            <div className="flex justify-between gap-4">
              <dt>Заїзд</dt>
              <dd>{formatDate(checkIn)}</dd>
            </div>
          ) : null}
          {checkOut ? (
            <div className="flex justify-between gap-4">
              <dt>Виїзд</dt>
              <dd>{formatDate(checkOut)}</dd>
            </div>
          ) : null}
          {nights > 0 ? (
            <div className="flex justify-between gap-4">
              <dt>Ночей</dt>
              <dd>{nightCountLabel(nights)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt>Дорослі</dt>
            <dd>{adultCountLabel(adults)}</dd>
          </div>
          {children > 0 ? (
            <div className="flex justify-between gap-4">
              <dt>Діти</dt>
              <dd>{childCountLabel(children)}</dd>
            </div>
          ) : (
            <div className="flex justify-between gap-4">
              <dt>Діти</dt>
              <dd>0 дітей</dd>
            </div>
          )}
        </dl>
      </section>
      ) : null}

      {showExtras ? (
      <section className="py-5">
        <SectionLabel onEdit={onEditExtras}>Послуги</SectionLabel>
        {extras.length === 0 ? (
          <p className="mt-3 text-wood/65">Без додаткових послуг</p>
        ) : (
          <ul className="mt-3 space-y-1.5 text-wood/75">
            {extras.map((line) => (
              <li key={line.serviceId} className="flex justify-between gap-4">
                <span className="min-w-0">{line.name}</span>
                <span className="shrink-0 tabular-nums">× {line.quantity}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      ) : null}

      {hasContacts ? (
      <section className="py-5">
        <SectionLabel onEdit={onEditContacts}>Контакти</SectionLabel>
        <dl className="mt-3 space-y-1.5 text-wood/75">
          <div className="flex justify-between gap-4">
            <dt>Ім’я</dt>
            <dd className="text-right">
              {guest.firstName} {guest.lastName}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Телефон</dt>
            <dd>{guest.phone}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Пошта</dt>
            <dd className="break-all text-right">{guest.email}</dd>
          </div>
        </dl>
        {guest.comment.trim() ? (
          <div className="mt-3">
            <p className="text-xs font-medium tracking-[0.08em] uppercase text-wood/45">Коментар</p>
            <p className="mt-2 whitespace-pre-wrap text-wood/75">{guest.comment.trim()}</p>
          </div>
        ) : null}
      </section>
      ) : null}

      {quote ? (
      <section className="pt-5">
        <p className="mb-3 text-xs font-medium tracking-[0.08em] uppercase text-wood/45">Вартість</p>
        <PriceSummary quote={quote} nightCount={nights} />
      </section>
      ) : null}
    </div>
  )
}
