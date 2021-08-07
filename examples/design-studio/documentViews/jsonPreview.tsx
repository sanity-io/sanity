// @todo: remove the following line when part imports has been removed from this file
///<reference types="@sanity/types/parts" />

import React from 'react'
import schema from 'part:@sanity/base/schema'
import {JasonTheme, ReactJason, sanityItemKeyGenerator} from 'react-jason'
import github from 'react-jason/themes/github'
import {sanityKeySort} from './keySorter'
import styles from './jsonPreview.css'

const theme: JasonTheme = {...github, classes: {root: styles.root}}
const keySorter = sanityKeySort(schema)

export function JSONPreviewDocumentView(props: any) {
  return (
    <ReactJason
      value={props.document.displayed}
      theme={theme}
      itemKeyGenerator={sanityItemKeyGenerator}
      quoteAttributes={false}
      sortKeys={keySorter}
    />
  )
}
