import {Button} from '@sanity/ui'
import {type PortableTextInputProps, set} from 'sanity'

const TABLE_SIZE = 3

/**
 * The standalone table field is a Portable Text array constrained to a
 * single table block (see `standaloneTable.tsx`). Storage is the real
 * array, so patches, comments, presence, and focus paths all flow through
 * Studio's own machinery untranslated; this input only adjusts the
 * surface: an empty field renders a seed button instead of an empty
 * editor, and a populated field renders the default Portable Text input
 * with the writing-surface chrome stripped away.
 */
export function StandaloneTableInput(props: PortableTextInputProps) {
  if (!props.value || props.value.length === 0) {
    return (
      <Button
        mode="ghost"
        text="Insert table"
        onClick={() => props.onChange(set([scaffoldTable()]))}
      />
    )
  }

  return (
    <div data-standalone-table="">
      {/* A standalone table is not a long writing surface; no fullscreen.
          The insert menu stays: it offers the cell members (image), with
          the table item itself permanently disabled by positional gating
          since the caret always sits inside a cell. Further de-chroming is
          deferred to a real presentation option; CSS overrides fought the
          theme and lost. */}
      <style>{`
        [data-standalone-table] [data-testid="fullscreen-button-expand"] {
          display: none;
        }
      `}</style>
      {props.renderDefault({
        ...props,
        // A standalone table is not a long writing surface; never gate it
        // behind the activate-on-focus overlay.
        initialActive: true,
      })}
    </div>
  )
}

function scaffoldTable() {
  return {
    _type: 'standaloneTable',
    _key: randomKey(),
    headerRows: 1,
    rows: Array.from({length: TABLE_SIZE}, () => ({
      _type: 'row',
      _key: randomKey(),
      cells: Array.from({length: TABLE_SIZE}, () => ({
        _type: 'cell',
        _key: randomKey(),
        value: [
          {
            _type: 'block',
            _key: randomKey(),
            style: 'normal',
            markDefs: [],
            children: [{_type: 'span', _key: randomKey(), text: '', marks: []}],
          },
        ],
      })),
    })),
  }
}

function randomKey() {
  return Math.random().toString(36).slice(2, 10)
}
