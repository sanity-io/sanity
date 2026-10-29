import {defineLocaleResourceBundle} from 'sanity'

import {getComponent} from '../design-options/config'
import {getOptionState, onOptionsChange, resolveOption, useOption} from '../design-options/store'

/** The base document's name in each place: the pill that is always on screen, menus, the version inventory, and "Back to …". */
export interface BaseNames {
  pill: string
  menu: string
  inventory: string
  back: string
  /** Before a bundle, "Base · Drafts" (Create version's Start from). */
  short: string
  /** The inventory row's subtitle for the base, after the date. None: the row lists its changed fields like any other. */
  detail?: string
}

const SERVED = 'Default · served when no variant matches'

const NAMES: Record<string, BaseNames> = {
  // B to D drop the row subtitle "Base document": the title names it, and "Default" over "Base document" says two names.
  // A, as today: the document pill's clear link says "Back to All users (Default)", the banner "Back to All users". One `back` keeps the first.
  a: {
    pill: 'All users',
    menu: 'All users (Default)',
    inventory: 'Base · all visitors',
    back: 'All users (Default)',
    short: 'Base',
    detail: 'Base document',
  },
  b: {pill: 'Base', menu: 'Base', inventory: 'Base', back: 'Base', short: 'Base'},
  c: {pill: 'Default', menu: 'Default', inventory: 'Default', back: 'Default', short: 'Default'},
  d: {pill: 'Default', menu: SERVED, inventory: SERVED, back: 'Default', short: 'Default'},
}

function namesFor(option: string): BaseNames {
  return NAMES[option] ?? NAMES.a
}

/** The names now, outside React (model code). Components use `useBaseNames`, which re-renders when C15 changes. */
export function baseNames(): BaseNames {
  const component = getComponent('c15')
  return namesFor(component ? resolveOption(component, getOptionState()) : 'a')
}

export function useBaseNames(): BaseNames {
  return namesFor(useOption('c15'))
}

// Core's text re-renders only on a language change, so the studio reloads itself when C15 changes, and core's strings (Compare versions,
// version titles, field marks) match ours. The link's design and preset parameters go first: they would win over the new choice on reload.
let watching = false
function reloadOnChange() {
  if (watching || typeof window === 'undefined') return
  watching = true
  const loaded = baseNames()
  onOptionsChange(() => {
    if (baseNames() === loaded) return
    const url = new URL(window.location.href)
    url.searchParams.delete('design')
    url.searchParams.delete('preset')
    window.location.replace(url.toString())
  })
}

// Core's two strings for the base document, read when the namespace loads. Option A keeps core's text.
function coreOverride(key: string) {
  return async () => {
    reloadOnChange()
    const names = baseNames()
    return names === NAMES.a ? {} : {[key]: names.menu}
  }
}

export const baseNameBundles = [
  defineLocaleResourceBundle({
    locale: 'en-US',
    namespace: 'studio',
    resources: coreOverride('document-group.base-variant'),
  }),
  defineLocaleResourceBundle({
    locale: 'en-US',
    namespace: 'variants',
    resources: coreOverride('navbar.variant.default'),
  }),
]
