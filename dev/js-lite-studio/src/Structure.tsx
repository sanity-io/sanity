/** The structure tool: the type list, the document list of the selected type and the open
 * document, side by side like the JS studio's panes. */
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {DocumentIcon} from '@sanity/icons/Document'
import {SearchIcon} from '@sanity/icons/Search'
import {Box, Card, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {useState} from 'react'

import {schemaVersion} from './app-state'
import {DocumentListPane} from './DocumentList'
import {DocumentPane} from './DocumentPane'
import {linkClick, route, routeHref} from './router'
import {schema, titleOf} from './schema'
import {useAtom} from './state'

function TypeListPane() {
  useAtom(schemaVersion)
  const current = useAtom(route)
  const [filter, setFilter] = useState('')
  const query = filter.toLowerCase()
  const types = schema()
    .documentTypes.map((def) => [def.name, titleOf(def)] as const)
    .filter(
      ([name, title]) =>
        !query || title.toLowerCase().includes(query) || name.toLowerCase().includes(query),
    )
  return (
    <Flex direction="column" height="fill">
      <Box padding={2} style={{flex: 'none'}}>
        <Box padding={2}>
          <Text size={1} weight="semibold">
            Content
          </Text>
        </Box>
        <Box paddingY={1}>
          <TextInput
            value={filter}
            onChange={(event) => setFilter(event.currentTarget.value)}
            placeholder="Filter types"
            icon={SearchIcon}
            fontSize={1}
          />
        </Box>
      </Box>
      <Box flex={1} overflow="auto" paddingX={2} style={{minHeight: 0}}>
        <Stack gap={1} paddingBottom={2}>
          {types.map(([name, title]) => {
            const target = {typeName: name}
            return (
              <Card
                key={name}
                as="a"
                href={routeHref(target)}
                radius={2}
                padding={2}
                selected={current.typeName === name}
                onClick={linkClick(target)}
              >
                <Flex align="center" gap={2}>
                  <Text size={1}>
                    <DocumentIcon />
                  </Text>
                  <Box flex={1}>
                    <Text size={1} weight="medium" textOverflow="ellipsis">
                      {title}
                    </Text>
                  </Box>
                  <Text size={1} muted>
                    <ChevronRightIcon />
                  </Text>
                </Flex>
              </Card>
            )
          })}
        </Stack>
      </Box>
    </Flex>
  )
}

export function Structure() {
  useAtom(schemaVersion)
  const current = useAtom(route)
  const typeName = current.typeName && schema().get(current.typeName) ? current.typeName : undefined
  return (
    <Flex height="fill" style={{minWidth: 0}}>
      <Card borderRight style={{width: '18rem', flex: 'none', minWidth: 0}}>
        <TypeListPane />
      </Card>
      {typeName ? (
        <Card borderRight style={{width: '22rem', flex: 'none', minWidth: 0}}>
          <DocumentListPane key={typeName} typeName={typeName} />
        </Card>
      ) : null}
      <Box flex={1} style={{minWidth: 0}}>
        {current.typeName && current.documentId ? (
          <DocumentPane
            key={`${current.typeName};${current.documentId}`}
            typeName={current.typeName}
            id={current.documentId}
          />
        ) : (
          <Flex align="center" justify="center" height="fill" padding={4}>
            <Stack gap={3}>
              <Text align="center" muted>
                <DocumentIcon />
              </Text>
              <Text size={1} muted align="center">
                {current.typeName ? 'Select a document to edit it' : 'Select a document type'}
              </Text>
            </Stack>
          </Flex>
        )}
      </Box>
    </Flex>
  )
}
