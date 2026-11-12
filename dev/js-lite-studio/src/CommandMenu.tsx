/** The command menu (Cmd/Ctrl+K): jump to a document type or search documents of every type by
 * title, recently edited ones first. */
import {FolderIcon} from '@sanity/icons/Folder'
import {SearchIcon} from '@sanity/icons/Search'
import {Box, Card, Flex, Label, Portal, Spinner, Stack, Text, TextInput} from '@sanity/ui'
import {
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react'

import {commandOpen, schemaVersion} from './app-state'
import {errorMessage} from './client'
import {PreviewContent} from './DocumentList'
import {type DocPreview} from './preview-data'
import {search} from './previews'
import {navigate, type Route, routeHref} from './router'
import {schema, titleOf} from './schema'
import {useAtom} from './state'

type Item = {type: 'type'; name: string; title: string} | {type: 'document'; doc: DocPreview}

function itemRoute(item: Item): Route {
  return item.type === 'type'
    ? {typeName: item.name}
    : {typeName: item.doc.typeName, documentId: item.doc.id}
}

type Documents =
  | {type: 'loading'}
  | {type: 'failed'; error: string}
  | {type: 'ready'; docs: DocPreview[]}

/** Searches every document type for `value`, debounced while typing; only the newest search of
 * `generation` updates the results. */
function runSearch(
  value: string,
  generation: RefObject<number>,
  setActive: (index: number) => void,
  setDocuments: (documents: Documents) => void,
): void {
  const current = ++generation.current
  void (async () => {
    if (value.trim()) await new Promise((resolve) => setTimeout(resolve, 150))
    if (generation.current !== current) return
    const all = schema().documentTypes.map((def) => def.name)
    try {
      const docs = await search(all, value, 20)
      if (generation.current !== current) return
      setActive(0)
      setDocuments({type: 'ready', docs})
    } catch (error) {
      if (generation.current === current) setDocuments({type: 'failed', error: errorMessage(error)})
    }
  })()
}

export function CommandMenu() {
  useAtom(schemaVersion)
  const [text, setText] = useState('')
  const [documents, setDocuments] = useState<Documents>({type: 'loading'})
  const [active, setActive] = useState(0)
  const generation = useRef(0)

  const query = text.trim().toLowerCase()
  const types: Item[] = query
    ? schema()
        .documentTypes.map((def) => ({type: 'type' as const, name: def.name, title: titleOf(def)}))
        .filter(
          (item) =>
            item.title.toLowerCase().includes(query) || item.name.toLowerCase().includes(query),
        )
        .slice(0, 5)
    : []
  const items: Item[] = [
    ...types,
    ...(documents.type === 'ready'
      ? documents.docs.map((doc) => ({type: 'document' as const, doc}))
      : []),
  ]

  const run = (value: string) => runSearch(value, generation, setActive, setDocuments)

  useEffect(() => {
    runSearch('', generation, setActive, setDocuments)
  }, [])

  const close = () => commandOpen.set(false)
  const openItem = (item: Item) => {
    close()
    navigate(itemRoute(item))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const count = items.length
    switch (event.key) {
      case 'ArrowDown':
        if (count === 0) return
        event.preventDefault()
        setActive((index) => (index + 1) % count)
        break
      case 'ArrowUp':
        if (count === 0) return
        event.preventDefault()
        setActive((index) => (index + count - 1) % count)
        break
      case 'Enter': {
        event.preventDefault()
        const item = items[active]
        if (item) openItem(item)
        break
      }
      case 'Escape':
        event.preventDefault()
        close()
        break
      default:
    }
  }

  useEffect(() => {
    document.querySelector(`[data-command-item="${active}"]`)?.scrollIntoView({block: 'nearest'})
  }, [active])

  const searching = query.length > 0
  const rows: ReactNode[] = []
  let documentHeader = false
  items.forEach((item, index) => {
    if (index === 0 && item.type === 'type') {
      rows.push(
        <Box key="types" paddingX={2} paddingY={2}>
          <Label size={1} muted>
            Document types
          </Label>
        </Box>,
      )
    }
    if (item.type === 'document' && !documentHeader) {
      documentHeader = true
      rows.push(
        <Box key="documents" paddingX={2} paddingY={2}>
          <Label size={1} muted>
            {searching ? 'Documents' : 'Recently edited'}
          </Label>
        </Box>,
      )
    }
    const target = itemRoute(item)
    rows.push(
      <div
        key={item.type === 'type' ? `type:${item.name}` : `doc:${item.doc.id}`}
        data-command-item={index}
        onMouseMove={() => {
          if (active !== index) setActive(index)
        }}
      >
        <Card
          as="a"
          href={routeHref(target)}
          radius={2}
          padding={2}
          selected={active === index}
          onClick={(event) => {
            event.preventDefault()
            openItem(item)
          }}
        >
          {item.type === 'type' ? (
            <Flex align="center" gap={2} padding={1}>
              <Text size={1}>
                <FolderIcon />
              </Text>
              <Text size={1} weight="medium">
                {item.title}
              </Text>
            </Flex>
          ) : (
            <PreviewContent preview={item.doc} />
          )}
        </Card>
      </div>,
    )
  })
  if (documents.type === 'loading') {
    rows.push(
      <Flex key="loading" justify="center" padding={4}>
        <Spinner muted />
      </Flex>,
    )
  } else if (documents.type === 'failed') {
    rows.push(
      <Box key="failed" padding={3}>
        <Text size={1} muted>{`Search failed: ${documents.error}`}</Text>
      </Box>,
    )
  } else if (documents.docs.length === 0) {
    rows.push(
      <Box key="empty" padding={3}>
        <Text size={1} muted align="center">
          No matching documents
        </Text>
      </Box>,
    )
  }

  return (
    <Portal>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 600,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '12vh 1rem 1rem',
          backgroundColor: 'var(--card-backdrop-color, rgba(0, 0, 0, 0.3))',
        }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) close()
        }}
      >
        <Card
          radius={3}
          shadow={4}
          style={{
            width: '100%',
            maxWidth: 640,
            maxHeight: '70vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <Box padding={2} style={{flex: 'none'}}>
            <TextInput
              value={text}
              onChange={(event) => {
                const value = event.currentTarget.value
                setText(value)
                setActive(0)
                setDocuments({type: 'loading'})
                run(value)
              }}
              onKeyDown={onKeyDown}
              placeholder="Search documents and types"
              icon={SearchIcon}
              border={false}
              autoFocus
            />
          </Box>
          <Card borderTop flex={1} overflow="auto" padding={1} style={{minHeight: 0}}>
            <Stack gap={1}>{rows}</Stack>
          </Card>
          <Card borderTop paddingX={3} paddingY={2} tone="transparent" style={{flex: 'none'}}>
            <Flex gap={3} align="center">
              <Text size={0} muted>
                ↑↓ to navigate
              </Text>
              <Text size={0} muted>
                ↵ to open
              </Text>
              <Text size={0} muted>
                esc to close
              </Text>
            </Flex>
          </Card>
        </Card>
      </div>
    </Portal>
  )
}
