/* eslint-disable i18next/no-literal-string */
import {Card, Code, Dialog, Flex, Text} from '@sanity/ui'
import {type Theme} from '@sanity/ui/theme'
import {toString} from '@sanity/util/paths'
import {AnimatePresence, motion, type Variants} from 'framer-motion'
import {debounce, type DebounceSettings, isEqual} from 'lodash'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {
  FormInput,
  type InputProps,
  type ObjectInputProps,
  type ObjectSchemaType,
  type Path,
} from 'sanity'
import styled, {css} from 'styled-components'

import {
  buildTreeMenuItems,
  type BuildTreeMenuItemsProps,
  EMPTY_TREE_STATE,
  isOpen,
  type TreeEditingState,
} from '../utils'
import {TreeEditingLayout} from './TreeEditingLayout'

const DEBUG_RELATIVE_PATH = true

const EMPTY_ARRAY: [] = []

const ANIMATION_VARIANTS: Variants = {
  initial: {opacity: 0},
  animate: {opacity: 1},
  exit: {opacity: 0},
}

const DEBOUNCE_SETTINGS: DebounceSettings = {leading: true, trailing: true}

function renderDefault(props: InputProps) {
  return props.renderDefault(props)
}

const StyledDialog = styled(Dialog)(({theme}: {theme: Theme}) => {
  const spacing = theme.sanity.v2?.space[4]

  return css`
    [data-ui='DialogCard'] {
      padding: ${spacing}px;
      box-sizing: border-box;
    }

    [data-ui='Card']:first-child {
      flex: 1;
    }
  `
})

const MotionFlex = motion(Flex)

interface TreeEditingDialogProps {
  focusPath: Path
  schemaType: ObjectSchemaType
  setFocusPath: (path: Path) => void
  rootInputProps: Omit<ObjectInputProps, 'renderDefault'>
}

export function TreeEditingDialog(props: TreeEditingDialogProps): JSX.Element | null {
  const {focusPath, rootInputProps, schemaType, setFocusPath} = props
  const {value} = rootInputProps

  const [treeState, setTreeState] = useState<TreeEditingState>(EMPTY_TREE_STATE)

  const handleBuildTreeMenuItems = useCallback(
    (opts: BuildTreeMenuItemsProps) => {
      const nextState = buildTreeMenuItems(opts)

      if (isEqual(nextState, treeState)) return

      setTreeState(nextState)
    },
    [treeState],
  )

  const debouncedBuildTreeMenuItems = useMemo(
    () => debounce(handleBuildTreeMenuItems, 1000, DEBOUNCE_SETTINGS),
    [handleBuildTreeMenuItems],
  )

  const onClose = useCallback(() => {
    setFocusPath(EMPTY_ARRAY)
    setTreeState(EMPTY_TREE_STATE)
    debouncedBuildTreeMenuItems.cancel()
  }, [debouncedBuildTreeMenuItems, setFocusPath])

  useEffect(() => {
    if (focusPath.length === 0) {
      return
    }

    debouncedBuildTreeMenuItems({
      schemaType,
      documentValue: value, // todo: consider not passing the whole value but only the relevant part
      focusPath,
    })
  }, [focusPath, schemaType, value, debouncedBuildTreeMenuItems])

  const {menuItems, relativePath, rootTitle, breadcrumbs} = treeState

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
      <TreeEditingLayout
        breadcrumbs={breadcrumbs}
        items={menuItems}
        onPathSelect={setFocusPath}
        selectedPath={relativePath}
        title={rootTitle}
      >
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

            <Flex direction="column" gap={3} marginTop={4}>
              <Text size={1} weight="medium">
                Focus path:
              </Text>

              <Card padding={2} tone="transparent" shadow={1}>
                <Code size={1} language="json">
                  {JSON.stringify(focusPath)}
                </Code>
              </Card>
            </Flex>
          </Card>
        )}

        <AnimatePresence mode="wait">
          <MotionFlex
            animate="animate"
            direction="column"
            exit="exit"
            height="fill"
            initial="initial"
            key={toString(relativePath)}
            overflow="hidden"
            variants={ANIMATION_VARIANTS}
          >
            <FormInput
              {...rootInputProps}
              relativePath={relativePath}
              renderDefault={renderDefault}
            />
          </MotionFlex>
        </AnimatePresence>
      </TreeEditingLayout>
    </StyledDialog>
  )
}
