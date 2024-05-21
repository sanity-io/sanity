/* eslint-disable @sanity/i18n/no-attribute-string-literals */
import {Button, Card, Dialog, Flex} from '@sanity/ui'
import {type Theme} from '@sanity/ui/theme'
import {toString} from '@sanity/util/paths'
import {AnimatePresence, motion, type Transition, type Variants} from 'framer-motion'
import {debounce, type DebounceSettings, isEqual} from 'lodash'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  FormInput,
  type InputProps,
  type ObjectInputProps,
  type ObjectSchemaType,
  type Path,
} from 'sanity'
import styled, {css} from 'styled-components'

import {
  buildTreeEditingState,
  type BuildTreeEditingStateProps,
  EMPTY_TREE_STATE,
  shouldArrayDialogOpen,
  type TreeEditingState,
} from '../utils'
import {TreeEditingLayout} from './TreeEditingLayout'

const EMPTY_ARRAY: [] = []

const ANIMATION_VARIANTS: Variants = {
  initial: {opacity: 0},
  animate: {opacity: 1},
  exit: {opacity: 0},
}

const ANIMATION_TRANSITION: Transition = {duration: 0.2, ease: 'easeInOut'}

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
  onPathOpen: (path: Path) => void
  openPath: Path
  rootInputProps: Omit<ObjectInputProps, 'renderDefault'>
  schemaType: ObjectSchemaType
}

export function TreeEditingDialog(props: TreeEditingDialogProps): JSX.Element | null {
  const {rootInputProps, schemaType, openPath, onPathOpen} = props
  const {value} = rootInputProps

  const [treeState, setTreeState] = useState<TreeEditingState>(EMPTY_TREE_STATE)

  const openPathRef = useRef<Path | null>(null)
  const valueRef = useRef<Record<string, unknown> | undefined>(undefined)

  const handleBuildTreeEditingState = useCallback(
    (opts: BuildTreeEditingStateProps) => {
      const nextState = buildTreeEditingState(opts)

      if (isEqual(nextState, treeState)) return

      const buildRelativePath = nextState.relativePath
      const len = buildRelativePath.length

      const hasNoRelativePath = len === 0

      // If the last segment has a `_key` property, it is an array item path.
      // In that case, we want to use the built relative path as the relative path.
      // Otherwise, the built relative path is pointing to an non-array item path.
      // In that case, we do not want to use the built relative path as that would
      // lead to filtering out only those fields in the form.
      // We only want to change the fields being displayed when the path is
      // pointing to an array item.
      const isArrayItemPath = buildRelativePath[len - 1]?.hasOwnProperty('_key')
      const useBuiltRelativePath = hasNoRelativePath || !isArrayItemPath
      const nextRelativePath = useBuiltRelativePath ? treeState.relativePath : buildRelativePath

      setTreeState({...nextState, relativePath: nextRelativePath})
    },
    [treeState],
  )

  const debouncedBuildTreeEditingState = useMemo(
    () => debounce(handleBuildTreeEditingState, 1000, DEBOUNCE_SETTINGS),
    [handleBuildTreeEditingState],
  )

  const onClose = useCallback(() => {
    // Cancel any debounced state building when closing the dialog.
    debouncedBuildTreeEditingState.cancel()

    // Reset the tree state when closing the dialog.
    setTreeState(EMPTY_TREE_STATE)

    // Reset the `openPath`
    onPathOpen(EMPTY_ARRAY)

    // Reset the stored value and openPath to undefined and null.
    // This is important since the next time the dialog is opened,
    // we want to build the tree editing state from scratch and
    // don't prevent the state from being built by comparing the
    // previous stored values.
    valueRef.current = undefined
    openPathRef.current = null
  }, [debouncedBuildTreeEditingState, onPathOpen])

  const {menuItems, relativePath, rootTitle, breadcrumbs} = treeState

  const open = useMemo(
    () => shouldArrayDialogOpen(schemaType, relativePath),
    [relativePath, schemaType],
  )

  const onHandlePathSelect = useCallback(
    (path: Path) => {
      // Cancel any debounced state building when navigating.
      // This is done to allow for immediate navigation to the selected path
      // and not wait for the debounced state to be built.
      // The debounced state is primarily used to avoid building the state
      // on every document value or focus path change.
      debouncedBuildTreeEditingState.cancel()
      onPathOpen(path)

      // handleNavigate(path, setFocusPath) // todo: implement handleNavigate
    },
    [debouncedBuildTreeEditingState, onPathOpen],
  )

  useEffect(() => {
    // Don't proceed with building the tree editing state if the dialog
    // should not be open.
    if (!shouldArrayDialogOpen(schemaType, openPath)) return

    const valueChanged = !isEqual(value, valueRef.current)
    const openPathChanged = !isEqual(openPath, openPathRef.current)

    // Don't proceed with building the tree editing state if the
    // openPath and value has not changed.
    if (!valueChanged && !openPathChanged) return

    // Store the openPath and value to be able to compare them
    // with the next openPath and value.
    valueRef.current = value
    openPathRef.current = openPath

    debouncedBuildTreeEditingState({
      schemaType,
      documentValue: value,
      openPath,
    })
  }, [schemaType, value, debouncedBuildTreeEditingState, openPath])

  if (!open || relativePath.length === 0) return null

  return (
    <StyledDialog
      __unstable_hideCloseButton
      autoFocus={false}
      id="tree-editing-dialog"
      data-testid="tree-editing-dialog"
      onClickOutside={onClose}
      onClose={onClose}
      padding={0}
      width={3}
    >
      <TreeEditingLayout
        breadcrumbs={breadcrumbs}
        items={menuItems}
        onPathSelect={onHandlePathSelect}
        selectedPath={relativePath}
        title={rootTitle}
        footer={
          <Card borderTop>
            <Flex align="center" justify="flex-end" paddingX={3} paddingY={2} sizing="border">
              <Button text="Done" onClick={onClose} />
            </Flex>
          </Card>
        }
      >
        <AnimatePresence mode="wait">
          <MotionFlex
            animate="animate"
            direction="column"
            exit="exit"
            height="fill"
            initial="initial"
            key={toString(relativePath)}
            overflow="hidden"
            padding={1}
            sizing="border"
            transition={ANIMATION_TRANSITION}
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
