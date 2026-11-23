import { Link } from 'react-router-dom'
import { draftIsResumable, readBookingDraft, resumeBookingHref } from '../../lib/publicBooking/bookingDraft'

export function ResumeBookingLink() {
  const draft = readBookingDraft()
  if (!draftIsResumable(draft) || !draft) return null
  return (
    <p className="mt-4 text-sm text-wood/70">
      Є незавершене бронювання.{' '}
      <Link to={resumeBookingHref(draft)} className="text-clay underline decoration-clay/40 underline-offset-4">
        Продовжити бронювання
      </Link>
    </p>
  )
}
