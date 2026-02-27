import {useTelemetry} from '@sanity/telemetry/react'
import {type Path} from '@sanity/types'
import {Box, type ResponsiveWidthProps, useGlobalKeyDown} from '@sanity/ui'
import {type DragEvent, type ReactNode, useCallback, useEffect, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {Dialog} from '../../../ui-components'
import {PopoverDialog} from '../../components'
import {pathToString} from '../../field/paths/helpers'
import {useDialogStack} from '../../hooks/useDialogStack'
import {PresenceOverlay} from '../../presence'
import {VirtualizerScrollInstanceProvider} from '../inputs/arrays/ArrayOfObjectsInput/List/VirtualizerScrollInstanceProvider'
import {
  NavigatedToNestedObjectViaCloseButton,
  navigatedToNestedObjectViaKeyboardShortcut,
  NestedDialogClosed,
  NestedDialogOpened,
} from '../studio/tree-editing/__telemetry__/nestedObjects.telemetry'
import {DialogBreadcrumbs} from './breadcrumbs/DialogBreadcrumbs'

/**
 * Styled Dialog component that conditionally hides the dialog card and backdrop.
 * Used to keep non-top dialogs in the DOM but hidden from view.
 */
const StyledDialog = styled(Dialog)<{$isHidden: boolean}>`
  ${(props) =>
    props.$isHidden &&
    `
    /* Hide the backdrop (the semi-transparent overlay) */
    background: transparent !important;

    /* Hide the dialog card */
    [data-ui='DialogCard'] {
      opacity: 0 !important;
      pointer-events: none !important;
      transform: scale(0.95) !important;
    }
  `}
`

const PRESENCE_MARGINS: [number, number, number, number] = [0, 0, 1, 0]

interface SharedProps {
  children?: ReactNode
  header: string
  width: ResponsiveWidthProps['width']
}
interface DialogProps extends SharedProps {
  type: 'dialog'
  id?: string
  autofocus?: boolean
  onClose?: () => void
}

interface PopoverProps extends SharedProps {
  type: 'popover'
  id?: string
  legacy_referenceElement: HTMLElement | null
  onClose: () => void
}

function onDragEnter(event: DragEvent<HTMLDivElement>) {
  return event.stopPropagation()
}

function onDrop(event: DragEvent<HTMLDivElement>) {
  return event.stopPropagation()
}

/**
 * @beta
 * Creates a dialog or a popover for editing content.
 * Handles presence and virtual scrolling.
 *
 * When multiple dialogs are open, only the top-most dialog is visible.
 * Non-top dialogs are hidden via CSS while preserving their state.
 */
export function EnhancedObjectDialog(props: PopoverProps | DialogProps): React.JSX.Element {
  const {children, header, type, width} = props
  const [documentScrollElement, setDocumentScrollElement] = useState<HTMLDivElement | null>(null)
  const containerElement = useRef<HTMLDivElement | null>(null)
  const telemetry = useTelemetry()
  const {absolutePath, path} = (children as React.ReactElement)?.props as {
    absolutePath?: Path
    path?: Path
  }

  // Absolute paths have the full path including opened key, while path has only the current path
  // This is important for the breadcrumbs to show the correct path
  // Specifically when opening a key in a PTE
  const currentPath = absolutePath || path

  const {dialogId, isTop, stack, close, navigateTo} = useDialogStack({
    path: currentPath,
  })

  // Log telemetry when the dialog opens
  useEffect(() => {
    if (stack.length === 0) {
      telemetry.log(NestedDialogOpened, {
        path: pathToString([]),
      })
    }
  }, [stack, telemetry])

  const contents = (
    <PresenceOverlay margins={PRESENCE_MARGINS}>
      <Box ref={containerElement} style={{minHeight: 'min(calc(100vh - 200px), 500px)'}}>
        {children}
      </Box>
    </PresenceOverlay>
  )

  // Track if we've ever had nested dialogs during this dialog's lifetime
  // Once nested, animation should stay disabled (even when going back to first dialog)
  const [hasEverBeenNested, setHasEverBeenNested] = useState(false)

  // Update state when we have nested dialogs
  useEffect(() => {
    if (stack.length > 1 && !hasEverBeenNested) {
      setHasEverBeenNested(true)
    }
  }, [stack.length, hasEverBeenNested])

  // Disable animation when there are or have been nested dialogs
  const shouldDisableAnimation = stack.length > 1 || hasEverBeenNested

  const handleGlobalKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Only the top dialog should respond to the keyboard shortcut
      if (isTop && (event.metaKey || event.ctrlKey) && event.key === 'ArrowUp') {
        event.preventDefault()

        const lastStackPath = stack[stack.length - 1]?.path

        if (lastStackPath && lastStackPath.length > 1) {
          const newLastStackPath = lastStackPath.slice(0, -1)

          if (newLastStackPath.length > 1) {
            telemetry.log(navigatedToNestedObjectViaKeyboardShortcut)
            navigateTo(newLastStackPath)
          } else {
            telemetry.log(NestedDialogClosed)
            close()
          }
        }
      }
    },
    [isTop, stack, navigateTo, close, telemetry],
  )

  const handleStackedDialogClose = useCallback(
    (closeAll?: boolean) => {
      if (!closeAll && stack.length >= 2) {
        telemetry.log(NavigatedToNestedObjectViaCloseButton)
        close({toParent: true})
      } else {
        telemetry.log(NestedDialogClosed)
        close()
      }
    },
    [telemetry, close, stack.length],
  )

  const handleCompleteDialogClose = useCallback(() => {
    telemetry.log(NestedDialogClosed)
    close()
  }, [close, telemetry])

  useGlobalKeyDown(handleGlobalKeyDown)

  if (type === 'dialog') {
    return (
      <VirtualizerScrollInstanceProvider
        scrollElement={documentScrollElement}
        containerElement={containerElement}
      >
        <StyledDialog
          $isHidden={!isTop}
          __unstable_autoFocus={isTop ? props.autofocus : false}
          contentRef={setDocumentScrollElement}
          data-testid="nested-object-dialog"
          header={
            <DialogBreadcrumbs
              currentPath={currentPath}
              onNavigate={navigateTo}
              onClose={handleStackedDialogClose}
            />
          }
          id={dialogId}
          onClose={handleStackedDialogClose}
          onDragEnter={onDragEnter}
          onDrop={onDrop}
          width={width}
          animate={!shouldDisableAnimation}
          onClickOutside={handleCompleteDialogClose}
        >
          {contents}
        </StyledDialog>
      </VirtualizerScrollInstanceProvider>
    )
  }

  return (
    <VirtualizerScrollInstanceProvider
      scrollElement={documentScrollElement}
      containerElement={containerElement}
    >
      <PopoverDialog
        header={header}
        onClose={handleStackedDialogClose}
        width={width}
        containerRef={setDocumentScrollElement}
        referenceElement={props.legacy_referenceElement}
      >
        {contents}
      </PopoverDialog>
    </VirtualizerScrollInstanceProvider>
  )
}
