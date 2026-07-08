/**
 * Reproduction attempt at schema for SAPP-3980.
 *
 * A custom "Create new" action rendered as a *sibling* of a reference input inside an
 * array-of-references item is defeated by `ReferenceInput`'s outside-click handling:
 * the document-level `mousedown` listener classifies the sibling button as "outside" and
 * clears the empty reference *before* the button's `onClick` runs. The array item is
 * removed and the new-document pane never opens.
 *
 * Manual repro:
 * 1. Structure → Debug → "SAPP-3980 repro" → create a document.
 * 2. Click **Add item** on the "Sections" array (an empty reference item appears, and the
 *    reference autocomplete is auto-focused).
 * 3. WITHOUT clicking anywhere else first, click the red **Create new (repro)** button.
 *
 * Expected: the item is patched with a deterministic `_ref` and the new-document pane opens.
 * Actual (bug): the empty array item is removed and no pane opens. The button's `onClick`
 * does fire (see console log), but the item it targeted is already gone.
 *
 * Workaround toggle: uncomment `onMouseDown` on the button below — intercepting the native
 * mousedown prevents the outside-click listener from clearing the item, and the flow works.
 */
import {Button, Card, Stack, Text} from '@sanity/ui'
import {useCallback} from 'react'
import {
  defineArrayMember,
  defineField,
  defineType,
  type ObjectInputProps,
  type Reference,
  type ReferenceSchemaType,
  set,
  setIfMissing,
  useFormValue,
} from 'sanity'
import {usePaneRouter} from 'sanity/structure'

type ReferenceInputProps = ObjectInputProps<Reference, ReferenceSchemaType>

function CustomCreateNewReferenceInput(props: ReferenceInputProps) {
  const {onChange, onPathFocus, path, schemaType} = props
  const paneRouter = usePaneRouter()
  const documentId = useFormValue(['_id']) as string | undefined

  const handleCreate = useCallback(() => {
    const newId = `sapp3980-section-${Date.now()}`
    console.log('[SAPP-3980 repro] Create new clicked, patching', path, '→', newId)

    onChange([
      setIfMissing({}),
      set(schemaType.name, ['_type']),
      set(newId, ['_ref']),
      set(true, ['_weak']),
      set({type: 'author', weak: schemaType.weak}, ['_strengthenOnPublish']),
    ])

    paneRouter.handleEditReference({
      id: newId,
      type: 'author',
      template: {id: 'author'},
      parentRefPath: path,
    })
    onPathFocus([])
  }, [onChange, onPathFocus, paneRouter, path, schemaType.name, schemaType.weak])

  return (
    <Stack space={2}>
      {props.renderDefault(props)}
      <Button
        data-testid="sapp3980-create-new"
        text="Create new (repro)"
        tone="critical"
        mode="ghost"
        onClick={handleCreate}
        // Workaround from the issue — uncomment to make the flow work:
        // onMouseDown={(event) => {
        //   event.preventDefault()
        //   event.stopPropagation()
        // }}
      />
      <Card padding={2} radius={2} tone="caution">
        <Text size={1} muted>
          Add an array item, then click “Create new (repro)” without focusing anything else. Bug:
          the empty item is removed on mousedown before the click handler runs.
          {documentId ? '' : ' (no document id yet)'}
        </Text>
      </Card>
    </Stack>
  )
}

export const sapp3980ReferenceCreateNewRepro = defineType({
  name: 'sapp3980ReferenceCreateNewRepro',
  title: 'SAPP-3980 repro',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({
      name: 'sections',
      title: 'Sections (array of references with custom create-new input)',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'sectionRef',
          type: 'reference',
          to: [{type: 'author'}],
          components: {
            input: CustomCreateNewReferenceInput,
          },
        }),
      ],
    }),
    defineField({
      name: 'topLevelSectionRef',
      title: 'Top-level reference (same custom input, less affected)',
      type: 'reference',
      to: [{type: 'author'}],
      components: {
        input: CustomCreateNewReferenceInput,
      },
    }),
  ],
})
