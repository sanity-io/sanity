import {type FormNodeValidation} from '@sanity/types'
import {Card, Text, TextInput} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {Box, VStack} from 'ui5'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {FieldPresenceInner} from '../../../presence/FieldPresence'
import {FormFieldBaseHeader} from '../formField/FormFieldBaseHeader'
import {FormFieldHeaderText} from '../formField/FormFieldHeaderText'
import {FormFieldSet} from '../formField/FormFieldSet'
import {FormFieldSetLegend} from '../formField/FormFieldSetLegend'
import {FormFieldStatus} from '../formField/FormFieldStatus'
import {FormCell} from '../layout/FormCell'
import {FormContainer} from '../layout/FormContainer'
import {FormRow} from '../layout/FormRow'

const REQUIRED_ERROR: FormNodeValidation[] = [
  {level: 'error', message: 'Required', path: ['title']},
]
const LENGTH_WARNING: FormNodeValidation[] = [
  {level: 'warning', message: 'Keep the title under 60 characters', path: ['title']},
]

const PRESENCE = [
  {
    user: {id: 'user-ada', displayName: 'Ada Lovelace'},
    path: ['title'],
    sessionId: 'session-ada',
    lastActiveAt: '2024-01-01T00:00:00.000Z',
  },
]

const DEPRECATED = {reason: 'Use the "Headline" field instead.'}

function Label({children}: {children: string}) {
  return (
    <Text muted size={1} weight="medium">
      {children}
    </Text>
  )
}

/**
 * Chromatic sentinel for the styled-components form field chrome: the
 * `FormFieldSet` fieldset (plain, collapsible, collapsed, nested, deprecated,
 * with validation), the `FormFieldSetLegend` toggle, the `FormFieldHeaderText`
 * title/description/badge row, `FormFieldBaseHeader` with presence, the
 * `FormFieldStatus` avatar slot and the `FormRow`/`FormCell`/`FormContainer`
 * grid. Fixture copy only; field actions stay hidden (no hover).
 */
export function FormFieldChromeStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 640}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Label>fieldset (default, with description)</Label>
            <FormFieldSet
              description="Where the article is shown."
              inputId="fieldset-plain"
              path={['placement']}
              title="Placement"
            >
              <TextInput defaultValue="Front page" />
            </FormFieldSet>
          </VStack>

          <VStack gap={2}>
            <Label>fieldset (collapsible, nested level 1, warning)</Label>
            <FormFieldSet
              collapsible
              collapsed={false}
              inputId="fieldset-collapsible"
              level={1}
              onCollapse={noop}
              onExpand={noop}
              path={['seo']}
              title="SEO"
              validation={LENGTH_WARNING}
            >
              <TextInput defaultValue="Autumn campaign" />
            </FormFieldSet>
          </VStack>

          <VStack gap={2}>
            <Label>fieldset (collapsed, deprecated, columns)</Label>
            <FormFieldSet
              collapsible
              collapsed
              columns={2}
              deprecated={DEPRECATED}
              inputId="fieldset-collapsed"
              onCollapse={noop}
              onExpand={noop}
              path={['legacy']}
              title="Legacy metadata"
            >
              <TextInput defaultValue="Hidden" />
            </FormFieldSet>
          </VStack>

          <VStack gap={2}>
            <Label>legend (static, collapsible open, collapsible closed)</Label>
            <FormFieldSetLegend collapsed={false} title="Static legend" />
            <FormFieldSetLegend collapsed={false} collapsible onClick={noop} title="Expanded" />
            <FormFieldSetLegend collapsed collapsible onClick={noop} title="Collapsed" />
          </VStack>

          <VStack gap={2}>
            <Label>header text (title, untitled, deprecated, error, suffix)</Label>
            <FormFieldHeaderText
              description="Shown in the browser tab."
              inputId="header-title"
              title="Title"
            />
            <FormFieldHeaderText inputId="header-untitled" />
            <FormFieldHeaderText deprecated={DEPRECATED} inputId="header-deprecated" title="Slug" />
            <FormFieldHeaderText
              inputId="header-error"
              title="Required title"
              validation={REQUIRED_ERROR}
            />
            <FormFieldHeaderText
              inputId="header-suffix"
              suffix={
                <Text muted size={0}>
                  optional
                </Text>
              }
              title="Subtitle"
            />
          </VStack>

          <VStack gap={2}>
            <Label>base header with presence</Label>
            <FormFieldBaseHeader
              actions={[]}
              content={<FormFieldHeaderText inputId="base-header" title="Author" />}
              fieldFocused={false}
              fieldHovered={false}
              inputId="base-header"
              presence={PRESENCE}
            />
          </VStack>

          <VStack gap={2}>
            <Label>field status (bottom, top, max 1 avatar)</Label>
            <Card border padding={2}>
              <FormFieldStatus>
                <FieldPresenceInner presence={PRESENCE} maxAvatars={4} />
              </FormFieldStatus>
            </Card>
            <Card border padding={2}>
              <FormFieldStatus maxAvatars={1} position="top">
                <FieldPresenceInner presence={PRESENCE} maxAvatars={1} />
              </FormFieldStatus>
            </Card>
          </VStack>

          <VStack gap={2}>
            <Label>form container, row and cells</Label>
            <Card border>
              <FormContainer>
                <FormRow
                  gutterStartCell={
                    <Card tone="primary" style={{height: 24}} data-testid="gutter-cell" />
                  }
                >
                  <Card tone="positive" padding={3}>
                    <Text size={1}>Row body with a gutter cell</Text>
                  </Card>
                </FormRow>
                <Box marginTop={3}>
                  <FormRow>
                    <Card tone="caution" padding={3}>
                      <Text size={1}>Row body without a gutter cell</Text>
                    </Card>
                  </FormRow>
                </Box>
                <Box marginTop={3}>
                  <FormCell $area="body">
                    <Card tone="transparent" border padding={3}>
                      <Text size={1}>Stand-alone body cell</Text>
                    </Card>
                  </FormCell>
                </Box>
              </FormContainer>
            </Card>
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
