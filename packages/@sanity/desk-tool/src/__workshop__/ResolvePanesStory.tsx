import {DocumentNodeResolver, StructureBuilder, useStructureBuilder} from '@sanity/base/structure'
import {Box, Card, Code, Flex, Radio, Stack, Text} from '@sanity/ui'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {Subject} from 'rxjs'
import {LOADING_PANE} from '../constants'
import {useResolvedPanes} from '../structure/useResolvedPanes'
import {validateStructure} from '../structure/validateStructure'
import {RouterPanes, UnresolvedPaneNode} from '../types'

type StructureResolver = (structureBuilder: StructureBuilder) => UnresolvedPaneNode

const resolveStructure: StructureResolver | undefined = undefined // (S) => S.list().title('Content') as any

function MissingDocumentTypesMessage() {
  return <div>Missing document types</div>
}

const testPaths: RouterPanes[] = [
  [],

  // Opened the `Author` document type list
  [[{id: 'author'}]],

  // Opened the `Author` document type list
  // Opened the `foo` document editor
  [[{id: 'author'}], [{id: 'foo'}]],
]

export default function ResolvePanesStory() {
  const S = useStructureBuilder()

  const structure = useMemo(() => {
    let unresolvedStructureNode = null

    if (resolveStructure) {
      // @todo Find out why this typing is not working
      unresolvedStructureNode = resolveStructure(S)
    } else {
      unresolvedStructureNode = S.defaults()

      const paneItems = unresolvedStructureNode.getItems()

      if (paneItems?.length === 0) {
        unresolvedStructureNode = S.component({
          id: 'empty-list-pane',
          component: MissingDocumentTypesMessage,
        })
      }
    }

    return validateStructure(unresolvedStructureNode)
  }, [S])

  const resolveDocumentNode: DocumentNodeResolver = useCallback(
    (_, options) => S.defaultDocument(options),
    [S]
  )

  const routerPanesSubject = useMemo(() => new Subject<RouterPanes>(), [])
  const routerPanes$ = useMemo(() => routerPanesSubject.asObservable(), [routerPanesSubject])

  const {paneDataItems, resolvedPanes, routerPanes} = useResolvedPanes(
    S,
    structure as any,
    resolveDocumentNode,
    routerPanes$
  )

  const [testKey, setTestKey] = useState('0')

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.currentTarget.value

    setTestKey(inputValue)
  }, [])

  const currentTestPath = testPaths[Number(testKey)]

  useEffect(() => {
    routerPanesSubject.next(currentTestPath)
  }, [currentTestPath, routerPanesSubject])

  return (
    <Box padding={4}>
      <Stack marginBottom={5} space={3}>
        {testPaths.map((testPath, idx) => (
          <Flex align="center" as="label" key={idx}>
            <Radio
              checked={String(idx) === testKey}
              name="path"
              onChange={handleChange}
              value={String(idx)}
            />
            <Box flex={1} marginLeft={3}>
              <Text>
                <code>{JSON.stringify(testPath)}</code>
              </Text>
            </Box>
          </Flex>
        ))}
      </Stack>

      <Code language="json" size={1}>
        {JSON.stringify(routerPanes)}
      </Code>

      <Stack marginTop={5} space={1}>
        {resolvedPanes.map((resolvedPane, idx) => {
          const paneData = paneDataItems[idx]

          if (resolvedPane === LOADING_PANE) {
            return (
              <Card border key={idx} padding={4} tone={paneData.active ? 'primary' : undefined}>
                <Text>[Loading…]</Text>
              </Card>
            )
          }

          if (resolvedPane.type === 'list') {
            return (
              <Card border key={idx} padding={4} tone={paneData.active ? 'primary' : undefined}>
                <Stack space={3}>
                  <Text>[List] {resolvedPane.title}</Text>
                  <Text size={1}>
                    <code>{paneData.path}</code>
                  </Text>
                  <Code language="json" size={1}>{`${JSON.stringify(
                    resolvedPane.items?.length
                  )} items`}</Code>
                </Stack>
              </Card>
            )
          }

          if (resolvedPane.type === 'documentList') {
            return (
              <Card border key={idx} padding={4} tone={paneData.active ? 'primary' : undefined}>
                <Stack space={3}>
                  <Text>[DocumentList] {resolvedPane.title}</Text>
                  <Text size={1}>
                    <code>{paneData.path}</code>
                  </Text>
                  <Code language="json" size={1}>
                    {JSON.stringify(resolvedPane.options, null, 2)}
                  </Code>
                </Stack>
              </Card>
            )
          }

          if (resolvedPane.type === 'document') {
            return (
              <Card border key={idx} padding={4} tone={paneData.active ? 'primary' : undefined}>
                <Stack space={3}>
                  <Text>[Document]</Text>
                  <Text size={1}>
                    <code>{paneData.path}</code>
                  </Text>
                  <Code language="json" size={1}>
                    {JSON.stringify(resolvedPane.options, null, 2)}
                  </Code>
                </Stack>
              </Card>
            )
          }

          return (
            <Card border key={idx} padding={4} tone={paneData.active ? 'primary' : undefined}>
              <Text>
                [{resolvedPane.type}] {resolvedPane.title}
              </Text>
            </Card>
          )
        })}
      </Stack>
    </Box>
  )
}
