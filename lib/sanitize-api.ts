
export function sanitizeInput(input: string): string {
  if (!input) return ''
 
  return input
    .replace(/[<>]/g, '') 
    .replace(/javascript:/gi, '') 
    .replace(/on\w+=/gi, '') 
    .trim()
    .slice(0, 500)
}