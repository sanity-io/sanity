import {ImageIcon} from '@sanity/icons/Image'
import {type SanityDocument} from '@sanity/types'
import {Card} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {type ReactNode} from 'react'
import {Box, Flex, Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {LocaleProvider} from '../../i18n/components/LocaleProvider'
import {type VersionInfoDocumentStub} from '../../releases/store/types'
import {DetailBackButton} from '../detailLayout/DetailBackButton'
import {DocumentStatus} from '../documentStatus/DocumentStatus'
import {DocumentVersionIcons} from '../documentStatus/DocumentVersionIcons'
import {DocumentStatusIndicator} from '../documentStatusIndicator/DocumentStatusIndicator'
import {Media} from '../previews/_common/Media'
import {CircularProgress} from '../progress/CircularProgress'
import {LinearProgress} from '../progress/LinearProgress'
import {Resizable} from '../resizer/Resizable'
import {Resizer} from '../resizer/Resizer'
import {TimeZoneButton} from '../timeZone/timeZoneButton/TimeZoneButton'
import TimeZoneButtonElementQuery from '../timeZone/timeZoneButton/TimeZoneButtonElementQuery'
import {LegacyLayerProvider} from '../transitional/LegacyLayerProvider'

const PUBLISHED: VersionInfoDocumentStub = {
  _id: 'article-1',
  _rev: 'rev-published',
  _createdAt: '2024-01-01T00:00:00.000Z',
  _updatedAt: '2024-01-02T00:00:00.000Z',
  _type: 'article',
  _system: {group: {_ref: 'article-1', _weak: true}},
}

const DRAFT: VersionInfoDocumentStub = {
  ...PUBLISHED,
  _id: 'drafts.article-1',
  _rev: 'rev-draft',
  _system: {...PUBLISHED._system, bundleId: 'drafts'},
}

const VERSION_WITHOUT_RELEASE: VersionInfoDocumentStub = {
  ...PUBLISHED,
  _id: 'versions.rSpring.article-1',
  _rev: 'rev-version',
  _system: {...PUBLISHED._system, bundleId: 'rSpring'},
}

// `DocumentStatus` renders a relative "edited … ago" time from `_updatedAt`, so the status rows
// get stubs without timestamps and only show the published / draft labels.
const PUBLISHED_WITHOUT_TIMESTAMP: Partial<SanityDocument> = {_id: 'article-1', _type: 'article'}
const DRAFT_WITHOUT_TIMESTAMP: Partial<SanityDocument> = {
  _id: 'drafts.article-1',
  _type: 'article',
}

// Both deprecated components still render in production document lists, so they stay covered.
// oxlint-disable-next-line no-deprecated -- deprecated status row is still rendered in production
const StatusRow = DocumentStatus
// oxlint-disable-next-line no-deprecated -- deprecated status dot is still rendered in production
const StatusDot = DocumentStatusIndicator

const TIME_ZONE_SCOPE = {type: 'input', id: 'component-chrome'} as const

function Section(props: {title: string; children: ReactNode}) {
  return (
    <VStack gap={2}>
      <Text muted size={1} weight="medium" as="div" trim={true}>
        {props.title}
      </Text>
      {props.children}
    </VStack>
  )
}

/**
 * Small shared chrome from `core/components`: the linear and circular progress bars, the
 * resizable panel and its handle, the time zone button in both element-query widths, preview
 * media in every layout, the document status rows and dots, the detail back button and the
 * legacy layer provider. Timestamps are omitted from the status rows so no relative time is
 * rendered; the status rows still read the current locale, which `TestWrapper` does not mount,
 * so the studio `LocaleProvider` sits on top of the mock source.
 */
export function ComponentChromeStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <LocaleProvider>
        <Card padding={4} style={{maxWidth: 640}}>
          <VStack gap={5}>
            <Section title="linear progress: 0, 35, 100">
              <LinearProgress value={0} />
              <LinearProgress value={35} />
              <LinearProgress value={100} />
            </Section>

            <Section title="circular progress: 0, 35, 100, clamped">
              <Flex gap={3}>
                <CircularProgress value={0} />
                <CircularProgress value={35} />
                <CircularProgress value={100} />
                <CircularProgress value={140} />
              </Flex>
            </Section>

            <Section title="resizable panel (right handle), resizer alone (left)">
              <Card border radius={2} style={{height: 80}}>
                <Flex height="fill">
                  <Resizable initialWidth={240} maxWidth={400} minWidth={120}>
                    <Box padding={3}>
                      <Text size={1}>Resizable to 240px</Text>
                    </Box>
                  </Resizable>
                  <Box flexGrow={1} padding={3}>
                    <Text muted size={1}>
                      Remaining space
                    </Text>
                  </Box>
                </Flex>
              </Card>
              <Card border radius={2} style={{height: 48, position: 'relative'}}>
                <Resizer onResize={noop} onResizeStart={noop} position="left" />
              </Card>
            </Section>

            <Section title="time zone button: wide (element query), narrow, no switching">
              <TimeZoneButtonElementQuery style={{width: 480}}>
                <TimeZoneButton
                  timeZoneScope={TIME_ZONE_SCOPE}
                  tooltipContent="Displayed in the selected time zone"
                  useElementQueries
                />
              </TimeZoneButtonElementQuery>
              <TimeZoneButtonElementQuery style={{width: 160}}>
                <TimeZoneButton
                  timeZoneScope={TIME_ZONE_SCOPE}
                  tooltipContent="Displayed in the selected time zone"
                  useElementQueries
                />
              </TimeZoneButtonElementQuery>
              <Flex>
                <TimeZoneButton
                  allowTimeZoneSwitch={false}
                  timeZoneScope={TIME_ZONE_SCOPE}
                  tooltipContent="Fixed time zone"
                />
              </Flex>
            </Section>

            <Section title="preview media: icon in default/compact/detail/block, string, no border">
              <Flex alignItems="center" gap={3}>
                <Media
                  dimensions={{width: 33, height: 33}}
                  layout="default"
                  media={<ImageIcon />}
                />
                <Media
                  dimensions={{width: 25, height: 25}}
                  layout="compact"
                  media={<ImageIcon />}
                />
                <Media dimensions={{width: 65, height: 65}} layout="detail" media={<ImageIcon />} />
                <Media dimensions={{width: 33, height: 33}} layout="block" media={<ImageIcon />} />
                <Media dimensions={{width: 33, height: 33}} layout="default" media="A" />
                <Media
                  border={false}
                  dimensions={{width: 33, height: 33}}
                  layout="default"
                  media={<Card tone="primary" style={{width: '100%', height: '100%'}} />}
                  radius={3}
                />
              </Flex>
            </Section>

            <Section title="document status: published + draft (stacked, single line), draft only">
              <StatusRow draft={DRAFT_WITHOUT_TIMESTAMP} published={PUBLISHED_WITHOUT_TIMESTAMP} />
              <StatusRow
                draft={DRAFT_WITHOUT_TIMESTAMP}
                published={PUBLISHED_WITHOUT_TIMESTAMP}
                singleLine
              />
              <StatusRow draft={DRAFT_WITHOUT_TIMESTAMP} />
            </Section>

            <Section title="document status dots: published, draft, both, version without release">
              <Flex alignItems="center" gap={3}>
                <StatusDot published={PUBLISHED} />
                <StatusDot draft={DRAFT} />
                <StatusDot draft={DRAFT} published={PUBLISHED} />
                <StatusDot versions={{rSpring: VERSION_WITHOUT_RELEASE}} />
              </Flex>
            </Section>

            <Section title="version icons: published, draft">
              <Flex alignItems="center" gap={3}>
                <DocumentVersionIcons version={PUBLISHED} />
                <DocumentVersionIcons version={DRAFT} />
              </Flex>
            </Section>

            <Section title="detail back button inside a legacy layer">
              <LegacyLayerProvider zOffset="pane">
                <Flex>
                  <DetailBackButton onClick={noop} text="Back to documents" />
                </Flex>
              </LegacyLayerProvider>
            </Section>
          </VStack>
        </Card>
      </LocaleProvider>
    </TestWrapper>
  )
}
