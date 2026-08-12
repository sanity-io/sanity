import {type Path} from '@sanity/types'
import {AnimatePresence} from 'motion/react'
import {type ComponentType} from 'react'

import {
  useVariantDiff,
  useVariantReviewChanges,
} from '../../variants/components/VariantDiffProvider'
import {VariantFieldIndicator} from '../../variants/components/VariantFieldIndicator'
import {FormDivergenceIndicator, useHasVisibleDivergence} from './FormDivergenceIndicator'

interface Props {
  path: Path
}

/**
 * The single mark in a field's start gutter.
 *
 * More than one feature wants to mark a field, and the gutter holds one cell, so the marks are
 * prioritised rather than stacked: an unresolved divergence outranks a variant difference, because
 * it is the one that asks the editor to act.
 *
 * @internal
 */
export const FormFieldGutterIndicator: ComponentType<Props> = ({path}) => {
  const hasDivergence = useHasVisibleDivergence(path)
  const isVariantChanged = useVariantDiff(topLevelFieldName(path))
  const onReviewChanges = useVariantReviewChanges()

  return (
    <>
      {/* Renders nothing of its own when this path has no unresolved divergence. */}
      <FormDivergenceIndicator path={path} />
      {!hasDivergence && (
        <AnimatePresence>
          {isVariantChanged && (
            <VariantFieldIndicator path={path} onReviewChanges={onReviewChanges} />
          )}
        </AnimatePresence>
      )}
    </>
  )
}

/**
 * The name of the document-level field at `path`, or `undefined` for anything nested.
 *
 * Variant differences are tracked at top-level granularity — matching revert and the
 * review-changes diff, so the three surfaces never disagree — and deriving the name from the path
 * is what enforces it: a nested field or array item resolves to no name and so is never marked.
 */
function topLevelFieldName(path: Path): string | undefined {
  const [first] = path

  return path.length === 1 && typeof first === 'string' ? first : undefined
}
