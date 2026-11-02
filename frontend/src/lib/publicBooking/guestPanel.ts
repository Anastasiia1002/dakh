export type GuestPanelFrame = {
  top: number
  left: number
  width: number
  maxHeight: number
}

/** Keep the guest stepper inside the viewport, including a narrow phone and a right-edge card. */
export function guestPanelFrame(
  anchor: { top: number; bottom: number; left: number; right: number },
  viewport: { width: number; height: number },
): GuestPanelFrame {
  const margin = 12
  const width = Math.min(384, Math.max(220, viewport.width - margin * 2))
  let left = anchor.left
  if (left + width > viewport.width - margin) left = viewport.width - margin - width
  if (left < margin) left = margin
  const maxHeight = Math.max(160, Math.min(420, viewport.height - margin * 2))
  let top = anchor.bottom + 8
  if (top + 220 > viewport.height - margin && anchor.top - margin > 220) {
    top = Math.max(margin, anchor.top - 8 - Math.min(maxHeight, 280))
  }
  if (top + maxHeight > viewport.height - margin) {
    top = Math.max(margin, viewport.height - margin - maxHeight)
  }
  return {
    top: Math.round(top),
    left: Math.round(left),
    width: Math.round(width),
    maxHeight: Math.round(maxHeight),
  }
}
