import {isKeySegment, type ObjectSchemaType, type Path} from '@sanity/types'
import {
  Card,
  // eslint-disable-next-line no-restricted-imports
  Dialog, // Custom dialog needed
  Flex,
} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2, type Theme} from '@sanity/ui/theme'
import {toString} from '@sanity/util/paths'
import {AnimatePresence, motion, type Transition, type Variants} from 'framer-motion'
import {debounce, isEqual} from 'lodash'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {css, styled} from 'styled-components'

import {Button} from '../../../../../ui-components'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {FormInput} from '../../../components/FormInput'
import {type InputProps, type ObjectInputProps} from '../../../types/inputProps'
import {
  buildTreeEditingState,
  type BuildTreeEditingStateProps,
  EMPTY_TREE_STATE,
  type TreeEditingState,
} from '../utils'
import {isArrayItemPath} from '../utils/build-tree-editing-state/utils'
import {TreeEditingLayout} from './layout'

const EMPTY_ARRAY: [] = []

const ANIMATION_VARIANTS: Variants = {
  initial: {opacity: 0},
  animate: {opacity: 1},
  exit: {opacity: 0},
}

const ANIMATION_TRANSITION: Transition = {duration: 0.2, ease: 'easeInOut'}

function renderDefault(props: InputProps) {
  return props.renderDefault(props)
}

const StyledDialog = styled(Dialog)(({theme}: {theme: Theme}) => {
  const spacing = getTheme_v2(theme)?.space[4]

  return css`
    [data-ui='DialogCard'] {
      padding: ${spacing}px;
      box-sizing: border-box;

      // Make the dialog full height
      & > [data-ui='Card']:first-child {
        flex: 1;
      }
    }
  `
})

const MotionFlex = motion.create(Flex)

interface TreeEditingDialogProps {
  onPathFocus: (path: Path) => void
  onPathOpen: (path: Path) => void
  openPath: Path
  rootInputProps: Omit<ObjectInputProps, 'renderDefault'>
  schemaType: ObjectSchemaType
}

