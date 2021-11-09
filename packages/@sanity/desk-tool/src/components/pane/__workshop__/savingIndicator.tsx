import {EllipsisVerticalIcon, PublishIcon, SelectIcon} from '@sanity/icons'
import {Box, Button, Container, Flex, Tab, TabList, Text, TextInput} from '@sanity/ui'
import React, {useMemo, useState} from 'react'
import {Pane} from '../Pane'
import {PaneContent} from '../PaneContent'
import {PaneFooter} from '../PaneFooter'
import {PaneHeader} from '../PaneHeader'
import {PaneLayout} from '../PaneLayout'
import {Root, Saving, Circle, Arrows, EditIcon, Checkmark} from './savingIndicator.styles'

export default function SavingIndicatorStory() {
  const actions = useMemo(() => <Button icon={EllipsisVerticalIcon} mode="bleed" />, [])
  const tabs = (
    <TabList space={1}>
      <Tab aria-controls="content-panel" fontSize={1} id="content-tab" label="Content" selected />
      <Tab aria-controls="preview-panel" fontSize={1} id="preview-tab" label="Preview" />
    </TabList>
  )

  const [documentState, setDocumentState] = useState('default')

  function editDocument() {
    setDocumentState('saving')
    setTimeout(() => {
      setDocumentState('saved')
    }, 2000)
    setTimeout(() => {
      setDocumentState('default')
    }, 5000)
  }

  return (
    <PaneLayout height="fill" style={{minHeight: '100%'}}>
      <Pane minWidth={320}>
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
            <TextInput onChange={editDocument} />
          </Container>
        </PaneContent>
        <PaneFooter padding={2}>
          <Box style={{display: 'flex'}}>
            <Button fontSize={2} padding={3} tone="positive" mode="bleed">
              <Flex align="center">
                <Box marginRight={3}>
                  <Text size={2}>
                    <PublishIcon />
                  </Text>
                </Box>
                <Text size={1}>2d</Text>
              </Flex>
            </Button>

            <Button
              fontSize={2}
              padding={1}
              tone={
                documentState == 'saving'
                  ? 'default'
                  : documentState == 'saved'
                  ? 'positive'
                  : 'caution'
              }
              mode="bleed"
              paddingRight={3}
            >
              <Flex align="center">
                <Box marginRight={2}>
                  <Root
                    width="25"
                    height="25"
                    viewBox="0 0 25 25"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{display: 'block'}}
                    stroke="currentColor"
                    strokeWidth="1.2"
                    className="default"
                  >
                    {/* <IncompleteCircle d="M13.5 4.5H12.5C8.08172 4.5 4.5 8.08172 4.5 12.5C4.5 15.6631 6.33576 18.3975 9 19.6958M11.5 20.5H12.5C16.9183 20.5 20.5 16.9183 20.5 12.5C20.5 9.33688 18.6642 6.60253 16 5.30423" /> */}
                    {/* <RightCircle d="M12.5 20.5C16.9183 20.5 20.5 16.9183 20.5 12.5C20.5 8.08172 16.9183 4.5 12.5 4.5" />
                    <path
                      className="leftCircle"
                      d="M12.5 20.5C8.08172 20.5 4.5 16.9183 4.5 12.5C4.5 8.08172 8.08172 4.5 12.5 4.5"
                    /> */}
                    <Saving>
                      <Circle
                        data-state={documentState}
                        d="M12.5 20.5C16.9183 20.5 20.5 16.9183 20.5 12.5C20.5 8.08172 16.9183 4.5 12.5 4.5C8.08172 4.5 4.5 8.08172 4.5 12.5C4.5 16.9183 8.08172 20.5 12.5 20.5Z"
                      />
                      <Arrows
                        data-state={documentState}
                        d="M14 17.5619L11.5 20.5L14.5 23.0619M11 7.43811L13.5 4.50001L10.5 1.93811"
                      />
                    </Saving>
                    <EditIcon
                      data-state={documentState}
                      d="M15 7L18 10M6 19L7 15L17 5L20 8L10 18L6 19Z"
                    />
                    <Checkmark data-state={documentState} d="M9.5 12.1316L11.7414 14.5L16 10" />
                  </Root>
                </Box>
                <Text size={1}>
                  {documentState == 'saving'
                    ? 'Saving…'
                    : documentState == 'saved'
                    ? 'Saved!'
                    : '15s'}
                </Text>
              </Flex>
            </Button>
          </Box>
        </PaneFooter>
      </Pane>
    </PaneLayout>
  )
}
