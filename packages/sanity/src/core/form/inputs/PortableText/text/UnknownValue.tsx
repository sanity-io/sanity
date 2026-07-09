import {type SpanRenderProps, useEditor} from '@portabletext/editor'
import {getSanitySubSchema} from '@portabletext/sanity-bridge'
import {isPortableTextTextBlock} from '@sanity/types'
import {toString as pathToString} from '@sanity/util/paths'
import {type ReactNode} from 'react'
import {styled} from 'styled-components'

import {Tooltip} from '../../../../../ui-components'
import {getValueAtPath} from '../../../../field'
import {useListFormat} from '../../../../hooks'
import {useTranslation} from '../../../../i18n'
import {usePortableTextMemberSchemaTypes} from '../contexts/PortableTextMemberSchemaTypes'
import {warnOnce} from '../warnOnce'

const Root = styled.span`
  border: 1px dotted var(--card-muted-fg-color);
  border-radius: 2px;
`

export function UnknownValue(props: {label: string; block?: boolean; children: ReactNode}) {
  return (
    <Tooltip content={props.label} placement="top" portal>
      <Root as={props.block ? 'div' : 'span'} data-testid="unknown-value">
        {props.children}
      </Root>
    </Tooltip>
  )
}

export function UnknownMarks(props: SpanRenderProps) {
  const schemaTypes = usePortableTextMemberSchemaTypes()
  const {t} = useTranslation()
  const listFormat = useListFormat()
  const editor = useEditor()

  const marks = props.node.marks ?? []
  const labels: string[] = []

  if (marks.length > 0) {
    // Spans can sit inside containers (for example table cells), so both the
    // member types and the containing block are resolved by path, not from
    // the document root.
    const value = editor.getSnapshot().context.value
    const subSchema = getSanitySubSchema(schemaTypes.portableText, value, props.path)
    const block = getValueAtPath(value, props.path.slice(0, -2))
    const markDefs = isPortableTextTextBlock(block) ? (block.markDefs ?? []) : []

    for (const mark of marks) {
      if (subSchema.decorators.some((decorator) => decorator.value === mark)) {
        continue
      }
      const markDef = markDefs.find((candidate) => candidate._key === mark)
      if (markDef) {
        if (!subSchema.annotations.some((annotation) => annotation.name === markDef._type)) {
          warnOnce(
            `Could not find schema type for annotation: ${markDef._type} at ${pathToString(props.path)}`,
          )
          labels.push(t('inputs.portable-text.unknown-value.annotation', {name: markDef._type}))
        }
        continue
      }
      warnOnce(`Could not find schema type for mark: ${mark} at ${pathToString(props.path)}`)
      labels.push(t('inputs.portable-text.unknown-value.mark', {name: mark}))
    }
  }

  if (labels.length === 0) {
    return props.renderDefault(props)
  }

  return props.renderDefault({
    ...props,
    children: <UnknownValue label={listFormat.format(labels)}>{props.children}</UnknownValue>,
  })
}
