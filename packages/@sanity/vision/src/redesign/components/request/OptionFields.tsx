import {CircleIcon} from '@sanity/icons/Circle'
import {StackCompactIcon} from '@sanity/icons/StackCompact'
import {Card, Stack} from '@sanity/ui'
import {Autocomplete} from '@sanity/ui/autocomplete'
import {MenuDivider} from '@sanity/ui/menu'
import {type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState} from 'react'
import {ReleaseAvatarIcon, usePerspective, useWorkspace} from 'sanity'
import {
  getDefaultVariant,
  getVariantTitle,
  useScheduledDraftsEnabled,
} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'
import {useTranslation} from 'sanity/i18n'
import {Text, Box, Icon, VisuallyHidden} from 'ui5'

import {DEFAULT_API_VERSION, VARIANTS_API_VERSION} from '../../../apiVersions'
import {useVariantsEnabled} from '../../../hooks/useVariantsEnabled'
import {visionLocaleNamespace} from '../../../i18n'
import {useVisionTelemetry} from '../../../telemetry/useVisionTelemetry'
import {prefixApiVersion} from '../../../util/prefixApiVersion'
import {validateApiVersion} from '../../../util/validateApiVersion'
import {type VisionPerspective, type VisionVariantMode} from '../../store/types'
import {type ApiVersionOption, getApiVersionOptions} from '../../util/apiVersionOptions'
import {cx} from '../../util/cx'
import {getEffectivePerspective} from '../../util/tabPerspective'
import * as styles from '../redesign.module.css'
import {SwitchField} from '../SwitchField'
import {useTabElementId} from '../tabs/queryTabShown'
import * as themeStyles from '../themeTokens.module.css'
import {VisionTooltip} from '../VisionTooltip'
import {
  OptionItemContent,
  OptionMenuButton,
  OptionMenuGroupLabel,
  OptionMenuItem,
  OptionMenuNoMatches,
  OptionMenuSection,
} from './OptionMenu'

/** The label above an Options field; without `htmlFor` it names a field that labels itself */
export function FieldLabel({children, htmlFor}: {children: string; htmlFor?: string}) {
  if (!htmlFor) {
    return (
      <Text as="div" muted size={1} weight="medium" trim={true}>
        {children}
      </Text>
    )
  }
  return (
    <Text as="label" htmlFor={htmlFor} muted size={1} weight="medium" trim={true}>
      {children}
    </Text>
  )
}

interface ApiVersionFieldProps {
  id: string
  /** Any version, listed or typed in */
  value: string
  /** Locked to `VARIANTS_API_VERSION` while a variant is selected in the navbar */
  locked: boolean
  onChange: (apiVersion: string) => void
  /**
   * Log when this change is the version a query runs against.
   * Settings edits the default for new tabs and leaves this off.
   */
  trackQueryChanges?: boolean
}

/**
 * The API version: an autocomplete that lists today's date, the known versions newest dated
 * first, `vX` and `v1`, and takes any other one typed in, flagging it while it is not a valid
 * version
 */
