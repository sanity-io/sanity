import {
  type HotkeyOptions,
  PortableTextEditor,
  usePortableTextEditor,
  usePortableTextEditorSelection,
} from '@portabletext/editor'
import {
  type ObjectSchemaType,
  type Path,
  type PortableTextBlock,
  type PortableTextChild,
} from '@sanity/types'
import {useCallback, useMemo} from 'react'

import {type FIXME} from '../../../../FIXME'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {useUnique} from '../../../../util/useUnique'
import {usePortableTextMemberSchemaTypes} from '../contexts/PortableTextMemberSchemaTypes'
import {getPTEToolbarActionGroups} from './helpers'
import {type BlockStyleItem, type PTEToolbarAction, type PTEToolbarActionGroup} from './types'
import {useApplicableSchema} from './useApplicableSchema'

export function useFocusBlock(): PortableTextBlock | undefined {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const editor = usePortableTextEditor()
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const selection = usePortableTextEditorSelection()

  return useMemo(
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    () => (selection ? PortableTextEditor.focusBlock(editor) : undefined),
    [editor, selection],
  )
}

function useFocusChild(): PortableTextChild | undefined {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const editor = usePortableTextEditor()
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const selection = usePortableTextEditorSelection()

  return useMemo(
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    () => (selection ? PortableTextEditor.focusChild(editor) : undefined),
    [editor, selection],
  )
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
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const editor = usePortableTextEditor()
  const schemaTypes = usePortableTextMemberSchemaTypes()
  const applicable = useApplicableSchema()
  const {t} = useTranslation()

  const handleInsertAnnotation = useCallback(
    async (schemaType: ObjectSchemaType) => {
      const initialValue = await resolveInitialValue(schemaType)
      // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
      const paths = PortableTextEditor.addAnnotation(editor, schemaType, initialValue)
      const markDefPath = paths?.markDefPaths[0]
      if (markDefPath) {
        onMemberOpen(markDefPath)
      }
    },
    [editor, onMemberOpen, resolveInitialValue],
  )

  return useMemo(
    () =>
      editor
        ? getPTEToolbarActionGroups(editor, {
            schemaTypes,
            disabled,
            applicable,
            onInsertAnnotation: handleInsertAnnotation,
            hotkeyOpts: hotkeys,
            t,
          })
        : [],
    [applicable, disabled, editor, schemaTypes, handleInsertAnnotation, hotkeys, t],
  )
}

export function useActiveActionKeys({
  actions,
}: {
  actions: Array<PTEToolbarAction & {firstInGroup?: true}>
}): string[] {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const editor = usePortableTextEditor()
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const selection = usePortableTextEditorSelection()

  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  return useUnique(
    useMemo(() => {
      return selection
        ? actions
            .filter((a) => {
              if (a.type === 'annotation') {
                // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
                return PortableTextEditor.isAnnotationActive(editor, a.key)
              }

              if (a.type === 'listStyle') {
                // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
                return PortableTextEditor.hasListStyle(editor, a.key)
              }

              // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
              return PortableTextEditor.isMarkActive(editor, a.key)
            })
            .map((a) => a.key)
        : []
    }, [actions, editor, selection]),
  )
}

export function useActiveStyleKeys({items}: {items: BlockStyleItem[]}): string[] {
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const editor = usePortableTextEditor()
  const focusBlock = useFocusBlock()
  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  const selection = usePortableTextEditorSelection()

  // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
  return useUnique(
    useMemo(
      () =>
        focusBlock && selection
          ? items
              // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
              .filter((i) => PortableTextEditor.hasBlockStyle(editor, i.style))
              .map((i) => i.style)
          : [],
      [editor, focusBlock, items, selection],
    ),
  )
}
