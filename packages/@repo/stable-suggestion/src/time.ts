import {type IsoDate} from './types'

export const DAY_MS = 86_400_000

export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.floor((Date.parse(to) - Date.parse(from)) / DAY_MS)
}

export function compareByAt(left: {at: IsoDate}, right: {at: IsoDate}): number {
  return left.at.localeCompare(right.at)
}
