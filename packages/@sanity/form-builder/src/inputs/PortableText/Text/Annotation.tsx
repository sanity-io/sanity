/* eslint-disable react/prop-types */
import React, {FunctionComponent, SyntheticEvent} from 'react'
import classNames from 'classnames'
import {PortableTextChild, Type, RenderAttributes} from '@sanity/portable-text-editor'
import {ChangeIndicatorWithProvidedFullPath} from '@sanity/base/lib/change-indicators'

import {FOCUS_TERMINATOR} from '@sanity/util/paths'
import {Path, Marker, isValidationErrorMarker} from '@sanity/types'
import {PatchEvent} from '../../../PatchEvent'

import styles from './Annotation.css'

type Props = {
  value: PortableTextChild
  type: Type
  children: JSX.Element
  attributes: RenderAttributes
  readOnly: boolean
  markers: Marker[]
  onFocus: (arg0: Path) => void
  onChange: (patchEvent: PatchEvent, path: Path) => void
}

export const Annotation: FunctionComponent<Props> = ({
  children,
  markers,
  attributes: {focused, selected, path},
  value,
  onFocus
}) => {
  const errors = markers.filter(isValidationErrorMarker)
  const classnames = classNames([
    styles.root,
    focused && styles.focused,
    selected && styles.selected,
    errors.length > 0 ? styles.error : styles.valid
  ])

  const handleOpen = (event: SyntheticEvent<HTMLSpanElement>): void => {
    event.preventDefault()
    event.stopPropagation()
    onFocus([...path.slice(0, 1), 'markDefs', {_key: value._key}, FOCUS_TERMINATOR])
  }
  return (
    <span className={classnames} onClick={handleOpen}>
      {children}
      <ChangeIndicatorWithProvidedFullPath
        className={styles.changeIndicator}
        compareDeep
        value={value}
        hasFocus={focused}
        path={path}
        hidden
      />
    </span>
  )
}
