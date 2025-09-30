import {useTelemetry} from '@sanity/telemetry/react'
import {isKeySegment, type ObjectSchemaType, type Path} from '@sanity/types'
import {Box} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2, type Theme} from '@sanity/ui/theme'
import {debounce, isEqual} from 'lodash'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {css, styled} from 'styled-components'

import {Dialog} from '../../../../../ui-components'
import {pathToString, stringToPath} from '../../../../field/paths/helpers'
import {FormInput} from '../../../components/FormInput'
import {VirtualizerScrollInstanceProvider} from '../../../inputs/arrays/ArrayOfObjectsInput/List/VirtualizerScrollInstanceProvider'
import {useFullscreenPTE} from '../../../inputs/PortableText/contexts/fullscreen'
import {type ObjectInputProps} from '../../../types/inputProps'
import {NestedDialogClosed, NestedDialogOpened} from '../__telemetry__/nestedObjects.telemetry'
import {
  buildTreeEditingState,
  type BuildTreeEditingStateProps,
  EMPTY_TREE_STATE,
  type TreeEditingState,
} from '../utils'
import {isArrayItemPath} from '../utils/build-tree-editing-state/utils'
import {isPathTextInPTEField} from '../utils/isPathTextInPTEField'
import {TreeEditingBreadcrumbs} from './breadcrumbs'

const EMPTY_ARRAY: [] = []

function renderDefault(props: unknown) {
  return (props as {renderDefault: (p: unknown) => React.ReactElement}).renderDefault(props)
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

  const [treeState, setTreeState] = useState<TreeEditingState>(EMPTY_TREE_STATE)
  const {hasAnyFullscreen, allFullscreenPaths} = useFullscreenPTE()

  const openPathRef = useRef<Path | undefined>(undefined)
  const valueRef = useRef<Record<string, unknown> | undefined>(undefined)

  const telemetry = useTelemetry()

  const handleBuildTreeEditingState = useCallback(
    (opts: BuildTreeEditingStateProps) => {
      // Check if we're within a portable text context by examining the schema
      const isPathWithinPTEtext = isPathTextInPTEField(schemaType.fields, opts.openPath)

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

      // Preserve breadcrumbs when clicking on text content in portable text editors
      const nextBreadcrumbs =
        isPathWithinPTEtext && treeState.breadcrumbs.length > 0
          ? treeState.breadcrumbs
          : nextState.breadcrumbs

      // Check if dialog is opening (transitioning from no relative path to having one)
      const wasDialogClosed = treeState.relativePath.length === 0
      const willDialogOpen = nextRelativePath.length > 0

      if (wasDialogClosed && willDialogOpen) {
        telemetry.log(NestedDialogOpened, {
          objectPath: pathToString(nextRelativePath),
          timestamp: new Date(),
        })
      }

      setTreeState({
        ...nextState,
        relativePath: nextRelativePath,
        breadcrumbs: nextBreadcrumbs,
      })
    },
    [treeState, telemetry, schemaType.fields],
  )

  const debouncedBuildTreeEditingState = useMemo(
    () => debounce(handleBuildTreeEditingState, 1000),
    [handleBuildTreeEditingState],
  )

  const onClose = useCallback(() => {
    // Check if any PTE within the current tree editing context is in fullscreen mode
    if (hasAnyFullscreen()) {
      allFullscreenPaths.forEach((path) => {
        // Check if the relative path exists in the fullscreen path (so, more deeply nested path)
        // So that we can open the dialog at the correct level (the full screen) instead of closing the dialg
        if (pathToString(treeState.relativePath).includes(path)) {
          onPathOpen(stringToPath(path))
        }
      })

      return
    }

    // Cancel any debounced state building when closing the dialog.
    debouncedBuildTreeEditingState.cancel()

    telemetry.log(NestedDialogClosed, {
      objectPath: pathToString(treeState.relativePath),
      timestamp: new Date(),
    })

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
  }, [
    hasAnyFullscreen,
    debouncedBuildTreeEditingState,
    telemetry,
    treeState.relativePath,
    onPathOpen,
    openPath,
    onPathFocus,
    allFullscreenPaths,
  ])

  const onHandlePathSelect = useCallback(
    (path: Path) => {
      if (path.length === 0) onClose()

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
    [debouncedBuildTreeEditingState, onClose, onPathFocus, onPathOpen],
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
  const [documentScrollElement, setDocumentScrollElement] = useState<HTMLDivElement | null>(null)
  const containerElement = useRef<HTMLDivElement | null>(null)

  if (treeState.relativePath.length === 0) return null

  const header = (
    <TreeEditingBreadcrumbs
      items={treeState.breadcrumbs}
      onPathSelect={onHandlePathSelect}
      selectedPath={treeState.relativePath}
    />
  )

  return (
    <VirtualizerScrollInstanceProvider
      scrollElement={documentScrollElement}
      containerElement={containerElement}
    >
      <StyledDialog
        data-testid="tree-editing-dialog"
        onClose={onClose}
        id={'nested-object-dialog'}
        header={header}
        width={3}
        contentRef={setDocumentScrollElement}
      >
        <Box ref={containerElement}>
          <FormInput
            {...rootInputProps}
            relativePath={treeState.relativePath}
            renderDefault={renderDefault}
          />
        </Box>
      </StyledDialog>
    </VirtualizerScrollInstanceProvider>
  )
}
