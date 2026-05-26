// Input validation and sanitization utilities

function sanitizeHtml(input: string): string {
  // Simple HTML sanitization - strip all HTML tags
  return input.replace(/<[^>]*>/g, '').trim()
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-()]+$/
  return phoneRegex.test(phone) && phone.length <= 20
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function validateOrderNumber(orderNumber: string): boolean {
  return /^[A-Za-z0-9\-_]+$/.test(orderNumber) && orderNumber.length <= 50
}

export function sanitizeAddress(address: string): string {
  return sanitizeHtml(address).substring(0, 500)
}

export function sanitizeNotes(notes: string): string {
  return sanitizeHtml(notes).substring(0, 1000)
}
