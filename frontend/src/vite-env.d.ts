/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_API_BASE_URL?: string
  readonly VITE_PUBLIC_HOTEL_SLUG?: string
  /** Exactly `split` or `merged`. Selects the accommodation API hotel. Not inferred from the build mode. */
  readonly VITE_ACCOMMODATION_HOTEL_MAP?: string
  readonly VITE_PUBLIC_ROOM_SLUG_MAP?: string
  readonly VITE_API_BASE_URL?: string
  /** Only the exact string `true` turns on quotes, intents, OTP and confirmation. */
  readonly VITE_BOOKING_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
