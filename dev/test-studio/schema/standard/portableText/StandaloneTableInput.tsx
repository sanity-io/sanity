import {isKeySegment, type Path} from '@sanity/types'
import {Button, Stack} from '@sanity/ui'
import {useCallback, useMemo} from 'react'
import {
  type FormPatch,
  type ObjectInputProps,
  PatchEvent,
  PortableTextInput,
  set,
  useSchema,
} from 'sanity'

/**
 * POC (EDEX-scoped, test-studio only): renders a standalone `standaloneTable`
 * object field as a Portable Text editor in disguise. The editor sees a
 * one-element array wrapping the field's object under a synthetic block
 * key; patches emitted by the editor are re-rooted onto the object by
 * stripping that synthetic prefix. The PT configuration (table plugin
 * binding, one-block behaviors, cell-shaped toolbar options) lives on the
 * hidden `standaloneTableArray` type, whose compiled schema this input
 * borrows.
 */
const ROOT_KEY = 'standalone-table-root'

export function StandaloneTableInput(props: ObjectInputProps) {
  const schema = useSchema()
  const arraySchemaType = schema.get('standaloneTableArray')

  const editorValue = useMemo(
    () => (props.value ? [{_type: 'standaloneTable', ...props.value, _key: ROOT_KEY}] : undefined),
    [props.value],
  )

  const handleChange = useCallback(
    (change: PatchEvent | FormPatch | FormPatch[]) => {
      const patches = change instanceof PatchEvent ? change.patches : [change].flat()
      const translated: FormPatch[] = []
      for (const patch of patches) {
        const [head, ...rest] = patch.path
        if (patch.path.length === 0) {
          // Whole-array bookkeeping (`setIfMissing([])`, `unset([])`) has
          // no meaning on the object; the wrapper owns the array illusion.
          continue
        }
        if (isKeySegment(head) && head._key === ROOT_KEY) {
          if (rest.length === 0) {
            if (patch.type === 'set' && patch.value && typeof patch.value === 'object') {
              const {_key, ...objectValue} = patch.value as Record<string, unknown>
              translated.push(set(objectValue))
            }
            // `unset` of the whole block would clear the field; the
            // one-block behaviors are meant to prevent it, so dropping it
            // here keeps the POC observable when they don't.
            continue
          }
          translated.push({...patch, path: rest} as FormPatch)
        }
        // Root-level inserts (scaffolding a sibling) are denied by the
        // one-block behaviors; anything that slips through is dropped
        // rather than corrupting the object.
      }
      if (translated.length > 0) {
        props.onChange(translated)
      }
    },
    [props],
  )

  const handleInsertTable = useCallback(() => {
    const keyGenerator = () => Math.random().toString(36).slice(2, 10)
    const emptyBlock = () => ({
      _type: 'block',
      _key: keyGenerator(),
      style: 'normal',
      markDefs: [],
      children: [{_type: 'span', _key: keyGenerator(), text: '', marks: []}],
    })
    const cell = () => ({_type: 'cell', _key: keyGenerator(), value: [emptyBlock()]})
    const row = () => ({
      _type: 'row',
      _key: keyGenerator(),
      cells: [cell(), cell(), cell()],
    })
    props.onChange(set({_type: 'standaloneTable', headerRows: 1, rows: [row(), row(), row()]}))
  }, [props])

  if (!props.value) {
    return (
      <Stack space={2}>
        <Button mode="ghost" onClick={handleInsertTable} text="Insert table" />
      </Stack>
    )
  }

  if (!arraySchemaType) {
    return null
  }

  const portableTextProps = {
    ...props,
    schemaType: arraySchemaType,
    value: editorValue,
    onChange: handleChange,
    // The object form state has field members, not array item members;
    // the PT input's member items degrade gracefully to none (dialogs
    // and per-item chrome), which is acceptable for the POC.
    members: [],
    onItemOpen: () => {},
    onItemClose: () => {},
    onItemRemove: () => {},
    onPathFocus: (path: Path) => props.onPathFocus(path),
    // POC: the wrapper feigns array input props.
  } as any

  return (
    <div data-standalone-table="">
      {/* A standalone table shouldn't present as a general-purpose rich
          text field: the insert menu (whose only offering would be the
          table itself) and the fullscreen toggle are hidden, and the
          editable loses its prose min-height. */}
      <style>{`
        [data-standalone-table] [data-testid="insert-menu-button"],
        [data-standalone-table] [data-testid="insert-menu-auto-collapse-menu"],
        [data-standalone-table] [data-testid$="-insert-menu-button"],
        [data-standalone-table] [data-testid="fullscreen-button-expand"] {
          display: none;
        }
        /* No editor frame: the field is a toolbar sitting above a bare
           table, not a rich text surface. The pt-editor Root is a Card
           with a min-height and vertical resize; its parent draws the
           input border. */
        [data-standalone-table] [data-testid="pt-editor"] {
          min-height: 0 !important;
          resize: none !important;
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
        }
        [data-standalone-table] :has(> [data-testid="pt-editor"]) {
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
          --card-border-color: transparent;
        }
        [data-standalone-table] [data-testid="pt-editor__toolbar-card"] {
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
        }
        [data-standalone-table] [data-testid="pt-editor"] [data-ui="Card"] {
          background: transparent !important;
        }
        [data-standalone-table] [role="textbox"] {
          padding: 0 !important;
          min-height: 0 !important;
        }
      `}</style>
      <PortableTextInput {...portableTextProps} />
    </div>
  )
}
