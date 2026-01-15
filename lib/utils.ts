export function calculatePrice(): number {
  try {
    const now = new Date()
    const istOffset = 5.5 * 60 * 60 * 1000
    const istTime = new Date(now.getTime() + istOffset)
    const hours = istTime.getUTCHours()
    const minutes = istTime.getUTCMinutes()
    const totalMinutes = hours * 60 + minutes

    const nightStart = 22 * 60
    const nightEnd = 6 * 60 + 30

    if (totalMinutes >= nightStart || totalMinutes < nightEnd) {
      return 35
    }
    return 25
  } catch (error) {
    return 25
  }
}

export function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString()
}