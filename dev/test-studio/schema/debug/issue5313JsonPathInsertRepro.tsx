/**
 * Reproduction schema for https://github.com/sanity-io/sanity/issues/5313
 *
 * Studio JSONPath incorrectly parses incoming insert patches that use a filter
 * with a dotted lhs, e.g. `array[asset._ref == "some_id"]`, and crashes with
 * "Expected ]" while the mutation succeeds on the server.
 *
 * Manual repro:
 * 1. Structure → Inputs → Debug → JSONPath insert repro (#5313).
 * 2. Create/open a document and add at least one row in "Array" with a Book in "Asset".
 * 3. Keep the document open and click "Apply insert/replace patch (issue #5313)".
 * 4. Expected (bug): Studio throws "Expected ]" when the incoming patch arrives.
 * 5. Navigate away and back to the same document — same error until a full reload.
 */
import {Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {useCallback, useState} from 'react'
import {
  defineArrayMember,
  defineField,
  defineType,
  getDraftId,
  type ObjectInputProps,
  useClient,
  useFormValue,
} from 'sanity'

type ArrayItem = {
  _key?: string
  asset?: {_ref?: string}
  label?: string
}

function Issue5313ReproControls(props: ObjectInputProps) {
  const client = useClient({apiVersion: '2025-10-01'})
  const documentId = useFormValue(['_id']) as string | undefined
  const arrayValue = useFormValue(['array']) as ArrayItem[] | undefined
  const targetRef = arrayValue?.find((item) => item?.asset?._ref)?.asset?._ref

  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleApplyPatch = useCallback(async () => {
    if (!documentId) {
      setError('Document id is missing')
      setStatus('error')
      return
    }
    if (!targetRef) {
      setError('Add an array item with a Book reference in Asset first')
      setStatus('error')
      return
    }

    const jsonPath = `array[asset._ref == "${targetRef}"]`

    setStatus('loading')
    setError(null)

    try {
      await client.mutate([
        {
          patch: {
            id: getDraftId(documentId),
            insert: {
              replace: jsonPath,
              items: [
                {
                  _key: `issue5313-replace-${Date.now()}`,
                  asset: {_type: 'reference', _ref: targetRef},
                  label: 'Replaced by issue #5313 repro patch',
                },
              ],
            },
          },
        },
      ])
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : String(err))
    }
  }, [client, documentId, targetRef])

  return (
    <Stack space={3}>
      <Card padding={3} tone="caution" border>
        <Stack space={3}>
          <Text size={1}>
            Commits the same patch shape reported in issue #5313 while this document stays open.
            The API accepts it; Studio may crash when applying the incoming patch.
          </Text>
          <Text size={1} muted>
            JSONPath: {targetRef ? `array[asset._ref == "${targetRef}"]` : 'array[asset._ref == …]'}
          </Text>
          <Flex>
            <Button
              text="Apply insert/replace patch (issue #5313)"
              tone="primary"
              disabled={!targetRef || status === 'loading'}
              loading={status === 'loading'}
              onClick={() => void handleApplyPatch()}
            />
          </Flex>
          {error ? (
            <Text size={1} tone="critical">
              {error}
            </Text>
          ) : null}
          {status === 'done' ? (
            <Text size={1} tone="positive">
              Patch committed. If the bug reproduces, Studio may already have crashed on the
              incoming patch.
            </Text>
          ) : null}
        </Stack>
      </Card>
      {props.renderDefault(props)}
    </Stack>
  )
}

export const issue5313JsonPathInsertRepro = defineType({
  name: 'issue5313JsonPathInsertRepro',
  type: 'document',
  title: 'JSONPath insert repro (#5313)',
  description:
    'Reproduction for issue #5313: insert replace patches with dotted filter paths crash Studio.',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      initialValue: 'Issue #5313 — JSONPath insert repro',
    }),
    defineField({
      name: 'notes',
      type: 'text',
      title: 'How to reproduce',
      readOnly: true,
      rows: 8,
      initialValue: [
        '1. Add at least one item to Array with a Book in Asset.',
        '2. Click "Apply insert/replace patch (issue #5313)" while this document is open.',
        '3. Bug: Studio error "Expected ]" on incoming patch (server update still applies).',
        '4. Leave and re-open the document — same error until a full browser reload.',
      ].join('\n'),
    }),
    defineField({
      name: 'reproControls',
      title: 'Repro controls',
      type: 'object',
      fields: [
        defineField({
          name: 'hint',
          type: 'string',
          readOnly: true,
          initialValue: 'Use the button above the empty object fields.',
        }),
      ],
      components: {
        input: Issue5313ReproControls,
      },
    }),
    defineField({
      name: 'array',
      title: 'Array',
      description:
        'Items use an `asset` reference so the patch path matches issue #5313: array[asset._ref == "…"].',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'arrayItem',
          title: 'Array item',
          fields: [
            defineField({
              name: 'asset',
              title: 'Asset',
              type: 'reference',
              to: [{type: 'book'}],
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
            }),
          ],
          preview: {
            select: {title: 'label', subtitle: 'asset._ref'},
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {title: 'title'},
    prepare({title}) {
      return {
        title: title || 'JSONPath insert repro (#5313)',
        subtitle: 'insert.replace with array[asset._ref == "…"]',
      }
    },
  },
})
