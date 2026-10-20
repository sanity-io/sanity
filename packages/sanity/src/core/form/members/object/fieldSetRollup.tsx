import {type Path} from '@sanity/types'
import {type ReactNode} from 'react'
import {FieldSetRollupContext} from 'sanity/_singletons'

/**
 * PROPOSED (Variants 2.0 test studio, branch explorations/variants-2-0-studio; not in stock Studio).
 *
 * A mark in the header of a field set (a group of fields under one collapsible title). A collapsed field set hides its fields, so a change inside it
 * (against the published version, or against the base variant) has no signal today (F2-AC1, F-REND-2). The host provides a plain function that
 * returns the mark for the field set's fields; with no provider nothing is drawn.
 *
 * @internal
 */
export interface FieldSetRollupArgs {
  name: string
  path: Path
  /** The paths of the fields in the field set. */
  fieldPaths: Path[]
  collapsed: boolean
}

/** @internal */
export type RenderFieldSetRollup = (args: FieldSetRollupArgs) => ReactNode

/** @internal Provide a function that draws a field set's roll-up mark. */
export const FieldSetRollupProvider = FieldSetRollupContext.Provider
