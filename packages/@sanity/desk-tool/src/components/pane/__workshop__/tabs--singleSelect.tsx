import {DocumentIcon, EllipsisVerticalIcon, ImageIcon, LinkIcon, SelectIcon} from '@sanity/icons'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  Flex,
  Inline,
  Stack,
  Tab,
  TabList,
  Text,
  TextArea,
  TextInput,
} from '@sanity/ui'
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

  const [id, setId] = useState('all')

  const DocumentTab = ({name, label = name, icon = null}) => {
    return (
      <Box marginBottom={[2, 0]} marginRight={[0, 2]} style={{display: 'flex'}}>
        <Tab
          padding={[3, 2]}
          aria-controls={`${name}-panel`}
          id={`${name}-tab`}
          label={label ? label : name}
          onClick={() => setId(name)}
          selected={id === name}
          fontSize={1}
          icon={icon}
          style={{width: '100%'}}
        />
      </Box>
    )
  }

  const TaggedElement = ({tag, children}) => {
    return <Box hidden={id !== 'all' && !tag.includes(id)}>{children}</Box>
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
              <Card tone="default" marginBottom={[0, 4]}>
                <Flex direction={['column', 'row']}>
                  <DocumentTab name="all" label="All fields" />
                  <Card borderRight={[false, true]} marginRight={2} />
                  <DocumentTab name="editorial" label="Editorial" icon={DocumentIcon} />
                  <DocumentTab name="seo" label="SEO" icon={LinkIcon} />
                  <DocumentTab name="images" label="Images" icon={ImageIcon} />
                </Flex>
              </Card>
              <TaggedElement tag={['editorial']}>
                <Text size={1} weight="semibold">
                  Title
                </Text>
                <Box marginY={2}>
                  <TextInput fontSize={[2, 2, 3, 4]} padding={3} />
                </Box>
              </TaggedElement>
              <TaggedElement tag={['seo']}>
                <Text size={1} weight="semibold">
                  SEO title
                </Text>
                <Box marginY={2}>
                  <TextInput fontSize={[2, 2, 3, 4]} padding={3} />
                </Box>
              </TaggedElement>
              <TaggedElement tag={[]}>
                <Text size={1} weight="semibold">
                  Slug
                </Text>
                <Box marginY={2}>
                  <Flex>
                    <Box style={{flexGrow: 1}} marginRight={2}>
                      <TextInput fontSize={[2, 2, 3, 4]} padding={3} />
                    </Box>
                    <Button mode="ghost" text="Generate" />
                  </Flex>
                </Box>
              </TaggedElement>
              <TaggedElement tag={['editorial']}>
                <Text size={1} weight="semibold">
                  Body
                </Text>
                <Box marginY={2}>
                  <TextArea fontSize={[2, 2, 3, 4]} padding={3} style={{height: 300}} />
                </Box>
              </TaggedElement>
              <TaggedElement tag={['seo', 'editorial']}>
                <Stack space={2}>
                  <Text size={1} weight="semibold">
                    Blurb
                  </Text>
                  <Text size={1} muted>
                    Used also for SEO description
                  </Text>
                </Stack>
                <Box marginY={2}>
                  <TextArea fontSize={[2, 2, 3, 4]} padding={3} style={{height: 150}} />
                </Box>
              </TaggedElement>
              <TaggedElement tag={['seo']}>
                <Text size={1} weight="semibold">
                  Keywords
                </Text>
                <Box marginY={2}>
                  <TextInput fontSize={[2, 2, 3, 4]} padding={3} />
                </Box>
              </TaggedElement>
              <TaggedElement tag={[]}>
                <Text size={1} weight="semibold">
                  Categories
                </Text>
                <Stack marginY={3} space={2}>
                  <Flex align="center">
                    <Checkbox id="checkbox" style={{display: 'block'}} />
                    <Box flex={1} paddingLeft={3}>
                      <Text>
                        <label htmlFor="checkbox">Product</label>
                      </Text>
                    </Box>
                  </Flex>
                  <Flex align="center">
                    <Checkbox id="checkbox" style={{display: 'block'}} />
                    <Box flex={1} paddingLeft={3}>
                      <Text>
                        <label htmlFor="checkbox">Comminity</label>
                      </Text>
                    </Box>
                  </Flex>
                  <Flex align="center">
                    <Checkbox id="checkbox" style={{display: 'block'}} />
                    <Box flex={1} paddingLeft={3}>
                      <Text>
                        <label htmlFor="checkbox">Guide</label>
                      </Text>
                    </Box>
                  </Flex>
                  <Flex align="center">
                    <Checkbox id="checkbox" style={{display: 'block'}} />
                    <Box flex={1} paddingLeft={3}>
                      <Text>
                        <label htmlFor="checkbox">Company</label>
                      </Text>
                    </Box>
                  </Flex>
                </Stack>
              </TaggedElement>
              <TaggedElement tag={['images']}>
                <Text size={1} weight="semibold">
                  Main image
                </Text>
                <Stack marginY={2}>
                  <Card
                    tone="default"
                    padding={8}
                    border
                    style={{background: 'rgb(241, 243, 246)'}}
                  >
                    <Text style={{textAlign: 'center'}} weight="semibold">
                      Drop or paste image
                    </Text>
                  </Card>
                  <Flex marginY={2}>
                    <Box style={{flexGrow: 1}} marginRight={2}>
                      <Button text="Upload" style={{width: '100%'}} mode="ghost" />
                    </Box>
                    <Box style={{flexGrow: 1}}>
                      <Button text="Select" style={{width: '100%'}} mode="ghost" />
                    </Box>
                  </Flex>
                </Stack>
              </TaggedElement>
              <TaggedElement tag={['images', 'seo']}>
                <Text size={1} weight="semibold">
                  SEO image
                </Text>
                <Stack marginY={2}>
                  <Card
                    tone="default"
                    padding={8}
                    border
                    style={{background: 'rgb(241, 243, 246)'}}
                  >
                    <Text style={{textAlign: 'center'}} weight="semibold">
                      Drop or paste image
                    </Text>
                  </Card>
                  <Flex marginY={2}>
                    <Box style={{flexGrow: 1}} marginRight={2}>
                      <Button text="Upload" style={{width: '100%'}} mode="ghost" />
                    </Box>
                    <Box style={{flexGrow: 1}}>
                      <Button text="Select" style={{width: '100%'}} mode="ghost" />
                    </Box>
                  </Flex>
                </Stack>
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
