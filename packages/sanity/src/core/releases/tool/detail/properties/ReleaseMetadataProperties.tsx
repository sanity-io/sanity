import {type ReleaseDocument} from '@sanity/client'
import {Skeleton, Text as UIText} from '@sanity/ui'
import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import deepEqual from 'react-fast-compare'
import {Icon, Text} from 'ui5'

import {Button} from '../../../../../ui-components/button/Button'
import {ErrorBoundary} from '../../../../../ui-components/errorBoundary/ErrorBoundary'
import {type DetailPropertiesSection} from '../../../../components/detailLayout'
import {getHookId} from '../../../../components/hookCollection/actionId'
import {TextWithTone} from '../../../../components/textWithTone/TextWithTone'
import {
  type ReleasePropertyComponent,
  type ReleasePropertyDescription,
  type ReleasePropertyProps,
} from '../../../../config/releases/properties'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useWorkspace} from '../../../../studio/workspace'
import {isRecord} from '../../../../util/isRecord'
import {releasesLocaleNamespace} from '../../../i18n'
import {type DocumentInRelease} from '../types'
import {useDefaultReleaseProperties} from './useDefaultReleaseProperties'
import {warnOncePerProperty} from './warnOncePerProperty'

const COLLAPSE_THRESHOLD = 3

const DESCRIPTION_KEYS: ReadonlySet<string> = new Set([
  'label',
  'value',
  'icon',
  'tone',
  'href',
  'tooltip',
])

const PROPERTY_TONES: ReadonlySet<string> = new Set(['positive', 'caution', 'critical'])

type PropertyState =
  | {status: 'resolved'; description: ReleasePropertyDescription}
  | {status: 'hidden'}
  | {status: 'error'}

type ReportPropertyState = (hostKey: string, state: PropertyState) => void

type MetadataPropertyRow = NonNullable<DetailPropertiesSection['rows'][number]>

interface PropertyHostProps {
  args: ReleasePropertyProps
  hostKey: string
  onState: ReportPropertyState
}

interface KeyedProperty {
  hostKey: string
  property: ReleasePropertyComponent
}

const HIDDEN: PropertyState = {status: 'hidden'}
const ERROR: PropertyState = {status: 'error'}

function propertyName(property: ReleasePropertyComponent): string {
  return property.displayName || property.name || 'anonymous property'
}

function isComponentType(value: unknown): value is ComponentType {
  return typeof value === 'function' || (isRecord(value) && '$$typeof' in value)
}

function isPropertyTone(value: unknown): value is ReleasePropertyDescription['tone'] {
  return typeof value === 'string' && PROPERTY_TONES.has(value)
}

function toPropertyState(property: ReleasePropertyComponent, description: unknown): PropertyState {
  if (description === null) return HIDDEN

  if (
    isRecord(description) &&
    typeof description.label === 'string' &&
    typeof description.value === 'string'
  ) {
    const unknownKeys = Object.keys(description).filter((key) => !DESCRIPTION_KEYS.has(key))
    if (unknownKeys.length > 0) {
      warnOncePerProperty(
        property,
        `${propertyName(property)} returned unknown keys, which are ignored: ${unknownKeys.join(', ')}`,
      )
    }
    const {label, value, icon, tone, href, tooltip} = description
    return {
      status: 'resolved',
      description: {
        label,
        value,
        icon: isComponentType(icon) ? icon : undefined,
        tone: isPropertyTone(tone) ? tone : undefined,
        href: typeof href === 'string' ? href : undefined,
        tooltip: typeof tooltip === 'string' ? tooltip : undefined,
      },
    }
  }

  warnOncePerProperty(
    property,
    `${propertyName(property)} must return null or an object with a string label and value`,
  )
  return HIDDEN
}

function definePropertyHost(property: ReleasePropertyComponent): ComponentType<PropertyHostProps> {
  const useReleaseProperty = property

  return function ReleasePropertyHost({args, hostKey, onState}: PropertyHostProps) {
    const description: unknown = useReleaseProperty(args)

    useLayoutEffect(() => {
      onState(hostKey, toPropertyState(property, description))
    }, [description, hostKey, onState])

    return null
  }
}

const propertyHosts = new WeakMap<ReleasePropertyComponent, ComponentType<PropertyHostProps>>()

function getPropertyHost(property: ReleasePropertyComponent): ComponentType<PropertyHostProps> {
  const cached = propertyHosts.get(property)
  if (cached) return cached

  const host = definePropertyHost(property)
  propertyHosts.set(property, host)
  return host
}

function PropertyHostBoundary({
  hostKey,
  onState,
  children,
}: {
  hostKey: string
  onState: ReportPropertyState
  children: ReactNode
}): React.JSX.Element | null {
  const [failed, setFailed] = useState(false)

  const handleCatch = useCallback(() => {
    setFailed(true)
    onState(hostKey, ERROR)
  }, [hostKey, onState])

  if (failed) return null

  return <ErrorBoundary onCatch={handleCatch}>{children}</ErrorBoundary>
}

function PropertyHostSlot({property, ...hostProps}: PropertyHostProps & KeyedProperty) {
  const PropertyHost = getPropertyHost(property)

  return (
    <PropertyHostBoundary hostKey={hostProps.hostKey} onState={hostProps.onState}>
      {/* oxlint-disable-next-line react/static-components -- one cached host per property component, so its identity is stable */}
      <PropertyHost {...hostProps} />
    </PropertyHostBoundary>
  )
}

