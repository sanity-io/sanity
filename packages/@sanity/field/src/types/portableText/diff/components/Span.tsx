import React from 'react'
import {PortableTextChild, PortableTextBlock} from '../types'
import {AnnotatedStringDiff, ObjectDiff, StringDiff} from '../../../../diff'

import styles from './Span.css'

type Props = {
  block: PortableTextBlock
  diff?: ObjectDiff
  span: PortableTextChild
}
export default function Span(props: Props) {
  const {diff, span} = props
  let returned = <>{span.text}</>
  if (span.text === '') {
    returned = <span className={styles.empty}>&nbsp;</span>
  } else if (diff) {
    const textDiff = diff.fields.text as StringDiff
    if (textDiff && textDiff.isChanged) {
      returned = <AnnotatedStringDiff diff={textDiff} />
    }
  }
  return <span className={styles.root}>{returned}</span>
}
