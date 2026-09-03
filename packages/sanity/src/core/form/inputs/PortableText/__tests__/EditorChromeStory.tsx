import {EditorProvider, type HotkeyOptions} from '@portabletext/editor'
import {sanitySchemaToPortableTextSchema} from '@portabletext/sanity-bridge'
import {
  type ArraySchemaType,
  defineArrayMember,
  defineField,
  defineType,
  type ObjectSchemaType,
  type PortableTextBlock,
} from '@sanity/types'
import {Card, PortalProvider, Stack, Text, TextInput, usePortal} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {useMemo, useState} from 'react'

import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {useSchema} from '../../../../hooks/useSchema'
import {PortableTextMemberSchemaTypesProvider} from '../contexts/PortableTextMemberSchemaTypes'
import {ToolbarCard} from '../Editor.styles'
import {PopoverEditDialog} from '../object/modals/PopoverModal'
import {Toolbar} from '../toolbar/Toolbar'

const SCHEMA_TYPES = [
  defineType({
    type: 'document',
    name: 'test',
    title: 'Test',
    fields: [
      defineField({
        type: 'array',
        name: 'body',
        title: 'Body',
        of: [
          defineArrayMember({
            type: 'block',
            of: [
              defineArrayMember({
                type: 'object',
                name: 'inlineNote',
                title: 'Inline note',
                fields: [defineField({type: 'string', name: 'text', title: 'Text'})],
              }),
            ],
          }),
          defineArrayMember({type: 'image', name: 'image', title: 'Image'}),
        ],
      }),
    ],
  }),
]

const NO_HOTKEYS: HotkeyOptions = {}

function Toolbars({schemaType}: {schemaType: ArraySchemaType<PortableTextBlock>}) {
  const initialConfig = useMemo(
    () => ({schemaDefinition: sanitySchemaToPortableTextSchema(schemaType)}),
    [schemaType],
  )

  return (
    <PortableTextMemberSchemaTypesProvider schemaType={schemaType}>
      <EditorProvider initialConfig={initialConfig}>
        <Stack gap={5}>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              toolbar (wide)
            </Text>
            <Card border radius={1}>
              <ToolbarCard shadow={1}>
                <Toolbar
                  collapsible
                  hotkeys={NO_HOTKEYS}
                  isFullscreen={false}
                  onMemberOpen={noop}
                  onToggleFullscreen={noop}
                />
              </ToolbarCard>
            </Card>
          </Stack>
          <Stack gap={2}>
            <Text muted size={1} weight="medium">
              toolbar collapsed below 400px
            </Text>
            <div style={{maxWidth: 360}}>
              <Card border radius={1}>
                <ToolbarCard shadow={1}>
                  <Toolbar
                    collapsible
                    hotkeys={NO_HOTKEYS}
                    isFullscreen={false}
                    onMemberOpen={noop}
                    onToggleFullscreen={noop}
                  />
                </ToolbarCard>
              </Card>
            </div>
          </Stack>
        </Stack>
      </EditorProvider>
    </PortableTextMemberSchemaTypesProvider>
  )
}

function PopoverModal() {
  const [boundaryElement, setBoundaryElement] = useState<HTMLDivElement | null>(null)
  const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null)
  // The dialog targets the named `default` portal the editor's Compositor registers.
  const portal = usePortal()
  const portalElements = useMemo(() => ({default: portal.element}), [portal.element])

  return (
    <PortalProvider __unstable_elements={portalElements} element={portal.element}>
      <div ref={setBoundaryElement} style={{minHeight: 320, position: 'relative'}}>
        <Card border padding={3} radius={2} ref={setReferenceElement} style={{maxWidth: 240}}>
          <Text size={1}>Image block</Text>
        </Card>
        {referenceElement && (
          <PopoverEditDialog
            floatingBoundary={boundaryElement}
            onClose={noop}
            referenceBoundary={boundaryElement}
            referenceElement={referenceElement}
            title="Edit Image"
          >
            <Stack gap={4}>
              <Stack gap={2}>
                <Text size={1} weight="medium">
                  Alternative text
                </Text>
                <TextInput defaultValue="A mountain lake at dawn" />
              </Stack>
              <Stack gap={2}>
                <Text size={1} weight="medium">
                  Caption
                </Text>
                <TextInput defaultValue="" />
              </Stack>
            </Stack>
          </PopoverEditDialog>
        )}
      </div>
    </PortalProvider>
  )
}

function EditorChrome() {
  const schema = useSchema()
  const documentType = schema.get('test') as ObjectSchemaType
  const schemaType = documentType.fields[0].type as ArraySchemaType<PortableTextBlock>

  return (
    <Card padding={4} style={{maxWidth: 640}}>
      <Stack gap={5}>
        <Toolbars schemaType={schemaType} />
        <Stack gap={2}>
          <Text muted size={1} weight="medium">
            popover edit dialog
          </Text>
          <PopoverModal />
        </Stack>
      </Stack>
    </Card>
  )
}

/**
 * Chromatic sentinel for Portable Text editor chrome after the ui5 Flex
 * migration, rendered without the form builder. The toolbar mounts inside a
 * bare `EditorProvider` with no editable, so it shows its blurred (disabled)
 * state: once at full width and once in a 360px column where `collapsible`
 * gives the block style select the remaining width and folds the action and
 * insert menus. The popover edit dialog is a full-height flex column whose
 * header pins the title next to the close button above the scrolling body.
 */
export function EditorChromeStory() {
  return (
    <TestWrapper schemaTypes={SCHEMA_TYPES}>
      <EditorChrome />
    </TestWrapper>
  )
}
