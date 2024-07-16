import {Button, Card, Dialog, Flex} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2, type Theme} from '@sanity/ui/theme'
import {toString} from '@sanity/util/paths'
import {AnimatePresence, motion, type Transition, type Variants} from 'framer-motion'
import {debounce, isEqual} from 'lodash'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {
  FormInput,
  type InputProps,
  isKeySegment,
  type ObjectInputProps,
  type ObjectSchemaType,
  type Path,
  useTranslation,
} from 'sanity'
import {css, styled} from 'styled-components'

import {
  type ArrayEditingState,
  buildArrayEditingState,
  type BuildArrayEditingStateProps,
  EMPTY_STATE,
} from '../utils'
import {isArrayItemPath} from '../utils/build-array-editing-state/utils'
import {ArrayEditingLayout} from './layout'

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

const MotionFlex = motion(Flex)

interface ArrayEditingDialogProps {
  onPathFocus: (path: Path) => void
  onPathOpen: (path: Path) => void
  openPath: Path
  rootInputProps: Omit<ObjectInputProps, 'renderDefault'>
  schemaType: ObjectSchemaType
}

export function ArrayEditingDialog(props: ArrayEditingDialogProps): JSX.Element | null {
  const {onPathFocus, onPathOpen, openPath, rootInputProps, schemaType} = props
  const {value} = rootInputProps
  const {t} = useTranslation()

  const [state, setState] = useState<ArrayEditingState>(EMPTY_STATE)
  const [layoutScrollElement, setLayoutScrollElement] = useState<HTMLDivElement | null>(null)

  const openPathRef = useRef<Path | undefined>(undefined)
  const valueRef = useRef<Record<string, unknown> | undefined>(undefined)

  const handleAnimationExitComplete = useCallback(() => {
    // Scroll to the top of the layout when the animation has completed
    // to avoid the layout being scrolled while the content is being
    // animated out and then back in.
    layoutScrollElement?.scrollTo(0, 0)
  }, [layoutScrollElement])

  const handleBuildState = useCallback(
    (opts: BuildArrayEditingStateProps) => {
      const nextState = buildArrayEditingState(opts)

      if (isEqual(nextState, state)) return

      const builtRelativePath = nextState.relativePath
      const len = builtRelativePath.length

      const hasNoRelativePath = len === 0

      // If there is not relative path or the path is not an array item path, we want to use the
      // current relative path. This is to avoid changing the fields being displayed in the form
      // when the path is not an array item path.
      const useCurrentRelativePath = hasNoRelativePath || !isArrayItemPath(builtRelativePath)
      const nextRelativePath = useCurrentRelativePath ? state.relativePath : builtRelativePath

      setState({...nextState, relativePath: nextRelativePath})
    },
    [state],
  )

  const debouncedBuildState = useMemo(() => debounce(handleBuildState, 1000), [handleBuildState])

  const onClose = useCallback(() => {
    // Cancel any debounced state building when closing the dialog.
    debouncedBuildState.cancel()

    // Reset the `openPath`
    onPathOpen(EMPTY_ARRAY)

    // Reset the state when closing the dialog.
    setState(EMPTY_STATE)

    // Reset the stored value and openPath to undefined.
    // This is important since the next time the dialog is opened,
    // we want to build the editing state from scratch and
    // don't prevent the state from being built by comparing the
    // previous stored values.
    valueRef.current = undefined
    openPathRef.current = undefined

    // Focus the root array item when closing the dialog.
    const firstKeySegmentIndex = openPath.findIndex(isKeySegment)
    const rootFocusPath = openPath.slice(0, firstKeySegmentIndex + 1)
    onPathFocus(rootFocusPath)
  }, [debouncedBuildState, onPathFocus, onPathOpen, openPath])

  const onHandlePathSelect = useCallback(
    (path: Path) => {
      // Cancel any debounced state building when navigating.
      debouncedBuildState.cancel()

      onPathOpen(path)

      // If the path is not an array item path, it means that the field is
      // present in the form. In that case, we want to focus the field
      // in the form when it is selected in order to scroll it into view.
      if (!isArrayItemPath(path)) {
        onPathFocus(path)
      }
    },
    [debouncedBuildState, onPathFocus, onPathOpen],
  )

  useEffect(() => {
    const valueChanged = !isEqual(value, valueRef.current)
    const openPathChanged = !isEqual(openPath, openPathRef.current)
    const isInitialRender = valueRef.current === undefined && openPathRef.current === undefined

    // If the value has not changed but the openPath has changed, or
    // if it is the initial render, build the editing state
    // without debouncing. We do this to make sure that the UI is
    // updated immediately when the openPath changes.
    // We only want to debounce the state building when the value changes
    // as that might happen frequently when the user is editing the document.
    if (isInitialRender || openPathChanged) {
      handleBuildState({
        schemaType,
        documentValue: value,
        openPath,
      })

      openPathRef.current = openPath

      return undefined
    }

    // Don't proceed with building t editing state if the
    // openPath and value has not changed.
    if (!valueChanged && !openPathChanged) return undefined

    // Store the openPath and value to be able to compare them
    // with the next openPath and value.
    valueRef.current = value
    openPathRef.current = openPath

    debouncedBuildState({
      schemaType,
      documentValue: value,
      openPath,
    })

    return () => {
      // Cancel any debounced state building on unmount.
      debouncedBuildState.cancel()
    }
  }, [schemaType, value, debouncedBuildState, openPath, handleBuildState])

  if (state.relativePath.length === 0) return null

  return (
    <StyledDialog
      __unstable_hideCloseButton
      animate
      data-testid="array-editing-dialog"
      id="array-editing-dialog"
      onClickOutside={onClose}
      onClose={onClose}
      padding={0}
      width={3}
    >
      <ArrayEditingLayout
        breadcrumbs={state.breadcrumbs}
        onPathSelect={onHandlePathSelect}
        selectedPath={state.relativePath}
        setScrollElement={setLayoutScrollElement}
        footer={
          <Card borderTop>
            <Flex align="center" justify="flex-end" paddingX={3} paddingY={2} sizing="border">
              <Button
                data-testid="array-editing-done"
                text={t('array-editing-dialog.sidebar.action.done')}
                onClick={onClose}
              />
            </Flex>
          </Card>
        }
      >
        <AnimatePresence initial={false} mode="wait" onExitComplete={handleAnimationExitComplete}>
          <MotionFlex
            animate="animate"
            data-testid="array-editing-dialog-content"
            direction="column"
            exit="exit"
            height="fill"
            initial="initial"
            key={toString(state.relativePath)}
            overflow="hidden"
            padding={1}
            sizing="border"
            transition={ANIMATION_TRANSITION}
            variants={ANIMATION_VARIANTS}
          >
            <FormInput
              {...rootInputProps}
              relativePath={state.relativePath}
              renderDefault={renderDefault}
            />
          </MotionFlex>
        </AnimatePresence>
      </ArrayEditingLayout>
    </StyledDialog>
  )
}
