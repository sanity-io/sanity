import {CopyIcon} from '@sanity/icons/Copy'
import {ResetIcon} from '@sanity/icons/Reset'
import {type FormNodeValidation} from '@sanity/types'
import {Card, Stack, Text} from '@sanity/ui'
import noop from 'lodash-es/noop.js'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {type DocumentFieldActionNode} from '../../../../config/document/fieldActions/types'
import {FormFieldBaseHeader} from '../FormFieldBaseHeader'
import {FormFieldHeaderText} from '../FormFieldHeaderText'
import {FormFieldSet} from '../FormFieldSet'
import {FormFieldSetLegend} from '../FormFieldSetLegend'
import {FormFieldValidationStatus} from '../FormFieldValidationStatus'

const LONG_TITLE =
  'Canonical page title shown in search results, social cards and the browser tab whenever no override is set'

const ERRORS: FormNodeValidation[] = [
  {level: 'error', message: 'Title is required.', path: ['title']},
]
const WARNINGS: FormNodeValidation[] = [
  {level: 'warning', message: 'Keep the title under 60 characters.', path: ['title']},
]
const MIXED: FormNodeValidation[] = [...ERRORS, ...WARNINGS]

const DEPRECATED = {reason: 'Use the excerpt field instead.'}

const FIELD_ACTIONS: DocumentFieldActionNode[] = [
  {type: 'action', title: 'Copy field', icon: CopyIcon, onAction: noop},
  {type: 'action', title: 'Clear field', icon: ResetIcon, onAction: noop, renderAsButton: true},
]

/**
 * Chromatic sentinel for the form field chrome ahead of the ui5 Flex
 * migration: header text with description, deprecated badge and validation
 * status, a long title that has to wrap next to its badges, collapsed and
 * expanded fieldset legends and fieldsets, validation status icons, and the
 * base header row with and without visible field actions. Fixture copy only;
 * shared with Storybook via a thin CSF wrapper.
 */
export function FormFieldChromeStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 480}}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              header text
            </Text>
            <Stack gap={4}>
              <FormFieldHeaderText inputId="header-plain" title="Title" />
              <FormFieldHeaderText
                description="Used to build the canonical URL."
                inputId="header-description"
                title="Slug"
              />
              <FormFieldHeaderText
                deprecated={DEPRECATED}
                inputId="header-deprecated"
                title="Summary"
              />
              <FormFieldHeaderText inputId="header-error" title="Email" validation={ERRORS} />
              <FormFieldHeaderText inputId="header-warning" title="Tags" validation={WARNINGS} />
              <FormFieldHeaderText
                deprecated={DEPRECATED}
                description="Wraps onto several lines while the badge and status stay centered."
                inputId="header-long"
                title={LONG_TITLE}
                validation={MIXED}
              />
            </Stack>
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              fieldset legend
            </Text>
            <Stack gap={4}>
              <FormFieldSetLegend collapsed collapsible onClick={noop} title="Collapsed fieldset" />
              <FormFieldSetLegend
                collapsed={false}
                collapsible
                onClick={noop}
                title="Expanded fieldset"
              />
            </Stack>
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              validation status
            </Text>
            <Stack gap={4}>
              <FormFieldValidationStatus fontSize={1} placement="top" validation={ERRORS} />
              <FormFieldValidationStatus fontSize={1} placement="top" validation={WARNINGS} />
              <FormFieldValidationStatus fontSize={1} placement="top" validation={MIXED} />
            </Stack>
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              fieldset
            </Text>
            <Stack gap={4}>
              <FormFieldSet
                collapsed
                collapsible
                description="Shipping and billing details for the order."
                inputId="fieldset-collapsed"
                onCollapse={noop}
                onExpand={noop}
                path={['address']}
                title={LONG_TITLE}
              >
                <Text size={1}>Hidden while collapsed</Text>
              </FormFieldSet>
              <FormFieldSet
                collapsed={false}
                collapsible
                description="Where the order ships."
                inputId="fieldset-expanded"
                onCollapse={noop}
                onExpand={noop}
                path={['address']}
                title="Address"
                validation={WARNINGS}
              >
                <Card border padding={3} radius={2}>
                  <Text muted size={1}>
                    Street
                  </Text>
                </Card>
                <Card border padding={3} radius={2}>
                  <Text muted size={1}>
                    Postal code
                  </Text>
                </Card>
              </FormFieldSet>
            </Stack>
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              base header
            </Text>
            <Stack gap={4}>
              <FormFieldBaseHeader
                content={
                  <FormFieldHeaderText
                    description="Shown above the input."
                    inputId="base-header"
                    title="Title"
                  />
                }
                fieldFocused={false}
                fieldHovered={false}
                inputId="base-header"
              />
              <FormFieldBaseHeader
                actions={FIELD_ACTIONS}
                content={<FormFieldHeaderText inputId="base-header-actions" title={LONG_TITLE} />}
                fieldFocused={false}
                fieldHovered
                inputId="base-header-actions"
              />
            </Stack>
          </Stack>
        </Stack>
      </Card>
    </TestWrapper>
  )
}
