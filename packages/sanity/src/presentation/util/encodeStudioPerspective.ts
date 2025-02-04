/**
 * When encoding the current studio perspective it's necessary to deal with it sometimes being an array, in a consistent way.
 */
export function encodeStudioPerspective(studioPerspective: string[] | string): string {
  return Array.isArray(studioPerspective) ? studioPerspective.join(',') : studioPerspective
}
