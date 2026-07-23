import {Card, Stack, Text} from '@sanity/ui'
import {type ReactElement, useEffect, useMemo, useRef} from 'react'
import {type ObjectInputProps, PatchEvent, PortableTextInput, set, setIfMissing} from 'sanity'

import {isEmptyTable, scaffoldRows, type StandaloneTableValue, TABLE_SHAPE} from '../helpers'
import {synthesizeArrayInputProps, useSyntheticArraySchemaType} from './SyntheticArrayMemberBridge'

/**
 * Spike R1 input — the standalone table object edited through Studio's *real*
 * {@link PortableTextInput}, wired via {@link synthesizeArrayInputProps}.
 *
 * Compare with the sibling `StandaloneTableInput` (the POC), which mounts a
 * bare `EditorProvider`. Both attach through `components.input`; the schema
 * exposes them side by side (two fields on the `standaloneTable` document) so
 * the chrome delta is directly observable. See SPIKE-NOTES.md for the verdict.
 *
 * Everything table-specific is in the bridge. This component only:
 *  1. scaffolds an empty field to a 3×3 grid (same form-patch approach as the
 *     POC, so an empty table isn't a blank editor);
 *  2. builds the synthetic array schema type once;
 *  3. spreads the synthesized props into `PortableTextInput`.
 */

const SCAFFOLD_ROWS = 3
const SCAFFOLD_COLS = 3

let keySeq = 0
function keyGenerator(): string {
  keySeq += 1
  return `r1k${keySeq.toString(36)}${(keySeq * 2654435761).toString(36).slice(-4)}`
}

export function StandaloneTableInputR1(
  props: ObjectInputProps<StandaloneTableValue>,
): ReactElement {
  const {value, onChange, readOnly, elementProps, schemaType} = props

  const scaffoldingRef = useRef(false)

  // Scaffold an empty field to a 3×3 grid (and re-scaffold after delete-all),
  // via granular form patches — identical rationale to the POC input.
  useEffect(() => {
    if (readOnly || !isEmptyTable(value) || scaffoldingRef.current) {
      return
    }
    scaffoldingRef.current = true
    const rows = scaffoldRows(SCAFFOLD_ROWS, SCAFFOLD_COLS, keyGenerator)
    onChange(
      PatchEvent.from([
        setIfMissing({_type: TABLE_SHAPE.table.type}, []),
        set(rows, [TABLE_SHAPE.table.arrayField]),
      ]),
    )
  }, [readOnly, value, onChange])

  useEffect(() => {
    if (!isEmptyTable(value)) {
      scaffoldingRef.current = false
    }
  }, [value])

  const syntheticSchemaType = useSyntheticArraySchemaType(schemaType)
  const ptProps = useMemo(
    () => synthesizeArrayInputProps(props, syntheticSchemaType),
    [props, syntheticSchemaType],
  )

  return (
    <Card border radius={2} padding={3} data-testid={`standalone-table-r1-${elementProps.id}`}>
      <Stack space={3}>
        <Text size={1} muted>
          Standalone table — route 1 (real PortableTextInput)
        </Text>
        <PortableTextInput {...ptProps} />
      </Stack>
    </Card>
  )
}
