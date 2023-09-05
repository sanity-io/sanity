import React from 'react'

/**
 * Creates a description id from a field id, for use with aria-describedby in the field,
 * and added to the descriptive element id.
 * @internal
 */
export function constructDescriptionId(
  id: string | undefined,
  description: React.ReactNode | undefined,
): string | undefined {
  if (!description || !id) return undefined
  return `desc_${id}`
}
