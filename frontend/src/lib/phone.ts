const MOBILE_NDC =
  /^(39|50|63|66|67|68|73|75|77|89|91|92|93|94|95|96|97|98|99)$/

function digitsOnly(value: string) {
  return value.replace(/\D/g, '')
}

/** Nine digits after the leading 0, e.g. 958180001 for 095 818 00 01. */
export function uaMobileNational(value: string) {
  let digits = digitsOnly(value)
  if (digits.startsWith('380')) digits = digits.slice(3)
  else if (digits.startsWith('80') && digits.length >= 11) digits = digits.slice(2)
  else if (digits.startsWith('0')) digits = digits.slice(1)
  if (digits.length !== 9) return null
  return digits
}

export function isUaMobile(value: string) {
  const national = uaMobileNational(value)
  if (!national) return false
  if (/^(\d)\1{8}$/.test(national)) return false
  return MOBILE_NDC.test(national.slice(0, 2))
}

export function formatUaMobile(value: string) {
  const national = uaMobileNational(value)
  if (!national || !isUaMobile(value)) return null
  return `+38 (0${national.slice(0, 2)}) ${national.slice(2, 5)}-${national.slice(5, 7)}-${national.slice(7, 9)}`
}

export function uaMobileError(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return 'Вкажіть телефон.'
  const digits = digitsOnly(trimmed)
  if (digits.length < 9) return 'Номер закороткий. Потрібно 10 цифр, як 095 818 00 01.'
  if (digits.length > 12) return 'Забагато цифр. Перевірте номер.'
  if (!isUaMobile(trimmed)) {
    return 'Це не схоже на український мобільний. Наприклад +38 (095) 818-00-01.'
  }
  return undefined
}
