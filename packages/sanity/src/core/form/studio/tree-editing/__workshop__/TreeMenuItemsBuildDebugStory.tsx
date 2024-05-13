import {Box, Card, Code, Container, Flex} from '@sanity/ui'
import {useEffect, useState} from 'react'
import {type Path, useSchema} from 'sanity'

import {TreeEditingMenu} from '../components'
import {buildTreeMenuItems, EMPTY_TREE_STATE, type TreeEditingState} from '../utils'

const DOCUMENT_VALUE = {
  _createdAt: '2024-05-07T11:53:22Z',
  _id: 'drafts.a6af780b-d8c6-43cb-ade6-1e002e82214a',
  _rev: 'de0117b5-17da-4332-b258-5922e2af669e',
  _type: 'objectsDebug',
  _updatedAt: '2024-05-13T11:54:42Z',
  animals: [
    {
      _key: 'baec12778efa',
      _type: 'animal',
      friends: [
        {
          _key: '55ee65ba45d5',
          _type: 'friend',
          name: 'Beluga',
          properties: [
            {
              _key: '301913905660',
              _type: 'property',
              title: 'Some property',
            },
          ],
        },
        {
          _key: 'c4a3611c21ef',
          _type: 'friend',
          name: 'Whale with an E',
          properties: [
            {
              _key: '910c5fb4cb42',
              _type: 'property',
              title: 'Testing property',
            },
          ],
        },
      ],
      name: 'Albert',
    },
    {
      _key: 'd7ae42f63b10',
      _type: 'animal',
      friends: [
        {
          _key: '87e1f5e4c7a2',
          _type: 'friend',
          name: 'Penguin',
          properties: [
            {
              _key: '0d512c67ef12',
              _type: 'property',
              title: 'Ice lover',
            },
          ],
        },
      ],
      name: 'Olivia',
    },
    {
      _key: 'f9b8ed4eacd2',
      _type: 'animal',
      friends: [
        {
          _key: '76cde320123f',
          _type: 'friend',
          name: 'Giraffe',
          properties: [
            {
              _key: 'a123e4f56789',
              _type: 'property',
              title: 'Leaf cruncher',
            },
          ],
        },
      ],
      name: 'George',
    },
    {
      _key: '1a2b3c4d5e6f',
      _type: 'animal',
      friends: [
        {
          _key: '4f3e2d1c0b9a',
          _type: 'friend',
          name: 'Kangaroo',
          properties: [
            {
              _key: 'b0a1c9d8e7f6',
              _type: 'property',
              title: 'Jumping champion',
            },
          ],
        },
      ],
      name: 'Kylie',
    },
  ],
}

export default function TreeMenuItemsBuildDebugStory() {
  const schema = useSchema()
  const [items, setItems] = useState<TreeEditingState>(EMPTY_TREE_STATE)
  const [selectedPath, setSelectedPath] = useState<Path>([])

  useEffect(() => {
    const menuItems = buildTreeMenuItems({
      documentValue: DOCUMENT_VALUE,
      focusPath: ['animals'],
      schemaType: schema.get('objectsDebug') as any,
    })

    setItems(menuItems)
  }, [schema, selectedPath])

  return (
    <Flex height="fill" overflow="hidden">
      <Flex direction="column" flex={1} overflow="hidden">
        <Box>
          <Code size={1} language="json">
            {JSON.stringify(items?.relativePath) || 'No relative path'}
          </Code>
        </Box>
        <Card height="fill" flex={0.5} overflow="auto">
          <Container padding={4} width={0} sizing="border">
            <TreeEditingMenu
              items={items.menuItems}
              onPathSelect={setSelectedPath}
              selectedPath={selectedPath}
            />
          </Container>
        </Card>
      </Flex>

      <Flex direction="column" flex={2} overflow="hidden">
        <Card height="fill" flex={2} borderLeft overflow="auto" padding={3} sizing="border">
          <Code size={0} language="json">
            {JSON.stringify(DOCUMENT_VALUE.animals, null, 2)}
          </Code>
        </Card>
      </Flex>

      <Flex direction="column" flex={2} overflow="hidden">
        <Card height="fill" flex={2} borderLeft overflow="auto" padding={3} sizing="border">
          <Code size={0} language="json">
            {JSON.stringify(items.menuItems, null, 2)}
          </Code>
        </Card>
      </Flex>
    </Flex>
  )
}
