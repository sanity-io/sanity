import {type Path} from '@sanity/types'
import {Box, type ResponsiveWidthProps, useGlobalKeyDown} from '@sanity/ui'
import {type DragEvent, type ReactNode, useCallback, useRef, useState} from 'react'

import {Dialog} from '../../../ui-components'
import {PopoverDialog} from '../../components'
import {useDialogStack} from '../../hooks/useDialogStack'
import {PresenceOverlay} from '../../presence'
import {VirtualizerScrollInstanceProvider} from '../inputs/arrays/ArrayOfObjectsInput/List/VirtualizerScrollInstanceProvider'
import {useFormCallbacks} from '../studio/contexts/FormCallbacks'
import {DialogBreadcrumbs} from './breadcrumbs/DialogBreadcrumbs'

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
 * Injects CSS to hide a specific dialog by ID.
 * Hides the DialogCard and the backdrop.
 */
function HiddenDialogStyle({dialogId}: {dialogId: string}): React.JSX.Element {
  const escapedId = CSS.escape(dialogId)
  return (
    <style>
      {`
        /* Hide the dialog card */
        #${escapedId} [data-ui="DialogCard"],
        [id="${dialogId}"] [data-ui="DialogCard"] {
          opacity: 0 !important;
          pointer-events: none !important;
          transform: scale(0.95) !important;
        }
        /* Hide the backdrop (the semi-transparent overlay) */
        #${escapedId},
        [id="${dialogId}"] {
          background: transparent !important;
        }
      `}
    </style>
  )
}

/**
 * @beta
 * Creates a dialog or a popover for editing content.
 * Handles presence and virtual scrolling.
 *
 * When multiple EditPortals are open, only the top-most dialog is visible.
 * Non-top dialogs are hidden via CSS while preserving their state.
 */
export function EditPortal(props: PopoverProps | DialogProps): React.JSX.Element {
  const {children, header, onClose, type, width} = props
  const [documentScrollElement, setDocumentScrollElement] = useState<HTMLDivElement | null>(null)
  const containerElement = useRef<HTMLDivElement | null>(null)
  const {onPathOpen} = useFormCallbacks()
  const {absolutePath, path} = (children as React.ReactElement)?.props as {
    absolutePath?: Path
    path?: Path
  }

  // Absolute paths have the full path including opened key, while path has only the current path
  // This is important for the breadcrumbs to show the correct path
  // Specifically when opening a key in a PTE
  const currentPath = absolutePath || path

  const {dialogId, isTop, stack, close} = useDialogStack({
    path: currentPath,
  })

  const contents = (
    <PresenceOverlay margins={PRESENCE_MARGINS}>
      <Box ref={containerElement} style={{height: 'min(calc(100vh - 200px), 500px)'}}>
        {children}
      </Box>
    </PresenceOverlay>
  )

  // Disable animation when there are nested dialogs (stack > 1)
  const hasNestedDialogs = stack.length > 1

  const handleGlobalKeyDown = useCallback(
    (event: any) => {
      // Only the top dialog should respond to the keyboard shortcut
      if (isTop && (event.metaKey || event.ctrlKey) && event.key === 'ArrowUp') {
        event.preventDefault()

        const lastStackPath = stack[stack.length - 1]?.path

        if (lastStackPath && lastStackPath.length > 1) {
          const newLastStackPath = lastStackPath.slice(0, -1)

          onPathOpen(newLastStackPath)
        }

        if (stack.length === 0) {
          onClose?.()
          close()
        }
      }
    },
    [isTop, stack, onPathOpen, onClose, close],
  )

  const handleClose = useCallback(() => {
    // close() handles all navigation (setting openPath to fullscreen PTE or EMPTY_ARRAY)
    onClose?.()
    close()
  }, [close, onClose])

  useGlobalKeyDown(handleGlobalKeyDown)

  if (type === 'dialog') {
    return (
      <>
        {!isTop && <HiddenDialogStyle dialogId={dialogId} />}
        <VirtualizerScrollInstanceProvider
          scrollElement={documentScrollElement}
          containerElement={containerElement}
        >
          <Dialog
            __unstable_autoFocus={isTop ? props.autofocus : false}
            contentRef={setDocumentScrollElement}
            data-testid="edit-portal-dialog"
            header={<DialogBreadcrumbs currentPath={currentPath} />}
            id={dialogId}
            onClose={handleClose}
            onDragEnter={onDragEnter}
            onDrop={onDrop}
            width={width}
            animate={!hasNestedDialogs}
          >
            {contents}
          </Dialog>
        </VirtualizerScrollInstanceProvider>
      </>
    )
  }

  // For popovers, use inline style since they don't use portals the same way
  const popoverStyle = isTop
    ? undefined
    : {visibility: 'hidden' as const, pointerEvents: 'none' as const}

  return (
    <div style={popoverStyle}>
      <PopoverDialog
        header={header}
        onClose={handleClose}
        referenceElement={props.legacy_referenceElement}
        width={width}
        containerRef={setDocumentScrollElement}
      >
        <VirtualizerScrollInstanceProvider
          scrollElement={documentScrollElement}
          containerElement={containerElement}
        >
          {contents}
        </VirtualizerScrollInstanceProvider>
      </PopoverDialog>
    </div>
  )
}
