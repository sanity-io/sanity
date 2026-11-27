import {CogIcon} from '@sanity/icons/Cog'
import {DocumentIcon} from '@sanity/icons/Document'
import {type ObjectField, type ValidationMarker} from '@sanity/types'
import {Card} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {ALL_FIELDS_GROUP} from '../../../../store/constants'
import {type FormFieldGroup} from '../../../../store/types/fieldGroup'
import {ValidationProvider} from '../../../../studio/contexts/Validation'
import {FieldGroupTabs} from '../FieldGroupTabs'

const TITLE_FIELD = {name: 'title', group: 'content'} as ObjectField
const SUMMARY_FIELD = {name: 'summary', group: 'seo'} as ObjectField
const NOTES_FIELD = {name: 'notes', group: 'legacy'} as ObjectField

const GROUPS: FormFieldGroup[] = [
  {
    name: ALL_FIELDS_GROUP.name,
    title: ALL_FIELDS_GROUP.title,
    i18n: ALL_FIELDS_GROUP.i18n,
    fields: [TITLE_FIELD, SUMMARY_FIELD, NOTES_FIELD],
  },
  {
    name: 'content',
    title: 'Content',
    icon: DocumentIcon,
    selected: true,
    fields: [TITLE_FIELD],
  },
  {
    name: 'seo',
    title: 'SEO',
    fields: [SUMMARY_FIELD],
  },
  {
    name: 'legacy',
    title: 'Legacy',
    icon: CogIcon,
    disabled: true,
    fields: [NOTES_FIELD],
  },
]

const VALIDATION: ValidationMarker[] = [
  {path: ['title'], level: 'error', message: 'A title is required'},
  {path: ['summary'], level: 'warning', message: 'Keep the summary short'},
]

function TabsCard({width}: {width: number}) {
  return (
    <Card border padding={2} radius={2} style={{width}}>
      <FieldGroupTabs
        groups={GROUPS}
        inputId="article"
        onClick={noop}
        path={[]}
        shouldAutoFocus={false}
      />
    </Card>
  )
}

/**
 * Chromatic sentinel for object field-group tabs after the mixed Sanity UI
 * TabList/Select and studio Tab wrapper layout. Wide cards keep the tab list;
 * a 240px card is meant to trip ElementQuery into the compact Select. Content
 * is selected with an error icon, SEO carries a warning, Legacy is disabled —
 * StatusIcon alignment on the tab is the ui5 Tab migration risk. Copy is
 * fixture titles plus studio i18n for All fields / validation suffixes.
 */
export function FieldGroupTabsStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <ValidationProvider validation={VALIDATION}>
        <Card padding={4} style={{maxWidth: 720}}>
          <VStack gap={5}>
            <VStack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                tabs
              </Text>
              <TabsCard width={640} />
            </VStack>
            <VStack gap={2}>
              <Text muted size={1} weight="medium" as="div" trim={true}>
                compact select
              </Text>
              <TabsCard width={240} />
            </VStack>
          </VStack>
        </Card>
      </ValidationProvider>
    </TestWrapper>
  )
}
