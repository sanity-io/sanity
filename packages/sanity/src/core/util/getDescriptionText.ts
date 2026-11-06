export function getDescriptionText(description: unknown): string {
  return typeof description === 'string' ? description : ''
}
