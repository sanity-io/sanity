import {EllipsisVerticalIcon, SelectIcon} from '@sanity/icons'
import {Box, Button, Card, Container, Stack, Tab, TabList, Text, Tooltip} from '@sanity/ui'
import {useBoolean, useSelect} from '@sanity/ui-workshop'
import React, {useMemo, useState} from 'react'
import {Pane} from '../Pane'
import {PaneContent} from '../PaneContent'
import {PaneFooter} from '../PaneFooter'
import {PaneHeader} from '../PaneHeader'
import {PaneLayout} from '../PaneLayout'

const PANE_TONE_OPTIONS = {
  Default: 'default',
  Primary: 'primary',
  Positive: 'positive',
  Caution: 'caution',
  Critical: 'critical',
} as const

export default function TabsStory() {
  const layoutCollapsed = useBoolean('Layout collapsed', false, 'Props')
  const manyTabs = useBoolean('Many tabs', false, 'Props')
  const tone = useSelect('Tone', PANE_TONE_OPTIONS, 'default', 'Props')

  const actions = useMemo(() => <Button icon={EllipsisVerticalIcon} mode="bleed" />, [])
  const tabs = useMemo(
    () =>
      manyTabs ? (
        <TabList space={1}>
          <Tab
            aria-controls="content-panel"
            fontSize={1}
            id="content-tab"
            label="Content"
            selected
          />
          <Tab aria-controls="preview-panel" fontSize={1} id="preview-tab" label="Preview" />
          <Tab aria-controls="preview-panel" fontSize={1} id="preview-tab" label="Preview" />
          <Tab aria-controls="preview-panel" fontSize={1} id="preview-tab" label="Preview" />
          <Tab aria-controls="preview-panel" fontSize={1} id="preview-tab" label="Preview" />
          <Tab aria-controls="preview-panel" fontSize={1} id="preview-tab" label="Preview" />
          <Tab aria-controls="preview-panel" fontSize={1} id="preview-tab" label="Preview" />
          <Tab aria-controls="preview-panel" fontSize={1} id="preview-tab" label="Preview" />
          <Tab aria-controls="preview-panel" fontSize={1} id="preview-tab" label="Preview" />
          <Tab aria-controls="preview-panel" fontSize={1} id="preview-tab" label="Preview" />
        </TabList>
      ) : (
        <TabList space={1}>
          <Tab
            aria-controls="content-panel"
            fontSize={1}
            id="content-tab"
            label="Content"
            selected
          />
          <Tab aria-controls="preview-panel" fontSize={1} id="preview-tab" label="Preview" />
        </TabList>
      ),
    [manyTabs]
  )

  const [id, setId] = useState(['all'])

  const selectTabs = (e, name) => {
    if (name == 'all') {
      setId([name])
    } else {
      setId((currentId) => currentId.filter((tag) => tag !== 'all'))
    }

    if (id.includes(name)) {
      if (id.length === 1) {
        setId(['all'])
      } else {
        setId((currentId) => currentId.filter((tag) => tag !== name))
      }
    } else if (e.shiftKey) {
      setId((currentId) => [...currentId, name])
    } else {
      setId([name])
    }
  }

  const DocumentTab = ({name, label = name}) => {
    return (
      <Tooltip
        content={
          <Box padding={2}>
            <Text muted size={1}>
              Hold Shift to select multiple
            </Text>
          </Box>
        }
        fallbackPlacements={['right', 'left']}
        placement="top"
        portal
        hidden={id.includes('all') || id.includes(name) || name == 'all'}
      >
        <Tab
          aria-controls={`${name}-panel`}
          id={`${name}-tab`}
          label={label ? label : name}
          onClick={(e) => selectTabs(e, name)}
          selected={id.includes(name)}
        />
      </Tooltip>
    )
  }

  const TaggedElement = ({tag, children}) => {
    return (
      <Box hidden={!id.includes('all') && tag.filter((value) => id.includes(value)).length == 0}>
        {children}
      </Box>
    )
  }

  return (
    <PaneLayout height={layoutCollapsed ? undefined : 'fill'} style={{minHeight: '100%'}}>
      <Pane minWidth={320} tone={tone}>
        <PaneHeader
          actions={actions}
          subActions={
            <Button fontSize={1} iconRight={SelectIcon} mode="bleed" padding={2} text="Latest" />
          }
          tabs={tabs}
          title={<>Header</>}
        />
        <PaneContent overflow="auto">
          <Container paddingX={4} paddingY={[4, 4, 5]} sizing="border" width={1}>
            <Stack space={4}>
              <Card
                tone="default"
                borderBottom
                paddingY={2}
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 100,
                  boxShadow: '-3px 0 0 0 white',
                }}
              >
                <TabList space={2}>
                  <DocumentTab name="all" label="all fields" />
                  <DocumentTab name="apples" />
                  <DocumentTab name="oranges" />
                  <DocumentTab name="kitties" />
                  <DocumentTab name="puppies" />
                  <DocumentTab name="animals" />
                  <DocumentTab name="fruits" />
                </TabList>
              </Card>
              <TaggedElement tag={['apples', 'puppies', 'animals', 'fruits']}>
                <Text>Apples & puppies</Text>
              </TaggedElement>
              <TaggedElement tag={['oranges', 'kitties', 'animals', 'fruits']}>
                <Text>Oranges & kitties</Text>
              </TaggedElement>
              <TaggedElement tag={['apples', 'kitties', 'animals', 'fruits']}>
                <Text>Apples & kitties</Text>
              </TaggedElement>
              <TaggedElement tag={['oranges', 'puppies', 'animals', 'fruits']}>
                <Text>Oranges & puppies</Text>
              </TaggedElement>
              <TaggedElement tag={['apples', 'fruits']}>
                <Text>Apples</Text>
              </TaggedElement>
              <TaggedElement tag={['oranges', 'fruits']}>
                <Text>Oranges</Text>
              </TaggedElement>
              <TaggedElement tag={['kitties', 'animals']}>
                <Text>Kitties</Text>
              </TaggedElement>
              <TaggedElement tag={['puppies', 'animals']}>
                <Text>Puppies</Text>
              </TaggedElement>
              <TaggedElement tag={['puppies', 'kitties', 'animals']}>
                <Text>Puppies & kitties</Text>
              </TaggedElement>
              <TaggedElement tag={['oranges', 'apples', 'fruits']}>
                <Text>Oranges & apples</Text>
              </TaggedElement>
              <TaggedElement tag={['apples', 'puppies', 'animals', 'fruits']}>
                <Text>Apples & puppies</Text>
              </TaggedElement>
              <TaggedElement tag={['oranges', 'kitties', 'animals', 'fruits']}>
                <Text>Oranges & kitties</Text>
              </TaggedElement>
            </Stack>
          </Container>
        </PaneContent>
        <PaneFooter padding={4}>
          <Text muted>Footer</Text>
        </PaneFooter>
      </Pane>
    </PaneLayout>
  )
}
