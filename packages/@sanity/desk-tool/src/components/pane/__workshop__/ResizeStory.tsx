import {Text} from '@sanity/ui'
import React from 'react'
import {Pane, PaneContent, PaneFooter, PaneHeader, PaneLayout} from '..'

export default function ResizeStory() {
  return (
    <PaneLayout height="fill">
      {/* <ListPane /> */}
      {/* <ListPane /> */}
      {/* <ListPane /> */}
      {/* <ListPane /> */}
      <ListPane />
      <ListPane />
      <DocumentPane />
    </PaneLayout>
  )
}

function ListPane() {
  return (
    <Pane currentMaxWidth={350} flex={1} minWidth={320 / 2} maxWidth={500}>
      <PaneHeader title="List" />
    </Pane>
  )
}

function DocumentPane() {
  return (
    <Pane flex={2} minWidth={320 / 2}>
      <PaneHeader title="Document" />
      <PaneContent />
      <PaneFooter padding={4}>
        <Text>Footer</Text>
      </PaneFooter>
    </Pane>
  )
}
