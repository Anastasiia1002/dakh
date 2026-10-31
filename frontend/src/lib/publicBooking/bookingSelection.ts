export type RoomListStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'
export type RoomPlace = 'room' | 'house'

export const ROOM_SELECTION_HEADING: Record<RoomPlace, string> = {
  room: 'Оберіть кімнату',
  house: 'Оберіть будинок',
}

export const ROOM_SELECTION_INSTRUCTION =
  'Позначте одне вільне помешкання. Обране підсвічується. Заявку можна надіслати лише після вибору.'

export type RoomListPresentation = {
  state: 'need-dates' | 'loading' | 'error' | 'empty' | 'ready'
  message: string
}

export function roomListPresentation(input: {
  searchable: boolean
  status: RoomListStatus
  error: string
  place: RoomPlace
}): RoomListPresentation {
  if (!input.searchable) {
    return {
      state: 'need-dates',
      message: 'Оберіть дати заїзду й виїзду, щоб побачити вільні помешкання.',
    }
  }
  if (input.status === 'loading' || input.status === 'idle') {
    return {
      state: 'loading',
      message: input.place === 'house' ? 'Шукаємо вільні будинки…' : 'Шукаємо вільні кімнати…',
    }
  }
  if (input.status === 'error') {
    return {
      state: 'error',
      message: input.error || 'Не вдалося завантажити вільні помешкання.',
    }
  }
  if (input.status === 'empty') {
    return {
      state: 'empty',
      message:
        input.place === 'house'
          ? 'На ці дати немає вільних будинків. Спробуйте інші дати або зменшіть кількість гостей.'
          : 'На ці дати немає вільних кімнат. Спробуйте інші дати або зменшіть кількість гостей.',
    }
  }
  return { state: 'ready', message: '' }
}

export function roomOptionFrame(selected: boolean) {
  return selected ? 'border-2 border-clay bg-beige' : 'border border-wood/25 bg-linen hover:border-clay/60'
}

export function roomOptionMark(selected: boolean) {
  return selected ? 'Обрано' : 'Обрати'
}

export function bookingSubmitBlockReason(input: {
  bookingEnabled: boolean
  step: string
  busy: boolean
  searchable: boolean
  roomSelected: boolean
  availabilityStatus: RoomListStatus
  quoteStatus: RoomListStatus
  quoteReady: boolean
  guestValid: boolean
  roomRejected: boolean
  roomMissing: boolean
}): string | null {
  if (!input.bookingEnabled || input.step !== 'collect') return null
  if (input.busy) return 'Надсилаємо заявку…'
  if (input.roomRejected || input.roomMissing) {
    return 'Це помешкання не підтверджене для цих дат. Оберіть інші дати або інше помешкання.'
  }
  if (!input.searchable) return 'Спочатку оберіть дати заїзду й виїзду.'
  if (input.availabilityStatus === 'loading' || input.quoteStatus === 'loading') {
    return 'Чекаємо відповідь сервера. Кнопка стане доступною після розрахунку.'
  }
  if (input.availabilityStatus === 'error' || input.quoteStatus === 'error') {
    return 'Заявку не можна надіслати, доки сервер не підтвердить наявність і суму.'
  }
  if (!input.roomSelected) return 'Оберіть помешкання у списку. Без вибору кнопку надсилання вимкнено.'
  if (!input.quoteReady) return 'Розрахунок ще не готовий або застарів. Нову суму запитає сервер.'
  if (!input.guestValid) return 'Заповніть ім’я, телефон і пошту, щоб увімкнути надсилання.'
  return null
}
