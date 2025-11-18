import {useTelemetry} from '@sanity/telemetry/react'
import {isKeySegment, type ObjectSchemaType, type Path} from '@sanity/types'
import {Box, useGlobalKeyDown} from '@sanity/ui'
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
import {type InputProps, type ObjectInputProps} from '../../../types/inputProps'
import {NestedDialogClosed, NestedDialogOpened} from '../__telemetry__/nestedObjects.telemetry'
import {
  buildTreeEditingState,
  type BuildTreeEditingStateProps,
  EMPTY_TREE_STATE,
  type TreeEditingState,
} from '../utils'
import {isArrayItemPath} from '../utils/build-tree-editing-state/utils'
import {isPathTextInPTEField} from '../utils/isPathTextInPTEField'
import {NestedDialogHeader} from './header/NestedDialogHeader'

const EMPTY_ARRAY: [] = []

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

interface EnhancedObjectDialogProps {
  onPathFocus: (path: Path) => void
  onPathOpen: (path: Path) => void
  openPath: Path
  rootInputProps: Omit<ObjectInputProps, 'renderDefault'>
  schemaType: ObjectSchemaType
}

export function EnhancedObjectDialog(props: EnhancedObjectDialogProps): React.JSX.Element | null {
  const {onPathFocus, onPathOpen, openPath, rootInputProps, schemaType} = props
  const {value} = rootInputProps

  const [treeState, setTreeState] = useState<TreeEditingState>(EMPTY_TREE_STATE)
  const {hasAnyFullscreen, allFullscreenPaths} = useFullscreenPTE()

  const openPathRef = useRef<Path | undefined>(undefined)
  const valueRef = useRef<Record<string, unknown> | undefined>(undefined)
  const treeStateRef = useRef<TreeEditingState>(EMPTY_TREE_STATE)

  const telemetry = useTelemetry()

  const handleBuildTreeEditingState = useCallback(
    (
      opts: BuildTreeEditingStateProps,
      // eslint-disable-next-line @typescript-eslint/no-shadow -- workaround the React Compiler flagging refs being passed to lodash's `debounce`
      treeStateRef: React.RefObject<TreeEditingState>,
    ) => {
      const currentTreeState = treeStateRef.current
      const isPathWithinPTEtext = isPathTextInPTEField(
        schemaType.fields,
        opts.openPath,
        opts.documentValue,
      )

      const nextState = buildTreeEditingState(opts)
      if (isEqual(nextState, currentTreeState)) return

      const builtRelativePath = nextState.relativePath
      const len = builtRelativePath.length

      const hasNoRelativePath = len === 0
      const isMarksDefinition = opts.openPath[opts.openPath.length - 2] === 'markDefs'

      // If openPath is empty, we're closing the dialog and should clear the relative path
      const isClosingDialog = opts.openPath.length === 0

      // If there is not relative path or the path is not an array item path, we want to use the
      // current relative path. This is to avoid changing the fields being displayed in the form
      // when the path is not an array item path.
      // We also preserve the relative path for markDefs to avoid changing the form when editing annotations.
      // However, if we're explicitly closing the dialog (openPath is empty), don't preserve the path.
      const useCurrentRelativePath =
        (hasNoRelativePath || !isArrayItemPath(builtRelativePath) || isMarksDefinition) &&
        !isClosingDialog
      const nextRelativePath = useCurrentRelativePath
        ? currentTreeState.relativePath
        : builtRelativePath

      // Preserve breadcrumbs when clicking on text content in portable text editors
      const nextBreadcrumbs =
        isPathWithinPTEtext && currentTreeState.breadcrumbs.length > 0
          ? currentTreeState.breadcrumbs
          : nextState.breadcrumbs

      // Preserve siblings / counter when clicking on text content in portable text editors
      // Do NOT preserve siblings when the PTE is at document root level (eg: body) - only for nested PTEs
      const nextSiblings =
        isPathWithinPTEtext && currentTreeState.siblings && currentTreeState.siblings.size > 0
          ? currentTreeState.siblings
          : nextState.siblings

      // Check if dialog is opening (transitioning from no relative path to having one)
      const wasDialogClosed = currentTreeState.relativePath.length === 0
      const willDialogOpen = nextRelativePath.length > 0

      if (wasDialogClosed && willDialogOpen) {
        telemetry.log(NestedDialogOpened, {
          path: pathToString(nextRelativePath),
        })
      }

      const newTreeState = {
        ...nextState,
        relativePath: nextRelativePath,
        breadcrumbs: nextBreadcrumbs,
        siblings: nextSiblings,
      }

      treeStateRef.current = newTreeState
      setTreeState(newTreeState)
    },
    [telemetry, schemaType.fields],
  )

  const debouncedBuildTreeEditingState = useMemo(
    () => debounce(handleBuildTreeEditingState, 1000),
    [handleBuildTreeEditingState],
  )

  const onClose = useCallback(() => {
    // Check if any PTE within the current tree editing context is in fullscreen mode
    // If the openPath is at the root level and the fullscreen is open then it means that the user
    // is at the root and should close the window
    if (hasAnyFullscreen() && allFullscreenPaths.length >= 1) {
      // Find all fullscreen paths that are ancestors of the current relative path
      const ancestorPaths = allFullscreenPaths.filter((pathStr) => {
        const fullscreenPath = stringToPath(pathStr)

        // Check if fullscreen path is shorter, which means that it's not an ancestor
        if (fullscreenPath.length >= treeState.relativePath.length) {
          return false
        }

        // Check if all segments of fullscreen path match the start of relative path
        // This is important for nested fullscreen PTEs
        const segmentsMatch = fullscreenPath.every((segment, index) => {
          const relativeSegment = treeState.relativePath[index]

          // For key segments, compare the _key property
          // For string segments, direct comparison
          return isKeySegment(segment) && isKeySegment(relativeSegment)
            ? segment._key === relativeSegment._key
            : segment === relativeSegment
        })

        if (!segmentsMatch) {
          return false
        }

        // Check if the fullscreen path contains a key segment (that is nested)
        const isNestedFullscreenPath = fullscreenPath.some((segment) => isKeySegment(segment))

        if (isNestedFullscreenPath) {
          // For nested fullscreen PTEs, always navigate back to them
          return true
        }

        // For root-level fullscreen PTEs, only navigate back if the next segment
        // is NOT a key segment (i.e., we're going to a child field, not selecting an array item)
        const nextSegment = treeState.relativePath[fullscreenPath.length]
        return !isKeySegment(nextSegment)
      })

      // If we found ancestor paths, navigate to the most nested one (longest/closest parent)
      if (ancestorPaths.length > 0) {
        const closestParentPath = ancestorPaths.reduce((longest, current) =>
          current.length > longest.length ? current : longest,
        )
        onPathOpen(stringToPath(closestParentPath))
        return
      }
    }

    // Cancel any debounced state building when closing the dialog.
    debouncedBuildTreeEditingState.cancel()

    telemetry.log(NestedDialogClosed, {
      path: pathToString(treeState.relativePath),
    })

    // Reset the `openPath`
    onPathOpen(EMPTY_ARRAY)

    // Reset the tree state when closing the dialog.
    treeStateRef.current = EMPTY_TREE_STATE
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

  const handleGlobalKeyDown = useCallback(
    (event: any) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'ArrowUp') {
        event.preventDefault()
        // If the relative path is longer than 2, we want to open the parent path
        // If the relative path is 2, we want to close the dialog
        if (treeState.relativePath.length > 2) {
          onPathOpen(treeState.relativePath.slice(0, -1))
        } else {
          onClose()
        }
      }
    },
    [onPathOpen, treeState.relativePath, onClose],
  )

  useGlobalKeyDown(handleGlobalKeyDown)

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

    const isMarksDefinition = openPath[openPath.length - 2] === 'markDefs'

    // If the value has not changed but the openPath has changed, or
    // if it is the initial render, build the tree editing state
    // without debouncing. We do this to make sure that the UI is
    // updated immediately when the openPath changes.
    // We only want to debounce the state building when the value changes
    // as that might happen frequently when the user is editing the document.

    if (isInitialRender || openPathChanged || !isMarksDefinition) {
      handleBuildTreeEditingState(
        {
          schemaType,
          documentValue: value,
          openPath,
        },
        treeStateRef,
      )

      valueRef.current = value
      openPathRef.current = openPath

      return undefined
    }

    // Don't proceed with building the tree editing state if the
    // openPath and value has not changed.
    if (!valueChanged && !openPathChanged && isMarksDefinition) return undefined

    // Store the openPath and value to be able to compare them
    // with the next openPath and value.
    valueRef.current = value
    openPathRef.current = openPath

    debouncedBuildTreeEditingState(
      {
        schemaType,
        documentValue: value,
        openPath,
      },
      treeStateRef,
    )

    return () => {
      // Cancel any debounced state building on unmount.
      debouncedBuildTreeEditingState.cancel()
    }
  }, [schemaType, value, debouncedBuildTreeEditingState, openPath, handleBuildTreeEditingState])
  const [documentScrollElement, setDocumentScrollElement] = useState<HTMLDivElement | null>(null)
  const containerElement = useRef<HTMLDivElement | null>(null)

  if (treeState.relativePath.length === 0) return null

  return (
    <VirtualizerScrollInstanceProvider
      scrollElement={documentScrollElement}
      containerElement={containerElement}
    >
      <StyledDialog
        data-testid="nested-object-dialog"
        onClose={onClose}
        id={'nested-object-dialog'}
        header={
          <NestedDialogHeader treeState={treeState} onHandlePathSelect={onHandlePathSelect} />
        }
        width={1}
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
