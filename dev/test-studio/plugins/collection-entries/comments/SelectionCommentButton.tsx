import {type Editor, type EditorSelection, useEditor} from '@portabletext/editor'
import {AddCommentIcon} from '@sanity/icons/AddComment'
import {Button} from '@sanity/ui'
import {Popover, type PopoverProps} from '@sanity/ui/popover'
import {type MouseEvent, useMemo} from 'react'

const FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = ['top', 'bottom-start']

// Popover positioning only reads the rect, and reads it again on scroll, so the button follows the text.
function createSelectionReference(editor: Editor, selection: EditorSelection): HTMLElement {
  let lastRect = new DOMRect()
  const reference: Pick<HTMLElement, 'getBoundingClientRect'> = {
    getBoundingClientRect: () => {
      const snapshot = editor.getSnapshot()
      lastRect =
        editor.dom.getSelectionRect({...snapshot, context: {...snapshot.context, selection}}) ??
        lastRect
      return lastRect
    },
  }
  // oxlint-disable-next-line no-unsafe-type-assertion -- Floating UI takes a virtual element; the Popover prop type only names HTMLElement.
  return reference as HTMLElement
}

// Keeps the editor focused, so its selection is still the comment's anchor when the click lands.
function keepEditorFocus(event: MouseEvent) {
  event.preventDefault()
}

interface SelectionCommentButtonProps {
  selection: EditorSelection
  onClick: () => void
}

export function SelectionCommentButton({selection, onClick}: SelectionCommentButtonProps) {
  const editor = useEditor()
  const reference = useMemo(() => createSelectionReference(editor, selection), [editor, selection])

  return (
    <Popover
      open
      padding={1}
      placement="bottom"
      fallbackPlacements={FALLBACK_PLACEMENTS}
      referenceElement={reference}
      content={
        <Button
          icon={AddCommentIcon}
          mode="bleed"
          text="Comment"
          onMouseDown={keepEditorFocus}
          onClick={onClick}
        />
      }
    />
  )
}