function keyProperties(properties: ReleasePropertyComponent[]): KeyedProperty[] {
  const occurrences = new Map<string, number>()

  return properties
    .filter((property) => typeof property === 'function')
    .map((property): KeyedProperty => {
      const id = getHookId(property)
      const occurrence = occurrences.get(id) ?? 0
      occurrences.set(id, occurrence + 1)
      return {hostKey: `${id}:${occurrence}`, property}
    })
}

function PropertyValue({description}: {description: ReleasePropertyDescription}) {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {value, tone, href} = description
  const tooltip = description.tooltip ?? value

  if (value === '') {
    return (
      <Text muted size={1} as="div" trim={true}>
        {t('dashboard.details.metadata.empty-value')}
      </Text>
    )
  }

  const content = href ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {value}
    </a>
  ) : (
    value
  )

  if (tone) {
    return (
      <TextWithTone size={1} tone={tone} textOverflow="ellipsis" title={tooltip}>
        {content}
      </TextWithTone>
    )
  }

  if (href) {
    return (
      <UIText size={1} textOverflow="ellipsis" title={tooltip}>
        {content}
      </UIText>
    )
  }

  return (
    <Text size={1} truncate={1} title={tooltip} as="div" trim={true}>
      {value}
    </Text>
  )
}

function PropertyError() {
  const {t} = useTranslation(releasesLocaleNamespace)

  return (
    <TextWithTone size={1} tone="critical" textOverflow="ellipsis">
      {t('dashboard.details.metadata.property-error')}
    </TextWithTone>
  )
}

const PROPERTY_SKELETON = <Skeleton animated radius={1} style={{width: 64, height: 11}} />

export interface ReleaseMetadataPropertiesProps {
  release: ReleaseDocument
  documents: DocumentInRelease[]
  loading: boolean
  documentsError?: boolean
  children: (props: {rows: MetadataPropertyRow[]; footer?: ReactNode}) => ReactNode
}

/** Each row runs in its own error-bounded host and reports from a layout effect, so rows paint with the page. */
export function ReleaseMetadataProperties({
  release,
  documents,
  loading,
  documentsError = false,
  children,
}: ReleaseMetadataPropertiesProps): React.JSX.Element {
  const {t} = useTranslation(releasesLocaleNamespace)
  const {properties: defaultProperties, fieldTitles} = useDefaultReleaseProperties()
  const resolveProperties = useWorkspace().releases?.properties
  const awaitingDocuments = Boolean(resolveProperties) && loading
  const [states, setStates] = useState<ReadonlyMap<string, PropertyState>>(() => new Map())
  const [collapsed, setCollapsed] = useState(false)

  const args = useMemo((): ReleasePropertyProps => ({release, documents}), [release, documents])

  const properties = useMemo(() => {
    if (awaitingDocuments) return []
    if (documentsError) return defaultProperties
    return resolveProperties ? resolveProperties(args, defaultProperties) : defaultProperties
  }, [args, awaitingDocuments, defaultProperties, documentsError, resolveProperties])

  const keyedProperties = useMemo(() => keyProperties(properties), [properties])

  const handleState = useCallback<ReportPropertyState>((hostKey, state) => {
    setStates((current) =>
      deepEqual(current.get(hostKey), state) ? current : new Map(current).set(hostKey, state),
    )
  }, [])

  function errorLabel(property: ReleasePropertyComponent): string {
    return (
      (property.field && fieldTitles.get(property.field)) ||
      property.displayName ||
      t('dashboard.details.metadata.property-error-label')
    )
  }

  const resolvedRows = keyedProperties.flatMap(({hostKey, property}): MetadataPropertyRow[] => {
    const state = states.get(hostKey)
    if (state?.status === 'error') {
      return [{label: errorLabel(property), value: <PropertyError />}]
    }
    if (state?.status === 'resolved') {
      const {description} = state
      return [
        {
          icon: description.icon ? (
            <Icon size={1} muted style={{margin: '-0.375rem'}} icon={description.icon} />
          ) : undefined,
          label: description.label,
          value: <PropertyValue description={description} />,
        },
      ]
    }
    return []
  })

  const skeletonLabels = defaultProperties.length > 0 ? [...fieldTitles.values()] : ['']
  const skeletonRows = skeletonLabels.map((label): MetadataPropertyRow => ({
    label,
    value: PROPERTY_SKELETON,
  }))

  const collapsible = resolvedRows.length >= COLLAPSE_THRESHOLD
  const metadataRows = awaitingDocuments ? skeletonRows : resolvedRows
  const rows = collapsible && collapsed ? [] : metadataRows

  const footer = collapsible ? (
    <Button
      mode="bleed"
      aria-expanded={!collapsed}
      data-testid="release-properties-toggle"
      text={
        collapsed
          ? t('dashboard.details.metadata.show-more', {count: resolvedRows.length})
          : t('dashboard.details.metadata.show-fewer')
      }
      onClick={() => setCollapsed((current) => !current)}
    />
  ) : undefined

  return (
    <>
      {keyedProperties.map(({hostKey, property}) => (
        <PropertyHostSlot
          key={hostKey}
          hostKey={hostKey}
          property={property}
          args={args}
          onState={handleState}
        />
      ))}
      {children({rows, footer})}
    </>
  )
}
