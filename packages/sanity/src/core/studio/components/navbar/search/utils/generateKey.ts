import {uuid} from '@sanity/uuid'

export function generateKey(): string {
  return uuid().slice(0, 8)
}
