import {Box} from '@sanity/ui'
import {ReactNode} from 'react'
import {FieldPreviewComponent} from '../../preview'
import {Diff, DiffComponent} from '../../types'
import {Preview} from '../../../preview/components/Preview'
import {DiffFromTo} from './DiffFromTo'

const FallbackPreview: FieldPreviewComponent<ReactNode> = ({value, schemaType}) => {
  return (
    <Box padding={2}>
      <Preview schemaType={schemaType} value={value as any} layout="default" />
    </Box>
  )
}

/** @internal */
export const FallbackDiff: DiffComponent<Diff<unknown, Record<string, unknown>>> = (props) => {
  const {diff, schemaType} = props

  return (
    <DiffFromTo
      diff={diff}
      schemaType={schemaType}
      previewComponent={FallbackPreview}
      layout="grid"
    />
  )
}
