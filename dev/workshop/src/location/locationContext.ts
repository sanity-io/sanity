import {createContext} from 'react'
import type {LocationContextValue} from './types'

export const LocationContext = createContext<LocationContextValue>({
  path: '/',
  title: '',
  query: {},
  segments: [],
  handleLinkClick: () => undefined,
  pushState: () => undefined,
  replaceState: () => undefined,
})
