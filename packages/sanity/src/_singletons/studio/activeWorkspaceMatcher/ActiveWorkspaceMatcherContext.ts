import {createContext} from 'react'
import type {ActiveWorkspaceMatcherContextValue} from 'sanity'

/** @internal */
export const ActiveWorkspaceMatcherContext =
  createContext<ActiveWorkspaceMatcherContextValue | null>(null)
