import {type ObjectSchemaType} from '@sanity/types'
import {type ComponentType, type PropsWithChildren, useContext, useMemo} from 'react'
import {VariantDiffContext, type VariantDiffContextValue} from 'sanity/_singletons'

import {FormGutterCustomProperties} from '../../form/components/FormGutterCustomProperties'
import {useEditState} from '../../hooks/useEditState'
import {usePerspective} from '../../perspective/usePerspective'
import {type EditStateFor} from '../../store/document/document-pair/editState'
import {
  collateVariantChangedFields,
  selectVariantBaseDocument,
} from '../collateVariantChangedFields'

interface PropsEnabled extends PropsWithChildren {
  enabled: true
  /** The pair for the document being edited. Its `version` slot holds the variant document. */
  editState: EditStateFor
  schemaType: ObjectSchemaType
  /** Opens the review-changes inspector; threaded in because the inspector API lives in `structure`. */
  onReviewChanges: (() => void) | undefined
}

interface PropsDisabled extends PropsWithChildren {
  enabled: false
}

type Props = PropsEnabled | PropsDisabled

/**
 * Makes the set of fields that differ from the Default audience available to every field in the
 * form below it, so each one can mark itself.
 *
 * @internal
 */
export const VariantDiffProvider: ComponentType<Props> = (props) => {
  if (props.enabled) {
    return <VariantDiffProviderEnabled {...props} />
  }

  return props.children
}

const VariantDiffProviderEnabled: ComponentType<PropsEnabled> = ({
  editState,
  schemaType,
  onReviewChanges,
  children,
}) => {
  const {bundle, selectedReleaseId} = usePerspective()

  // The base pair, plus — inside a release — the base's own release version, which is in no slot of
  // the variant's pair. A release id is derivable, unlike a variant scope id, so this needs no
  // lookup. Outside a release the call resolves to the same memoized base pair, so it costs nothing.
  const baseEditState = useEditState(editState.id, editState.type, 'low', selectedReleaseId)

  const value = useMemo((): VariantDiffContextValue => {
    return {
      enabled: true,
      changedFields: collateVariantChangedFields({
        // The variant document is already checked out in the version slot of the pair. Nothing
        // needs fetching: both sides are live, so the set recomputes when either one changes.
        variantDocument: editState.version,
        baseDocument: selectVariantBaseDocument(baseEditState, bundle),
        schemaType,
      }),
      onReviewChanges,
    }
  }, [editState.version, baseEditState, bundle, schemaType, onReviewChanges])

  return (
    <VariantDiffContext.Provider value={value}>
      {/*
        Reserve the field gutters. This only ever writes the enabled value, never the disabled one,
        so it composes with the divergence feature's own toggle whichever way the two providers end
        up nested: an inactive variant selection leaves divergence's value untouched.

        The gutters are reserved as soon as a variant is selected rather than once the diff has
        resolved, so a diamond appearing does not shift the form's layout.
      */}
      <FormGutterCustomProperties $enabled>{children}</FormGutterCustomProperties>
    </VariantDiffContext.Provider>
  )
}

/**
 * Whether a top-level field differs from the Default audience's document. Always `false` outside a
 * variant selection.
 *
 * @internal
 */
export function useVariantDiff(fieldName: string | undefined): boolean {
  const context = useContext(VariantDiffContext)

  if (!context.enabled || typeof fieldName === 'undefined') {
    return false
  }

  return context.changedFields.has(fieldName)
}

/**
 * The review-changes callback, when a variant is selected.
 *
 * @internal
 */
export function useVariantReviewChanges(): (() => void) | undefined {
  const context = useContext(VariantDiffContext)

  return context.enabled ? context.onReviewChanges : undefined
}
