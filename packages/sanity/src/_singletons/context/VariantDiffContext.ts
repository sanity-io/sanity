import {createContext} from 'sanity/_createContext'

/**
 * @internal
 */
export type VariantDiffContextValue =
  | {
      enabled: true
      /** Names of the top-level fields that differ from the Default audience's document. */
      changedFields: ReadonlySet<string>
      /**
       * Opens the review-changes inspector. Supplied by the document pane, because the inspector
       * API lives in `structure` and is not reachable from `core`.
       */
      onReviewChanges: (() => void) | undefined
    }
  | {enabled: false}

/**
 * @internal
 */
export const VariantDiffContext = createContext<VariantDiffContextValue>(
  'sanity/_singletons/context/variant-diff',
  {enabled: false},
)
