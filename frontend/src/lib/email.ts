export function emailError(value: string) {
  const email = value.trim()
  if (!email) return 'Вкажіть пошту.'
  if (/\s/.test(email)) return 'У пошті не має бути пробілів.'
  if (!email.includes('@')) return 'У пошті має бути знак @, наприклад name@email.com.'
  const parts = email.split('@')
  if (parts.length !== 2) return 'У пошті має бути лише один знак @.'
  const [local, domain] = parts
  if (!local) return 'Перед @ має бути ім’я скриньки.'
  if (!domain) return 'Після @ вкажіть домен, наприклад gmail.com.'
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) {
    return 'Перевірте частину до знака @.'
  }
  if (!/^[A-Za-z0-9._%+-]+$/.test(local)) {
    return 'У імені скриньки лише латинські літери, цифри і ._%+-.'
  }
  if (
    !/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/.test(
      domain,
    )
  ) {
    return 'Перевірте домен. Має бути як gmail.com або ukr.net.'
  }
  if (email.length > 254) return 'Адреса задовга.'
  return undefined
}

export function isEmail(value: string) {
  return !emailError(value)
}
