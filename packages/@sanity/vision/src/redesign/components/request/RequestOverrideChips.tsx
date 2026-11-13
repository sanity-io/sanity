import {Button} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {useMemo} from 'react'
import {getDefaultVariant, getVariantTitle, usePerspective, useTranslation} from 'sanity'
import {Text} from 'ui5'

import {visionLocaleNamespace} from '../../../i18n'
import {type ResolvedRequest, useRequestEnvironment} from '../../hooks/useResolvedRequest'
import {type VisionTabOptions} from '../../store/types'
import {getRequestOverrides} from '../../util/requestOverrides'
import {type RevealedOption} from './ApiVersionButton'
import {useGlobalPerspectiveName, usePerspectiveOptionName} from './OptionFields'

export interface RequestOverrideChipsProps {
  options: VisionTabOptions
  resolved: Pick<ResolvedRequest, 'tabPerspective'>
  /** Shows a field in the Options panel */
  onReveal: (option: RevealedOption) => void
}

interface OverrideChipProps {
  testId: string
  text: string
  tooltip: string
  onClick: () => void
}

function OverrideChip({testId, text, tooltip, onClick}: OverrideChipProps) {
  return (
    <Tooltip
      animate
      content={
        <Text size={1} as="div" trim={true}>
          {tooltip}
        </Text>
      }
      placement="top"
      portal
    >
      <Button
        data-testid={testId}
        fontSize={1}
        mode="bleed"
        onClick={onClick}
        padding={2}
        text={text}
      />
    </Tooltip>
  )
}

/**
 * Chips next to the API version button for the options where the tab departs from the studio's
 * global state, so that stays visible while the Options panel is collapsed
 */
export function RequestOverrideChips({options, resolved, onReveal}: RequestOverrideChipsProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const environment = useRequestEnvironment()
  const overrides = useMemo(() => getRequestOverrides(options, environment), [environment, options])
  const perspectiveName = usePerspectiveOptionName(resolved.tabPerspective)
  const globalPerspectiveName = useGlobalPerspectiveName()
  const {selectedVariants} = usePerspective()
  const selectedVariant = getDefaultVariant(selectedVariants)

  return (
    <>
      {overrides.dataset && (
        <OverrideChip
          onClick={() => onReveal('dataset')}
          testId="vision-override-dataset-button"
          text={t('vision.overrides.dataset.button', {dataset: overrides.dataset.dataset})}
          tooltip={t('vision.overrides.dataset.tooltip', overrides.dataset)}
        />
      )}
      {overrides.perspective && (
        <OverrideChip
          onClick={() => onReveal('perspective')}
          testId="vision-override-perspective-button"
          text={t('vision.overrides.perspective.button', {perspective: perspectiveName})}
          tooltip={t('vision.overrides.perspective.tooltip', {
            perspective: perspectiveName,
            globalPerspective: globalPerspectiveName,
          })}
        />
      )}
      {overrides.variant && (
        <OverrideChip
          onClick={() => onReveal('variant')}
          testId="vision-override-variant-button"
          text={t('vision.overrides.variant.button')}
          tooltip={t('vision.overrides.variant.tooltip', {
            variant: selectedVariant
              ? getVariantTitle(selectedVariant)
              : overrides.variant.globalVariant,
          })}
        />
      )}
    </>
  )
}