export function ApiVersionField({
  id,
  value,
  locked,
  onChange,
  trackQueryChanges = false,
}: ApiVersionFieldProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const elementId = useTabElementId()(id)
  const telemetry = useVisionTelemetry()
  const shownValue = locked ? VARIANTS_API_VERSION : value
  const isValid = validateApiVersion(shownValue)
  const lockedHintId = useId()
  const options = useMemo(() => getApiVersionOptions([value]), [value])
  // The text the list opened with. Each keystroke is stored, so the query and the stored version
  // are the same string while typing; remembering the opening text is what keeps that from
  // matching every option.
  const openQuery = useRef<string | null>(null)
  const committedVersion = useRef(shownValue)
  useEffect(() => {
    committedVersion.current = shownValue
  }, [shownValue])
  // Autocomplete clears its query when `value` changes, which would show every option again.
  // Hold the version the field opened with until the edit ends, and let the stored version move.
  const [heldValue, setHeldValue] = useState<string | null>(null)
  const [listQuery, setListQuery] = useState<string | null>(null)
  // Typing narrows the list to the matching versions, without the group headings. Each keystroke
  // is stored, so the query is compared with the version the field opened with, not the stored one.
  const isFiltering = listQuery !== null && listQuery !== heldValue
  const todayTitle = t('vision.options.api-version.today')

  const change = useCallback(
    (next: string) => {
      if (next === value) return
      if (trackQueryChanges && validateApiVersion(next)) {
        telemetry.apiVersionChanged(!options.some((option) => option.value === next))
      }
      onChange(next)
    },
    [onChange, options, telemetry, trackQueryChanges, value],
  )

  const filterOption = useCallback(
    (query: string, option: ApiVersionOption) => {
      // Opening fills the input with the current version, before that version has been edited
      if (openQuery.current === null && query === committedVersion.current) {
        openQuery.current = query
      }
      if (query === openQuery.current) return true
      const normalized = query.trim().toLowerCase()
      if (!normalized) return true
      if (option.group === 'today' && todayTitle.toLowerCase().startsWith(normalized)) return true
      return option.value.toLowerCase().replace(/^v/, '').includes(normalized.replace(/^v/, ''))
    },
    [todayTitle],
  )

  const renderOption = useCallback(
    (option: ApiVersionOption) => {
      const index = options.indexOf(option)
      const startsGroup = !isFiltering && index > 0 && options[index - 1].group !== option.group
      return (
        <ApiVersionOptionItem
          divider={startsGroup}
          groupLabel={
            startsGroup && option.group === 'dated'
              ? t('vision.options.api-version.dated')
              : undefined
          }
          subtitle={
            option.group === 'today'
              ? option.value
              : option.note && t(API_VERSION_NOTE_KEYS[option.note])
          }
          testId={`${id}-option-${option.value}`}
          title={option.group === 'today' ? todayTitle : option.value}
        />
      )
    },
    [id, isFiltering, options, t, todayTitle],
  )

  return (
    <Stack gap={2}>
      <FieldLabel htmlFor={elementId}>{t('settings.api-version-label')}</FieldLabel>
      <VisionTooltip
        content={t('settings.api-version-locked-for-variant', {apiVersion: VARIANTS_API_VERSION})}
        disabled={!locked}
        placement="bottom"
      >
        {/*
          A disabled input gets neither pointer events nor focus, so while the field is locked
          the wrapper stands in for it: the tooltip listens to the wrapper, and the wrapper takes
          the input's place in the tab order as a group described by the reason for the lock,
          so a keyboard user can reach it too
        */}
        <Box
          aria-describedby={locked ? lockedHintId : undefined}
          aria-label={locked ? t('settings.api-version-label') : undefined}
          data-testid={`${id}-wrap`}
          role={locked ? 'group' : undefined}
          tabIndex={locked ? 0 : undefined}
        >
          {locked && (
            <VisuallyHidden id={lockedHintId}>
              {t('settings.api-version-locked-for-variant', {apiVersion: VARIANTS_API_VERSION})}
            </VisuallyHidden>
          )}
          <Autocomplete
            customValidity={isValid ? undefined : t('settings.error.invalid-api-version')}
            data-testid={`${id}-select`}
            disabled={locked}
            filterOption={filterOption}
            fontSize={1}
            id={elementId}
            maxLength={11}
            onBlur={() => {
              // Typed without the prefix, the version is stored the way it is sent
              if (!locked && validateApiVersion(value)) change(prefixApiVersion(value))
            }}
            onChange={change}
            onQueryChange={(query) => {
              setListQuery(query)
              // `null` is the list closing.
              if (query === null) {
                openQuery.current = null
                setHeldValue(null)
                return
              }
              if (locked) return
              setHeldValue((current) => current ?? shownValue)
              change(query)
            }}
            openButton
            options={options}
            padding={2}
            placeholder={DEFAULT_API_VERSION}
            popover={{
              animate: true,
              className: cx(styles.popoverScroll, themeStyles.themeTokens),
              constrainSize: true,
              fallbackPlacements: ['top-start'],
              matchReferenceWidth: false,
              placement: 'bottom-start',
              portal: true,
            }}
            renderOption={renderOption}
            value={heldValue ?? shownValue}
          />
        </Box>
      </VisionTooltip>
    </Stack>
  )
}

interface ApiVersionOptionItemProps {
  title: string
  subtitle?: string
  testId: string
  /** Opens a new group with a divider, and with `groupLabel` as its heading when there is one */
  divider: boolean
  groupLabel?: string
  /** Set by the autocomplete on the option it highlights */
  selected?: boolean
  disabled?: boolean
  tabIndex?: number
}

/**
 * An option of the API version list, in the item style of the other Options pickers. The
 * autocomplete makes the whole option clickable, so a group's divider and heading swallow clicks
 * rather than pick the version under them.
 */
function ApiVersionOptionItem({
  title,
  subtitle,
  testId,
  divider,
  groupLabel,
  selected,
  disabled,
  tabIndex,
}: ApiVersionOptionItemProps) {
  return (
    <>
      {divider && (
        <div aria-hidden onClick={(event) => event.stopPropagation()}>
          <Box paddingY={1}>
            <MenuDivider />
          </Box>
          {groupLabel && <OptionMenuGroupLabel>{groupLabel}</OptionMenuGroupLabel>}
        </div>
      )}
      <Card
        data-as="button"
        data-testid={testId}
        disabled={disabled}
        padding={1}
        radius={2}
        selected={selected}
        tabIndex={tabIndex}
        tone="inherit"
      >
        <OptionItemContent subtitle={subtitle} title={title} />
      </Card>
    </>
  )
}

