import {DatabaseIcon} from '@sanity/icons/Database'
import {Button} from '@sanity/ui'
import {Fragment, type ReactNode, useMemo} from 'react'
import {usePerspective} from 'sanity'
import {
  getDefaultVariant,
  getVariantTitle,
} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'
import {useTranslation} from 'sanity/i18n'

import {visionLocaleNamespace} from '../../../i18n'
import {type ResolvedRequest, useRequestEnvironment} from '../../hooks/useResolvedRequest'
import {type VisionTabOptions} from '../../store/types'
import {getRequestOverrides} from '../../util/requestOverrides'
import {VisionTooltip} from '../VisionTooltip'
import {type RevealedOption} from './ApiVersionButton'
import {OPTION_FIELD_ORDER, type OptionField} from './optionFieldOrder'
import {
  PerspectiveIcon,
  useGlobalPerspectiveName,
  usePerspectiveOptionName,
  usePerspectiveTitle,
} from './OptionFields'

export interface RequestOverrideChipsProps {
  options: VisionTabOptions
  resolved: Pick<ResolvedRequest, 'tabPerspective'>
  /** Shows a field in the Options panel */
  onReveal: (option: RevealedOption) => void
  /** The API version button, which takes the API version field's place in the order */
  apiVersionButton: ReactNode
}

interface OverrideChipProps {
  testId: string
  icon?: ReactNode
  text: string
  /** Names the option the chip shows, where the icon stands in for it in the visible text */
  ariaLabel?: string
  tooltip: string
  onClick: () => void
}

function OverrideChip({testId, icon, text, ariaLabel, tooltip, onClick}: OverrideChipProps) {
  return (
    <VisionTooltip content={tooltip} placement="top">
      <Button
        aria-label={ariaLabel}
        data-testid={testId}
        fontSize={1}
        icon={icon}
        mode="bleed"
        onClick={onClick}
        padding={2}
        text={text}
      />
    </VisionTooltip>
  )
}

/**
 * Chips in the query column's bottom bar for the options where the tab departs from the studio's
 * global state, so that stays visible while the Options panel is collapsed. They follow the order
 * of the Options panel's fields, the API version button first.
 */
export function RequestOverrideChips({
  options,
  resolved,
  onReveal,
  apiVersionButton,
}: RequestOverrideChipsProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const environment = useRequestEnvironment()
  const overrides = useMemo(() => getRequestOverrides(options, environment), [environment, options])
  const perspectiveName = usePerspectiveOptionName(resolved.tabPerspective)
  const perspectiveTitles = usePerspectiveTitle()
  const perspectiveTitle = perspectiveTitles(resolved.tabPerspective)
  const globalPerspectiveName = useGlobalPerspectiveName()
  const {selectedVariants} = usePerspective()
  const selectedVariant = getDefaultVariant(selectedVariants)

  const chips: Partial<Record<OptionField, ReactNode>> = {
    apiVersion: apiVersionButton,
    dataset: overrides.dataset && (
      <OverrideChip
        ariaLabel={t('vision.overrides.dataset.button', {dataset: overrides.dataset.dataset})}
        icon={<DatabaseIcon />}
        onClick={() => onReveal('dataset')}
        testId="vision-override-dataset-button"
        text={overrides.dataset.dataset}
        tooltip={t('vision.overrides.dataset.tooltip', overrides.dataset)}
      />
    ),
    perspective: overrides.perspective && (
      <OverrideChip
        ariaLabel={t('vision.overrides.perspective.button', {perspective: perspectiveTitle})}
        icon={<PerspectiveIcon perspective={resolved.tabPerspective} />}
        onClick={() => onReveal('perspective')}
        testId="vision-override-perspective-button"
        text={perspectiveTitle}
        tooltip={t('vision.overrides.perspective.tooltip', {
          perspective: perspectiveName,
          globalPerspective: globalPerspectiveName,
        })}
      />
    ),
    variant: overrides.variant && (
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
    ),
  }

  return (
    <>
      {OPTION_FIELD_ORDER.map((field) => (
        <Fragment key={field}>{chips[field]}</Fragment>
      ))}
    </>
  )
}
