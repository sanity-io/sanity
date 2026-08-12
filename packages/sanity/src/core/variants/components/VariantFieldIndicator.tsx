import {type Path} from '@sanity/types'
import {motion} from 'motion/react'
import {type ComponentType} from 'react'
import {styled} from 'styled-components'

import {Button} from '../../../ui-components/button/Button'
import {pathToAnchorIdent} from '../../form/utils/pathToAnchorIdent'
import {useTranslation} from '../../i18n/hooks/useTranslation'
import {variantsLocaleNamespace} from '../i18n'
import {RhombusFillIcon} from '../plugin/components/PersonalizationIcons'

/**
 * @internal
 */
export interface VariantFieldIndicatorProps {
  path: Path
  /** Opens the review-changes inspector. The mark is inert when absent. */
  onReviewChanges: (() => void) | undefined
}

/**
 * The mark in a field's start gutter saying "this field differs from the Default audience".
 *
 * Positioning is delegated to CSS anchor positioning against the input's own anchor ident, so the
 * mark tracks whatever height the input happens to be — single-line inputs, Portable Text, images —
 * without the field resolvers having to declare their alignment.
 *
 * @internal
 */
export const VariantFieldIndicator: ComponentType<VariantFieldIndicatorProps> = ({
  path,
  onReviewChanges,
}) => {
  const {t} = useTranslation(variantsLocaleNamespace)
  const label = t('field-indicator.modified')

  return (
    <Container $path={path} initial={{opacity: 0}} exit={{opacity: 0}} animate={{opacity: 1}}>
      <IndicatorButton
        aria-label={label}
        disabled={!onReviewChanges}
        icon={RhombusFillIcon}
        mode="bleed"
        onClick={onReviewChanges}
        radius="full"
        tone="suggest"
        tooltipProps={{content: label, placement: 'left'}}
      />
    </Container>
  )
}

/** Diamond size, in px. */
const MARK_SIZE = 13
/** Size of the control the diamond sits in, in px. */
const HIT_AREA_SIZE = 25

const IndicatorButton = styled(Button)`
  /*
    A 13px diamond centred in a 25px control, per the indicator pattern in the Studio Patterns
    library. Two things are pinned deliberately: the icon is sized in absolute pixels rather than
    inheriting the button's text size, because the mark is a fixed-size glyph and not text; and the
    control keeps its own size, so shrinking the mark does not shrink the hit target with it.
  */
  block-size: ${HIT_AREA_SIZE}px;
  inline-size: ${HIT_AREA_SIZE}px;

  svg[data-sanity-icon] {
    font-size: ${MARK_SIZE}px;
  }
`

const Container = styled(motion.div)<{$path: Path}>`
  @supports (position-anchor: --anchor) {
    position: absolute;
    ${({$path}) => ($path ? `position-anchor: ${pathToAnchorIdent('input', $path)};` : undefined)}
    inset-block-start: anchor(center);
    transform: translateY(-50%);
    line-height: 0;
  }
`
