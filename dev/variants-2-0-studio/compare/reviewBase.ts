import {useSyncExternalStore} from 'react'

import {type Address, NONE, sameAddress} from './address'

// The ONE base of a review (Faheem, 21 Oct). The base is whatever the user chooses. Default: the published version of the document, so a
// document that changed against Published shows that change first. The review panel, the compare header and the list's review-pass count all
// read this base, so they cannot disagree. `null` is the default; a held address is a base the user picked.

let held: Address | null = null
const listeners = new Set<() => void>()
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => void listeners.delete(l)
}

/** The default base for what is being shown: the published version at the same address. A published view has no "changed against published", so it falls back to the base document (or the draft, for the base). */
export function defaultBase(showing: Address): Address {
  if (showing.perspective !== 'published')
    return {perspective: 'published', variant: showing.variant}
  return showing.variant !== NONE
    ? {perspective: 'published', variant: NONE}
    : {perspective: 'drafts', variant: NONE}
}

export const resolveBase = (showing: Address, chosen: Address | null): Address =>
  chosen ?? defaultBase(showing)

/** Sets the base. An address equal to the default for `showing` clears the choice, so "Back to Published" and "default" are one state. */
export function setReviewBase(next: Address | null, showing?: Address) {
  const value = next && showing && sameAddress(next, defaultBase(showing)) ? null : next
  if (value === held || (value && held && sameAddress(value, held))) return
  held = value
  listeners.forEach((l) => l())
}

export const useChosenBase = () => useSyncExternalStore(subscribe, () => held)

/** The base in force for `showing`, and whether the user picked it (not the default). */
export function useReviewBase(showing: Address) {
  const chosen = useChosenBase()
  const base = resolveBase(showing, chosen)
  return {base, isDefault: sameAddress(base, defaultBase(showing)), chosen}
}
