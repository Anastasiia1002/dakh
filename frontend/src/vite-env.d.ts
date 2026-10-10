/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_API_BASE_URL?: string
  readonly VITE_PUBLIC_HOTEL_SLUG?: string
  readonly VITE_PUBLIC_RATE_PLAN_ID?: string
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