const API_VERSION_NOTE_KEYS = {
  variants: 'vision.options.api-version.variants',
  experimental: 'vision.options.api-version.experimental',
  legacy: 'vision.options.api-version.legacy',
} as const satisfies Record<ApiVersionOption['note'] & string, string>

/** What the navbar's perspective is called right now: a release title, published, or drafts */
export function useGlobalPerspectiveName(): string {
  const {selectedPerspective, selectedPerspectiveName} = usePerspective()
  const isDraftModelEnabled = useWorkspace().document.drafts.enabled
  const releaseTitle =
    typeof selectedPerspective === 'object' ? selectedPerspective.metadata.title : undefined
  return releaseTitle ?? selectedPerspectiveName ?? (isDraftModelEnabled ? 'drafts' : 'published')
}

/** A tab's perspective as the perspective menu names it, "Auto (drafts)" for instance */
export function usePerspectiveOptionName(perspective: VisionPerspective): string {
  const {t} = useTranslation(visionLocaleNamespace)
  const globalName = useGlobalPerspectiveName()
  switch (perspective) {
    case 'global':
      return t('vision.options.auto.button', {name: globalName})
    case 'scheduledDrafts':
      return t('settings.perspectives.scheduled-drafts')
    case undefined:
      return t('settings.perspectives.default')
    case 'raw':
    case 'published':
    case 'drafts':
      return perspective
    default: {
      const unknownPerspective: never = perspective
      return String(unknownPerspective)
    }
  }
}

interface PerspectiveSelectProps {
  id: string
  value: VisionPerspective
  onChange: (perspective: VisionPerspective) => void
}

const PUBLISHED = 'published'
const DRAFTS = 'drafts'
const SCHEDULED = 'scheduled'

/** Trims a size 1 icon to the slot the release avatars take, as `ReleaseAvatarIcon` trims its own */
const PERSPECTIVE_ICON_STYLE = {margin: '-0.3125rem'}

/**
 * The perspective menu, laid out like the navbar's: Auto, the default, follows the navbar's
 * perspective; published and drafts come next, then the perspectives only Vision offers
 */
export function PerspectiveSelect({id, value, onChange}: PerspectiveSelectProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const {t: tStudio} = useTranslation()
  const elementId = useTabElementId()(id)
  const globalName = useGlobalPerspectiveName()
  const {selectedPerspective} = usePerspective()
  const isScheduledDraftsEnabled = useScheduledDraftsEnabled()
  const [query, setQuery] = useState('')
  // Shows what the request runs with: a stored scheduled drafts choice reads as Auto where
  // this workspace has no scheduled drafts, and the option is not listed
  const shownValue = getEffectivePerspective(value, isScheduledDraftsEnabled)
  const buttonText = usePerspectiveOptionName(shownValue)

  const items: {
    key: string
    value: VisionPerspective
    title: string
    subtitle?: string
    icon: ReactNode
    group: 'auto' | 'studio' | 'vision'
  }[] = [
    {
      key: 'global',
      value: 'global',
      title: t('vision.options.auto'),
      subtitle: t('vision.options.perspective.auto.subtitle', {name: globalName}),
      // What Auto resolves to: the drafts or published dot, or the release's avatar
      icon: <ReleaseAvatarIcon fontSize={2} release={selectedPerspective} size="small" />,
      group: 'auto',
    },
    {
      key: 'published',
      value: 'published',
      title: tStudio('release.navbar.published'),
      icon: <ReleaseAvatarIcon fontSize={2} release={PUBLISHED} size="small" />,
      group: 'studio',
    },
    {
      key: 'drafts',
      value: 'drafts',
      title: tStudio('release.navbar.drafts'),
      icon: <ReleaseAvatarIcon fontSize={2} release={DRAFTS} size="small" />,
      group: 'studio',
    },
    {
      key: 'raw',
      value: 'raw',
      title: 'raw',
      subtitle: t('vision.options.perspective.raw.subtitle'),
      icon: <Icon icon={StackCompactIcon} size={1} style={PERSPECTIVE_ICON_STYLE} />,
      group: 'vision',
    },
    {
      key: 'default',
      value: undefined,
      title: t('settings.perspectives.default'),
      subtitle: t('vision.options.perspective.default.subtitle'),
      icon: <Icon icon={CircleIcon} size={1} style={PERSPECTIVE_ICON_STYLE} />,
      group: 'vision',
    },
    ...(isScheduledDraftsEnabled
      ? [
          {
            key: 'scheduledDrafts',
            value: 'scheduledDrafts' as const,
            title: t('settings.perspectives.scheduled-drafts'),
            icon: <ReleaseAvatarIcon fontSize={2} releaseType={SCHEDULED} size="small" />,
            group: 'vision' as const,
          },
        ]
      : []),
  ]
  const normalizedQuery = query.trim().toLowerCase()
  const matching = items.filter(
    (item) =>
      !normalizedQuery ||
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.key.toLowerCase().includes(normalizedQuery),
  )
  const renderItem = (item: (typeof items)[number]) => (
    <OptionMenuItem
      icon={item.icon}
      key={item.key}
      onClick={() => onChange(item.value)}
      selected={shownValue === item.value}
      subtitle={item.subtitle}
      testId={`${id}-item-${item.key}`}
      title={item.title}
    />
  )
  const groups = (['auto', 'studio', 'vision'] as const)
    .map((group) => ({group, entries: matching.filter((item) => item.group === group)}))
    .filter(({entries}) => entries.length > 0)

  return (
    <Stack gap={2}>
      <FieldLabel htmlFor={elementId}>{t('settings.perspective-label')}</FieldLabel>
      <OptionMenuButton
        id={elementId}
        onClose={() => setQuery('')}
        onSearchQueryChange={setQuery}
        searchPlaceholder={t('vision.options.perspective.search-placeholder')}
        searchQuery={query}
        testId={id}
        text={buttonText}
        value={shownValue ?? 'default'}
      >
        {groups.map(({group, entries}) => (
          <OptionMenuSection
            key={group}
            title={group === 'vision' ? t('vision.options.perspective.more') : undefined}
          >
            {entries.map(renderItem)}
          </OptionMenuSection>
        ))}
        {groups.length === 0 && (
          <OptionMenuNoMatches>{t('vision.options.perspective.no-matches')}</OptionMenuNoMatches>
        )}
      </OptionMenuButton>
    </Stack>
  )
}

