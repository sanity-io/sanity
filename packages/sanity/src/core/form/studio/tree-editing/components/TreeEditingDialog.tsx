/* eslint-disable i18next/no-literal-string */
import {Card, Code, Dialog, Flex, Text} from '@sanity/ui'
import {isEqual} from 'lodash'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {
  FormInput,
  type InputProps,
  type ObjectInputProps,
  type ObjectSchemaType,
  type Path,
} from 'sanity'
import styled from 'styled-components'

import {buildTreeMenuItems, EMPTY_TREE_STATE, isOpen, type TreeEditingState} from '../utils'
import {TreeEditingLayout} from './TreeEditingLayout'

const DEBUG_RELATIVE_PATH = true

function renderDefault(props: InputProps) {
  return props.renderDefault(props)
}

const StyledDialog = styled(Dialog)`
  [data-ui='DialogCard'] {
    padding: 2em; // todo: use theme values
    box-sizing: border-box;
  }

  [data-ui='Card']:first-child {
    flex: 1;
  }
`

interface TreeEditingDialogProps {
  // ...
  focusPath: Path
  schemaType: ObjectSchemaType
  setFocusPath: (path: Path) => void
  rootInputProps: Omit<ObjectInputProps, 'renderDefault'>
}

const EMPTY_ARRAY: [] = []

export function TreeEditingDialog(props: TreeEditingDialogProps): JSX.Element | null {
  const {focusPath, rootInputProps, schemaType, setFocusPath} = props
  const {value} = rootInputProps

  const [treeState, setTreeState] = useState<TreeEditingState>(EMPTY_TREE_STATE)

  const onClose = useCallback(() => {
    setFocusPath(EMPTY_ARRAY)
    setTreeState(EMPTY_TREE_STATE)
  }, [setFocusPath])

  useEffect(() => {
    if (focusPath.length === 0) {
      return
    }

    const nextState = buildTreeMenuItems({
      schemaType,
      documentValue: value, // todo: consider not passing the whole value but only the relevant part
      focusPath,
    })

    if (isEqual(nextState, treeState)) return

    setTreeState(nextState)
  }, [focusPath, schemaType, treeState, value])

  const {menuItems, relativePath} = treeState

  const open = useMemo(() => isOpen(schemaType, relativePath), [relativePath, schemaType])

  if (!open || relativePath.length === 0) return null

  return (
    <StyledDialog
      autoFocus={false}
      id="tree-editing-dialog"
      onClickOutside={onClose}
      padding={0}
      width={3}
    >
      <TreeEditingLayout items={menuItems} onPathSelect={setFocusPath} selectedPath={relativePath}>
        {DEBUG_RELATIVE_PATH && (
          <Card
            padding={3}
            radius={2}
            margin={2}
            marginBottom={5}
            sizing="border"
            tone="transparent"
            flex={1}
            shadow={1}
            scheme="dark"
          >
            <Flex direction="column" gap={3}>
              <Text size={1} weight="medium">
                Relative path:
              </Text>

              <Card padding={2} tone="transparent" shadow={1}>
                <Code size={1} language="json">
                  {JSON.stringify(relativePath)}
                </Code>
              </Card>
            </Flex>
          </Card>
        )}

        <FormInput {...rootInputProps} relativePath={relativePath} renderDefault={renderDefault} />
      </TreeEditingLayout>
    </StyledDialog>
  )
}
