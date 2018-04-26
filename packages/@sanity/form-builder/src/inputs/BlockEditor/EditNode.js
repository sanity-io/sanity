// @flow
import type {Block, Marker} from './typeDefs'

import React from 'react'
import {get} from 'lodash'

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
    const {onPatch, path, value} = this.props
    let _patchEvent = patchEvent
    path.reverse().forEach(segment => {
      _patchEvent = _patchEvent.prefixAll(segment)
    })
    // Intercept patches that unsets markDefs.
    // The node using the markDef must have that mark removed,
    // so create patches that rewrite that block without the mark
    const unsetMarkDefPatches = _patchEvent.patches.filter(
      patch => patch.path[1] === 'markDefs' && patch.type === 'unset'
    )
    if (unsetMarkDefPatches.length) {
      unsetMarkDefPatches.forEach(patch => {
        const block = value.find(blk => blk._key === patch.path[0]._key)
        const _block = {...block}
        const markKey = patch.path.slice(-1)[0]._key
        _block.children.forEach(child => {
          if (child._type === 'span' && child.marks.includes(markKey)) {
            child.marks = child.marks.filter(mark => mark !== markKey)
          }
        })
        _patchEvent.patches.push(set(_block, [{_key: _block._key}]))
      })
    }
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
        showCloseButton={false}
        onAction={this.handleDialogAction}
      >
        {input}
      </DefaultDialog>
    )
  }
}
