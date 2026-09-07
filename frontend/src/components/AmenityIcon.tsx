import type { AmenityIcon as IconName } from '../data/catalog'

const paths: Record<IconName, string> = {
  breakfast: 'M4 12h16M6 12V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5M5 16h14',
  linen: 'M4 7h16v10H4zM4 11h16',
  bath: 'M5 12h14v5H5zM7 12V8a2 2 0 0 1 4 0',
  window: 'M5 5h14v14H5zM12 5v14M5 12h14',
  quiet: 'M8 9v6M12 7v10M16 10v4',
  garden: 'M12 20V10M7 14c3-6 10-6 10 0',
}

export function AmenityIcon({ name }: { name: IconName }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-clay" fill="none" strokeWidth="1.4">
      <path d={paths[name]} />
    </svg>
  )
}
