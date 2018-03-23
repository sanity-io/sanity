// @flow
import type {Block, SlateChange} from './typeDefs'

import React from 'react'
import {get} from 'lodash'

import DefaultDialog from 'part:@sanity/components/dialogs/default'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import Popover from 'part:@sanity/components/dialogs/popover'
import EditItemFold from 'part:@sanity/components/edititem/fold'

import {FormBuilderInput} from '../../FormBuilderInput'

import styles from './styles/EditNode.css'

type Props = {
  focusPath: [],
  onChange: (change: SlateChange) => void,
  onFocus: (nextPath: []) => void,
  type: Type,
  value: Block[]
}

export default class EditNode extends React.Component<Props> {
  handleChange = patchEvent => {
    const {onChange, value} = this.props
    onChange(patchEvent.prefixAll({_key: value._key}))
  }

  handleClose = () => {
    const {focusPath, onFocus} = this.props
    onFocus(focusPath.slice(0, 1))
  }

  render() {
    const {value, type, onFocus, focusPath} = this.props
    if (!value) {
      return <div>No value???</div>
    }
    const editModalLayout = get(type.options, 'editModal')

    const input = (
      <div style={{minWidth: '30rem', padding: '1rem'}}>
        <FormBuilderInput
          type={type}
          level={1}
          value={value}
          onChange={this.handleChange}
          onFocus={onFocus}
          focusPath={focusPath}
          path={[{_key: value._key}]}
        />
      </div>
    )

    if (editModalLayout === 'fullscreen') {
      return (
        <FullscreenDialog isOpen title="Edit" onClose={this.handleClose}>
          {input}
        </FullscreenDialog>
      )
    }

    if (editModalLayout === 'fold') {
      return (
        <div className={styles.editBlockContainerFold}>
          <EditItemFold isOpen title="Edit" onClose={this.handleClose}>
            {input}
          </EditItemFold>
        </div>
      )
    }

    if (editModalLayout === 'popover') {
      return (
        <div className={styles.editBlockContainerPopOver}>
          <Popover title="@@todo" onClose={this.handleClose} onAction={this.handleDialogAction}>
            {input}
          </Popover>
        </div>
      )
    }
    return (
      <DefaultDialog
        isOpen
        title="Edit"
        onClose={this.handleClose}
        showCloseButton={false}
        onAction={this.handleDialogAction}
      >
        {input}
      </DefaultDialog>
    )
  }
}
