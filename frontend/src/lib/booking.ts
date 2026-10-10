export type BookingDraft = {
  checkIn: string
  checkOut: string
  adults: number
  children: number
  roomTypeId: string
  ratePlanId: string
  name: string
  phone: string
  email: string
  comment: string
}

export const emptyDraft: BookingDraft = {
  checkIn: '',
  checkOut: '',
  adults: 2,
  children: 0,
  roomTypeId: '',
  ratePlanId: '',
  name: '',
  phone: '',
  email: '',
  comment: '',
}
