import {LayerProvider} from '@sanity/ui'
import DropdownButton from 'part:@sanity/components/buttons/dropdown'
import Dialog from 'part:@sanity/components/dialogs/default'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import PopoverDialog from 'part:@sanity/components/dialogs/popover'
import React, {useCallback, useState} from 'react'
import {DialogAction} from '../../types'

export function NestedStory() {
  return (
    <LayerProvider>
      <DialogExample />
    </LayerProvider>
  )
}

function DialogExample() {
  const [open2, setOpen2] = useState(false)
  const [open3, setOpen3] = useState(false)
  const [open4, setOpen4] = useState(false)
  const [open5, setOpen5] = useState(false)

  const handleAction = useCallback((action: DialogAction) => {
    if (action.action) action.action()
  }, [])

  const [refElement, setRefElement] = useState<HTMLElement | null>(null)

  return (
    <Dialog
      actions={[{title: 'Open Dialog 2', action: () => setOpen2(true)}]}
      onAction={handleAction}
      size="large"
      title="Dialog 1"
    >
      <DropdownButton
        items={[{title: 'Hello'}, {title: 'Hello'}, {title: 'Hello'}]}
        onAction={() => undefined}
      >
        Test
      </DropdownButton>

      {open2 && (
        <Dialog
          actions={[{title: 'Open Dialog 3', action: () => setOpen3(true)}]}
          onAction={handleAction}
          onClose={() => setOpen2(false)}
          onClickOutside={() => setOpen2(false)}
          size="medium"
          title="Dialog 2"
        >
          <DropdownButton
            items={[{title: 'Hello'}, {title: 'Hello'}, {title: 'Hello'}]}
            onAction={() => undefined}
          >
            Test
          </DropdownButton>

          {open3 && (
            <Dialog
              actions={[{title: 'Open Dialog 4', action: () => setOpen4(true)}]}
              onAction={handleAction}
              onClickOutside={() => setOpen3(false)}
              onClose={() => setOpen3(false)}
              onEscape={() => setOpen3(false)}
              size="small"
              title="Dialog 3"
            >
              <DropdownButton
                items={[{title: 'Hello'}, {title: 'Hello'}, {title: 'Hello'}]}
                onAction={() => undefined}
              >
                Test
              </DropdownButton>

              {open4 && (
                <FullscreenDialog
                  onClickOutside={() => setOpen4(false)}
                  onClose={() => setOpen4(false)}
                  onEscape={() => setOpen4(false)}
                  title="Dialog 4"
                >
                  <DropdownButton
                    items={[{title: 'Hello'}, {title: 'Hello'}, {title: 'Hello'}]}
                    onAction={() => undefined}
                  >
                    Test
                  </DropdownButton>

                  <button onClick={() => setOpen5(true)} ref={setRefElement} type="button">
                    Open popover dialog
                  </button>
                  {open5 && (
                    <PopoverDialog
                      onClickOutside={() => setOpen5(false)}
                      onClose={() => setOpen5(false)}
                      onEscape={() => setOpen5(false)}
                      portal
                      referenceElement={refElement}
                    >
                      <DropdownButton
                        items={[{title: 'Hello'}, {title: 'Hello'}, {title: 'Hello'}]}
                        onAction={() => undefined}
                      >
                        Test
                      </DropdownButton>
                    </PopoverDialog>
                  )}
                </FullscreenDialog>
              )}
            </Dialog>
          )}
        </Dialog>
      )}
    </Dialog>
  )
}
