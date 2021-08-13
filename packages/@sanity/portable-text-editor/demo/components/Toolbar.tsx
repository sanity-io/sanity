import React, {useMemo} from 'react'
import {Button, Box, Flex, Grid, Text} from '@sanity/ui'
import {
  PortableTextEditor,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '../../src/index'

export function Toolbar() {
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()
  const {decorators} = PortableTextEditor.getPortableTextFeatures(editor)
  const decoratorButtons = useMemo(
    () =>
      decorators
        .map((dec: {title: string; value: string}) => ({
          ...dec,
          active: PortableTextEditor.isMarkActive(editor, dec.value),
        }))
        .map((dec) => (
          <Button
            selected={!!dec.active}
            mode={'ghost'}
            key={`toolbar-button-${dec.value}`}
            data-value={dec.value}
            onClick={() => PortableTextEditor.toggleMark(editor, dec.value)}
          >
            <Text size={1}>{dec.title}</Text>
          </Button>
        )),
    [decorators, editor, selection] // Note: selection is a extra (required) dependency here
  )

  return (
    <Box>
      <Flex>
        <Grid columns={[2, 3, 4, 6]} gap={[1]} marginBottom={1}>
          {decoratorButtons}
        </Grid>
      </Flex>
    </Box>
  )
}
