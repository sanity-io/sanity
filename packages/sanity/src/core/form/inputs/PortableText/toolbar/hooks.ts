import {
  type HotkeyOptions,
  PortableTextEditor,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@sanity/portable-text-editor'
import {
  type ObjectSchemaType,
  type Path,
  type PortableTextBlock,
  type PortableTextChild,
} from '@sanity/types'
import {useCallback, useMemo} from 'react'

import {type FIXME} from '../../../../FIXME'
import {useTranslation} from '../../../../i18n'
import {useUnique} from '../../../../util'
import {getPTEToolbarActionGroups} from './helpers'
import {type BlockStyleItem, type PTEToolbarAction, type PTEToolbarActionGroup} from './types'

export function useFocusBlock(): PortableTextBlock | undefined {
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => PortableTextEditor.focusBlock(editor), [editor, selection]) // selection must be an additional dep here
}

export function useFocusChild(): PortableTextChild | undefined {
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => PortableTextEditor.focusChild(editor), [editor, selection]) // selection must be an additional dep here
}

export function useActionGroups({
  hotkeys,
  onMemberOpen,
  resolveInitialValue,
  disabled,
}: {
  hotkeys: HotkeyOptions
  onMemberOpen: (relativePath: Path) => void
  resolveInitialValue: (type: ObjectSchemaType) => FIXME
  disabled: boolean
}): PTEToolbarActionGroup[] {
  const editor = usePortableTextEditor()
  const {t} = useTranslation()

  const handleInsertAnnotation = useCallback(
    async (schemaType: ObjectSchemaType) => {
      const initialValue = await resolveInitialValue(schemaType)
      const paths = PortableTextEditor.addAnnotation(editor, schemaType, initialValue)
      if (paths && paths.markDefPath) {
        onMemberOpen(paths.markDefPath)
      }
    },
    [editor, onMemberOpen, resolveInitialValue],
  )

  return useMemo(
    () =>
      editor ? getPTEToolbarActionGroups(editor, disabled, handleInsertAnnotation, hotkeys, t) : [],
    [disabled, editor, handleInsertAnnotation, hotkeys, t],
  )
}

export function useActiveActionKeys({
  actions,
}: {
  actions: Array<PTEToolbarAction & {firstInGroup?: true}>
}): string[] {
  const editor = usePortableTextEditor()
  const selection = usePortableTextEditorSelection()

  return useUnique(
    useMemo(
      () => {
        return actions
          .filter((a) => {
            if (a.type === 'annotation') {
              return PortableTextEditor.isAnnotationActive(editor, a.key)
            }

            if (a.type === 'listStyle') {
              return PortableTextEditor.hasListStyle(editor, a.key)
            }

            return PortableTextEditor.isMarkActive(editor, a.key)
          })
          .map((a) => a.key)
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [
        editor,
        // This is needed so that active actions update as `selection` changes
        selection,
      ],
    ),
  )
}

export function useActiveStyleKeys({items}: {items: BlockStyleItem[]}): string[] {
  const editor = usePortableTextEditor()
  const focusBlock = useFocusBlock()
  const selection = usePortableTextEditorSelection()

  return useUnique(
    useMemo(
      () =>
        items.filter((i) => PortableTextEditor.hasBlockStyle(editor, i.style)).map((i) => i.style),
      //  eslint-disable-next-line react-hooks/exhaustive-deps
      [
        focusBlock,
        // This is needed so that active styles update as `selection` changes
        selection,
      ],
    ),
  )
}
