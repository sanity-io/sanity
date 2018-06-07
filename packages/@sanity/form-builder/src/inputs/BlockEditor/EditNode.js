// @flow
import type {Block, Marker} from './typeDefs'

import React from 'react'
import {get, isEqual} from 'lodash'

import DefaultDialog from 'part:@sanity/components/dialogs/default'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import Popover from 'part:@sanity/components/dialogs/popover'
import EditItemFold from 'part:@sanity/components/edititem/fold'

import {FormBuilderInput} from '../../FormBuilderInput'
import {set} from '../../PatchEvent'

import styles from './styles/EditNode.css'

type Props = {
  focusPath: [],
  markers: Marker[],
  nodeValue: Block,
  onFocus: (nextPath: []) => void,
  onPatch: (event: PatchEvent) => void,
  path: [],
  type: Type,
  value: Block[]
}

export default class EditNode extends React.Component<Props> {
  handleChange = patchEvent => {
    const {onPatch, path, value, onFocus, focusPath} = this.props
    let _patchEvent = patchEvent
    path.reverse().forEach(segment => {
      _patchEvent = _patchEvent.prefixAll(segment)
    })
    // Intercept patches that unsets markDefs.
    // The child using the markDef must have that mark removed,
    // so insert patches that rewrite that block without the mark
    _patchEvent.patches.forEach((patch, index) => {
      if (patch.path.length === 3 && patch.path[1] === 'markDefs' && patch.type === 'unset') {
        const block = value.find(blk => blk._key === patch.path[0]._key)
        const _block = {...block}
        const markKey = patch.path[2]._key
        _block.children.forEach(child => {
          child.marks = child.marks.filter(mark => mark !== markKey)
        })
        const blockPath = [{_key: _block._key}]
        _block.markDefs = _block.markDefs.filter(def => def._key !== markKey)
        _patchEvent.patches.splice(index + 1, 0, set(_block, blockPath))
        // Set focus away from the annotation, and to the block itself
        if (focusPath && isEqual(patch.path, focusPath.slice(0, patch.path.length))) {
          onFocus(blockPath)
        }
      }
    })
    onPatch(_patchEvent)
  }

  handleClose = () => {
    const {focusPath, onFocus} = this.props
    onFocus(focusPath.slice(0, 1))
  }

  render() {
    const {nodeValue, type, onFocus, focusPath, path, markers} = this.props
    if (!nodeValue) {
      return <div>No value???</div>
    }
    const editModalLayout = get(type.options, 'editModal')

    const input = (
      <div style={{minWidth: '30rem', padding: '1rem'}}>
        <FormBuilderInput
          type={type}
          level={1}
          value={nodeValue}
          onChange={this.handleChange}
          onFocus={onFocus}
          focusPath={focusPath}
          path={path}
          markers={markers}
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
        showCloseButton
        onAction={this.handleDialogAction}
      >
        {input}
      </DefaultDialog>
    )
  }
}
