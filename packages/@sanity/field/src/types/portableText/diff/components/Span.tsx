import React from 'react'
import {PortableTextChild, PortableTextBlock} from '../types'
import {AnnotatedStringDiff, DiffAnnotation, ObjectDiff, StringDiff} from '../../../../diff'
import styles from './Span.css'

type Props = {
  block: PortableTextBlock
  diff?: ObjectDiff
  // eslint-disable-next-line react/no-unused-prop-types
  blockDiff?: ObjectDiff
  span: PortableTextChild
}

// eslint-disable-next-line complexity
export default function Span(props: Props): JSX.Element {
  const {block, diff, span} = props
  let returned = <>{span.text}</>
  if (span.text === '' && block.children.length === 1) {
    if (diff && diff.action !== 'unchanged') {
      const didRemove = diff.action === 'removed'
      returned = (
        <span className={styles.empty}>
          <DiffAnnotation
            annotation={diff.annotation}
            as={didRemove ? 'del' : 'ins'}
            description={`${didRemove ? 'Removed' : 'Added'} empty text`}
          >
            &crarr;
          </DiffAnnotation>
        </span>
      )
    } else {
      returned = <span className={styles.empty}>&crarr;</span>
    }
  } else if (diff) {
    const textDiff = diff.fields.text as StringDiff
    if (textDiff && textDiff.isChanged) {
      returned = <AnnotatedStringDiff diff={textDiff} />
    }
  }
  return <span className={styles.root}>{returned}</span>
}
