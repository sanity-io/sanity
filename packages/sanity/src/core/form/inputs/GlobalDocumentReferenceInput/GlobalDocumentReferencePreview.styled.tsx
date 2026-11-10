import {clsx} from 'clsx'
import {type ComponentProps} from 'react'
import {Flex} from 'ui5'

import {previewFlex} from './GlobalDocumentReferencePreview.css'

export function StyledPreviewFlex(props: ComponentProps<typeof Flex>) {
  const {className, ...rest} = props

  return <Flex {...rest} className={clsx(previewFlex, className)} />
}
