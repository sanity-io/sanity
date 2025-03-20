import {
  type EditorChange,
  type EditorSelection,
  PortableTextEditable,
  PortableTextEditor,
  type RenderBlockFunction,
} from '@portabletext/editor'
import {Schema} from '@sanity/schema'
import {defineArrayMember, defineField, type PortableTextBlock} from '@sanity/types'
import {Card, Container, Flex, Stack, Text} from '@sanity/ui'
import {useCallback, useMemo, useRef, useState} from 'react'
import {css, styled} from 'styled-components'

import {type FormNodePresence} from '../../../../presence/types'
import {PresenceProvider} from '../../../studio/contexts/Presence'
import {usePresenceCursorDecorations} from '../presence-cursors/usePresenceCursorDecorations'

const renderBlock: RenderBlockFunction = (p) => (
  <div style={{paddingBottom: '1em'}}>
    <Text>{p.children}</Text>
  </div>
)

const EditorCard = styled(Card)(({theme}) => {
  const color = theme.sanity.v2?.color.focusRing

  return css`
    min-height: 150px;

    &:focus-within {
      border: 1px solid ${color};
    }
  `
})

const INLINE_STYLE: React.CSSProperties = {outline: 'none'}

const INITIAL_VALUE: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: 'd2d43dfa67d0',
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: '997e2b7c72ba',
        text: 'This story is used to debug presence cursors.',
        marks: [],
      },
    ],
  },
]

const USER_1: FormNodePresence = {
  lastActiveAt: new Date().toISOString(),
  path: ['body', 'text'],
  sessionId: 'id-1',
  user: {
    id: 'user-1',
    displayName: 'User A',
  },
}

const USER_2: FormNodePresence = {
  lastActiveAt: new Date().toISOString(),
  path: ['body', 'text'],
  sessionId: 'id-2',
  user: {
    id: 'user-2',
    displayName: 'User B',
  },
}

const INITIAL_PRESENCE: FormNodePresence[] = [USER_1, USER_2]

const blockType = defineField({
  type: 'block',
  name: 'block',
  styles: [{title: 'Normal', value: 'normal'}],
})

const portableTextType = defineArrayMember({
  type: 'array',
  name: 'body',
  of: [blockType],
})

const schema = Schema.compile({
  name: 'body',
  types: [portableTextType],
})

export default function PresenceInputStory() {
  const [value, setValue] = useState<PortableTextBlock[]>(INITIAL_VALUE)
  const [presence, setPresence] = useState<FormNodePresence[]>(INITIAL_PRESENCE)

  const handleSelectionChange = useCallback(
    (nextSelection: EditorSelection, userId: 'user-1' | 'user-2') => {
      setPresence((current) => {
        return current.map((p) => {
          if (p.user.id === userId) {
            return {
              ...p,
              selection: nextSelection,
            }
          }

          return p
        })
      })
    },
    [],
  )

  const presenceA = useMemo(() => presence.filter((v) => v.user.id !== 'user-1'), [presence])
  const presenceB = useMemo(() => presence.filter((v) => v.user.id !== 'user-2'), [presence])

  return (
    <Flex align="center" height="fill" gap={0}>
      <Container padding={4} sizing="border" width={1}>
        {/* User A editor */}
        <Stack space={3}>
          <Text size={1} weight="semibold">
            User A
          </Text>

          <PresenceProvider presence={presenceA}>
            <Input
              onChange={setValue}
              // eslint-disable-next-line react/jsx-no-bind
              onSelectionChange={(v) => handleSelectionChange(v, 'user-1')}
              value={value}
            />
          </PresenceProvider>
        </Stack>
      </Container>

      <Card borderLeft height="fill" />

      {/* User B editor */}
      <Container padding={4} sizing="border" width={1}>
        <Stack space={3}>
          <Text size={1} weight="semibold">
            User B
          </Text>

          <PresenceProvider presence={presenceB}>
            <Input
              onChange={setValue}
              // eslint-disable-next-line react/jsx-no-bind
              onSelectionChange={(v) => handleSelectionChange(v, 'user-2')}
              value={value}
            />
          </PresenceProvider>
        </Stack>
      </Container>
    </Flex>
  )
}

interface InputProps {
  onChange: (value: PortableTextBlock[]) => void
  onSelectionChange: (presence: EditorSelection) => void
  value: PortableTextBlock[]
}

function Input(props: InputProps) {
  const {onChange, onSelectionChange, value} = props
  const editorRef = useRef<PortableTextEditor | null>(null)

  const decorations = usePresenceCursorDecorations({
    path: ['body'],
  })

  const handleChange = useCallback(
    (e: EditorChange) => {
      if (e.type === 'patch' && editorRef.current) {
        const nextValue = PortableTextEditor.getValue(editorRef.current)

        onChange(nextValue || [])
      }

      if (e.type === 'selection') {
        onSelectionChange(e.selection)
      }
    },
    [onChange, onSelectionChange],
  )

  return (
    <EditorCard border padding={4} sizing="border">
      <PortableTextEditor
        onChange={handleChange}
        ref={editorRef}
        schemaType={schema.get('body')}
        value={value}
      >
        <PortableTextEditable
          rangeDecorations={decorations}
          renderBlock={renderBlock}
          spellCheck={false}
          style={INLINE_STYLE}
          tabIndex={0}
        />
      </PortableTextEditor>
    </EditorCard>
  )
}
