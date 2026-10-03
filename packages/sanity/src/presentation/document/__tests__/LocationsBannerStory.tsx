import {EnvelopeIcon} from '@sanity/icons/Envelope'
import {MobileDeviceIcon} from '@sanity/icons/MobileDevice'
import {isObjectSchemaType} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import {useSchema} from 'sanity'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {presentationUsEnglishLocaleBundle} from '../../i18n'
import {
  type DocumentLocation,
  type DocumentLocationsState,
  type PresentationPluginOptions,
} from '../../types'
import {LocationsBanner} from '../LocationsBanner'

const OPTIONS: PresentationPluginOptions = {
  name: 'presentation',
  previewUrl: '/preview',
  title: 'Presentation',
}

const LOCATIONS: DocumentLocation[] = [
  {title: 'Web view', href: '/newsletter/spring-launch'},
  {title: 'Email client view', href: '/newsletter/spring-launch/email', icon: EnvelopeIcon},
  {
    title: 'Mobile app',
    href: '/newsletter/spring-launch/app',
    icon: MobileDeviceIcon,
    showHref: false,
  },
]

const STATES: Array<{label: string; state: DocumentLocationsState; showPresentationTitle?: true}> =
  [
    {label: 'locations (expanded by play)', state: {locations: LOCATIONS}},
    {label: 'no locations', state: {locations: []}},
    {
      label: 'message with tool title',
      state: {message: 'Used on every page through the site footer'},
      showPresentationTitle: true,
    },
    {label: 'positive', state: {message: 'Published to the storefront', tone: 'positive'}},
    {
      label: 'caution',
      state: {message: 'Not reachable from any published page', tone: 'caution'},
    },
    {label: 'critical', state: {message: 'Preview URL could not be resolved', tone: 'critical'}},
  ]

function Banners() {
  const schemaType = useSchema().get('page')
  if (!isObjectSchemaType(schemaType)) return null

  return (
    <Stack gap={5}>
      {STATES.map(({label, state, showPresentationTitle}) => (
        <Stack key={label} gap={2}>
          <Text muted size={1} weight="medium">
            {label}
          </Text>
          <LocationsBanner
            documentId="page-spring-launch"
            options={OPTIONS}
            resolvers={{page: state}}
            schemaType={schemaType}
            showPresentationTitle={showPresentationTitle ?? false}
            version={undefined}
          />
        </Stack>
      ))}
    </Stack>
  )
}

/**
 * Chromatic sentinel for the Presentation locations banner in the document
 * header after the ui5 Stack-to-Flex migration: the expanded location list's
 * row gap, each row's title/href column, and the tone banners' icon column.
 * Every state is an explicit `DocumentLocationsState` resolver, so nothing
 * resolves against a store and the `resolving` spinner never renders.
 */
export function LocationsBannerStory() {
  return (
    <TestWrapper
      i18nBundles={[presentationUsEnglishLocaleBundle]}
      schemaTypes={[{name: 'page', type: 'document', fields: [{name: 'title', type: 'string'}]}]}
    >
      <Card padding={4} style={{maxWidth: 560}}>
        <Banners />
      </Card>
    </TestWrapper>
  )
}
