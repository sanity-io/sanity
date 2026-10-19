import {createContext, type ReactNode, useContext} from 'react'

import {type DocumentTableSelection} from '../../../releases/tool/components/Table/DocumentTable'
import {type DocumentInVariantGroup} from './types'

/**
 * PROPOSED (Variants 2.0 test studio, branch explorations/variants-2-0-studio; not in stock Studio).
 *
 * Extension points on the shipped variant detail page (`VariantDocumentsTable`), for what the E5 spec adds to it:
 *  - `absentRows`: documents that have no version of this variant, appended as greyed rows;
 *  - `selection`: the bulk bar (the shared table already supports it; the shipped detail page does not pass one);
 *  - `rowActions`: the trailing per-row actions (the shipped component renders nothing there until FH-113);
 *  - `banner`: a slot above the table (a result notice, the confirm dialog).
 *
 * It is a hook, so the host can read its own state. The default returns `undefined`: Studio is unchanged unless a
 * provider is mounted.
 *
 * @internal
 */
export interface VariantDetailExtensionArgs {
  /** The variant document id (`_.variants.<id>`), if the variant has loaded. */
  variantId: string | undefined
  /** The rows the shipped page shows (documents that have a version of the variant). */
  rows: DocumentInVariantGroup[]
}

/** @internal */
export interface VariantDetailExtension {
  absentRows?: DocumentInVariantGroup[]
  /** One table row per stored version (the E5 rule) instead of one per document group. Row keys are `<groupId>|<bundle>`. */
  perVersionRows?: boolean
  selection?: DocumentTableSelection<DocumentInVariantGroup>
  rowActions?: (props: {datum: unknown}) => ReactNode
  banner?: ReactNode
}

/** @internal */
export type UseVariantDetailExtension = (args: VariantDetailExtensionArgs) => VariantDetailExtension | undefined

const noExtension: UseVariantDetailExtension = () => undefined

const VariantDetailExtensionContext = createContext<UseVariantDetailExtension>(noExtension)

/** @internal Provide a hook (a stable function) that extends the variant detail page. */
export const VariantDetailExtensionProvider = VariantDetailExtensionContext.Provider

/** @internal */
export function useVariantDetailExtension(args: VariantDetailExtensionArgs): VariantDetailExtension | undefined {
  // The context value is a stable hook supplied once by the host, so calling it keeps the hook order.
  const useExtension = useContext(VariantDetailExtensionContext)
  return useExtension(args)
}