export function TreeEditingDialog(props: TreeEditingDialogProps): React.JSX.Element | null {
  const {onPathFocus, onPathOpen, openPath, rootInputProps, schemaType} = props
  const {value} = rootInputProps
  const {t} = useTranslation()

  const [treeState, setTreeState] = useState<TreeEditingState>(EMPTY_TREE_STATE)
  const [layoutScrollElement, setLayoutScrollElement] = useState<HTMLDivElement | null>(null)

  const openPathRef = useRef<Path | undefined>(undefined)
  const valueRef = useRef<Record<string, unknown> | undefined>(undefined)

  const handleAnimationExitComplete = useCallback(() => {
    // Scroll to the top of the layout when the animation has completed
    // to avoid the layout being scrolled while the content is being
    // animated out and then back in.
    layoutScrollElement?.scrollTo(0, 0)
  }, [layoutScrollElement])

  const handleBuildTreeEditingState = useCallback(
    (opts: BuildTreeEditingStateProps) => {
      const nextState = buildTreeEditingState(opts)

      if (isEqual(nextState, treeState)) return

      const builtRelativePath = nextState.relativePath
      const len = builtRelativePath.length

      const hasNoRelativePath = len === 0

      // If there is not relative path or the path is not an array item path, we want to use the
      // current relative path. This is to avoid changing the fields being displayed in the form
      // when the path is not an array item path.
      const useCurrentRelativePath = hasNoRelativePath || !isArrayItemPath(builtRelativePath)
      const nextRelativePath = useCurrentRelativePath ? treeState.relativePath : builtRelativePath

      setTreeState({...nextState, relativePath: nextRelativePath})
    },
    [treeState],
  )

  const debouncedBuildTreeEditingState = useMemo(
    () => debounce(handleBuildTreeEditingState, 1000),
    [handleBuildTreeEditingState],
  )

  const onClose = useCallback(() => {
    // Cancel any debounced state building when closing the dialog.
    debouncedBuildTreeEditingState.cancel()

    // Reset the `openPath`
    onPathOpen(EMPTY_ARRAY)

    // Reset the tree state when closing the dialog.
    setTreeState(EMPTY_TREE_STATE)

    // Reset the stored value and openPath to undefined.
    // This is important since the next time the dialog is opened,
    // we want to build the tree editing state from scratch and
    // don't prevent the state from being built by comparing the
    // previous stored values.
    valueRef.current = undefined
    openPathRef.current = undefined

    // Focus the root array item when closing the dialog.
    const firstKeySegmentIndex = openPath.findIndex(isKeySegment)
    const rootFocusPath = openPath.slice(0, firstKeySegmentIndex + 1)
    onPathFocus(rootFocusPath)
  }, [debouncedBuildTreeEditingState, onPathFocus, onPathOpen, openPath])

  const onHandlePathSelect = useCallback(
    (path: Path) => {
      // Cancel any debounced state building when navigating.
      debouncedBuildTreeEditingState.cancel()

      onPathOpen(path)

      // If the path is not an array item path, it means that the field is
      // present in the form. In that case, we want to focus the field
      // in the form when it is selected in order to scroll it into view.
      if (!isArrayItemPath(path)) {
        onPathFocus(path)
      }
    },
    [debouncedBuildTreeEditingState, onPathFocus, onPathOpen],
  )

  useEffect(() => {
    const valueChanged = !isEqual(value, valueRef.current)
    const openPathChanged = !isEqual(openPath, openPathRef.current)
    const isInitialRender = valueRef.current === undefined && openPathRef.current === undefined

    // If the value has not changed but the openPath has changed, or
    // if it is the initial render, build the tree editing state
    // without debouncing. We do this to make sure that the UI is
    // updated immediately when the openPath changes.
    // We only want to debounce the state building when the value changes
    // as that might happen frequently when the user is editing the document.
    if (isInitialRender || openPathChanged) {
      handleBuildTreeEditingState({
        schemaType,
        documentValue: value,
        openPath,
      })

      openPathRef.current = openPath

      return undefined
    }

    // Don't proceed with building the tree editing state if the
    // openPath and value has not changed.
    if (!valueChanged && !openPathChanged) return undefined

    // Store the openPath and value to be able to compare them
    // with the next openPath and value.
    valueRef.current = value
    openPathRef.current = openPath

    debouncedBuildTreeEditingState({
      schemaType,
      documentValue: value,
      openPath,
    })

    return () => {
      // Cancel any debounced state building on unmount.
      debouncedBuildTreeEditingState.cancel()
    }
  }, [schemaType, value, debouncedBuildTreeEditingState, openPath, handleBuildTreeEditingState])

  if (treeState.relativePath.length === 0) return null

  return (
    <StyledDialog
      __unstable_hideCloseButton
      animate
      data-testid="tree-editing-dialog"
      id="tree-editing-dialog"
      onClickOutside={onClose}
      onClose={onClose}
      padding={0}
      width={3}
    >
      <TreeEditingLayout
        breadcrumbs={treeState.breadcrumbs}
        items={treeState.menuItems}
        onPathSelect={onHandlePathSelect}
        selectedPath={treeState.relativePath}
        title={treeState.rootTitle}
        setScrollElement={setLayoutScrollElement}
        footer={
          <Card borderTop>
            <Flex align="center" justify="flex-end" paddingX={3} paddingY={2} sizing="border">
              <Button
                size="large"
                data-testid="tree-editing-done"
                text={t('tree-editing-dialog.sidebar.action.done')}
                onClick={onClose}
              />
            </Flex>
          </Card>
        }
      >
        <AnimatePresence initial={false} mode="wait" onExitComplete={handleAnimationExitComplete}>
          <MotionFlex
            animate="animate"
            data-testid="tree-editing-dialog-content"
            direction="column"
            exit="exit"
            height="fill"
            initial="initial"
            key={toString(treeState.relativePath)}
            overflow="hidden"
            padding={1}
            sizing="border"
            transition={ANIMATION_TRANSITION}
            variants={ANIMATION_VARIANTS}
          >
            <FormInput
              {...rootInputProps}
              relativePath={treeState.relativePath}
              renderDefault={renderDefault}
            />
          </MotionFlex>
        </AnimatePresence>
      </TreeEditingLayout>
    </StyledDialog>
  )
}