interface UseCdnFieldProps {
  testId: string
  checked: boolean
  onChange: (useCdn: boolean) => void
  /** How the CDN answers the query */
  notes?: string[]
  /** The short line under the switch; the Options pane leaves it to the info tooltip */
  showSummary?: boolean
}

/** The `useCdn` switch: queries go to the cached API CDN instead of the live API */
export function UseCdnField({
  testId,
  checked,
  onChange,
  notes = [],
  showSummary = true,
}: UseCdnFieldProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  return (
    <SwitchField
      checked={checked}
      description={showSummary ? t('vision.options.use-cdn.summary') : undefined}
      info={[t('vision.options.use-cdn.description'), ...notes]}
      onChange={onChange}
      testId={testId}
      title={t('vision.options.use-cdn')}
    />
  )
}

interface VariantSelectProps {
  id: string
  value: VisionVariantMode
  onChange: (variant: VisionVariantMode) => void
}

/**
 * Sends the navbar's variant with the query (Auto), or none; picking another variant is not
 * offered here. Shown only where the navbar has a variant selector of its own: a workspace with
 * variants switched off has no variant to send, so there is nothing to choose.
 */
export function VariantSelect({id, value, onChange}: VariantSelectProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const elementId = useTabElementId()(id)
  const isVariantsEnabled = useVariantsEnabled()
  const {selectedVariants, selectedVariantNames} = usePerspective()
  const selectedVariant = getDefaultVariant(selectedVariants)
  const globalVariantName = selectedVariant
    ? getVariantTitle(selectedVariant)
    : getDefaultVariant(selectedVariantNames)

  if (!isVariantsEnabled) return null

  return (
    <Stack gap={2}>
      <FieldLabel htmlFor={elementId}>{t('vision.options.variant-label')}</FieldLabel>
      <OptionMenuButton
        id={elementId}
        testId={id}
        text={
          value === 'none'
            ? t('vision.options.variant.none')
            : t('vision.options.auto.button', {
                name: globalVariantName ?? t('vision.options.variant.none'),
              })
        }
        value={value}
      >
        <OptionMenuSection>
          <OptionMenuItem
            onClick={() => onChange('global')}
            selected={value === 'global'}
            subtitle={
              globalVariantName
                ? t('vision.options.variant.auto.subtitle', {name: globalVariantName})
                : t('vision.options.variant.auto.subtitle-none')
            }
            testId={`${id}-item-global`}
            title={t('vision.options.auto')}
          />
          <OptionMenuItem
            onClick={() => onChange('none')}
            selected={value === 'none'}
            subtitle={t('vision.options.variant.none.subtitle')}
            testId={`${id}-item-none`}
            title={t('vision.options.variant.none')}
          />
        </OptionMenuSection>
      </OptionMenuButton>
    </Stack>
  )
}
