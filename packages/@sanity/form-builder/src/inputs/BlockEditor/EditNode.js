// @flow

import React from 'react'
import {get, isEqual} from 'lodash'

import DefaultDialog from 'part:@sanity/components/dialogs/default'
import DialogContent from 'part:@sanity/components/dialogs/content'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import EditItemFold from 'part:@sanity/components/edititem/fold'
import Popover from 'part:@sanity/components/dialogs/popover'
import Stacked from 'part:@sanity/components/utilities/stacked'
import Escapable from 'part:@sanity/components/utilities/escapable'
import {findDOMNode} from 'slate-react'
import {Popper, Arrow} from 'react-popper'
import {FormBuilderInput} from '../../FormBuilderInput'
import {set, PatchEvent} from '../../PatchEvent'

import type {Block, Marker, Path, Type, SlateNode, FormBuilderValue} from './typeDefs'

import styles from './styles/EditNode.css'

type Props = {
  focusPath: Path,
  fullscreen: boolean,
  markers: Marker[],
  nodeValue: Block,
  node: SlateNode,
  onFocus: Path => void,
  onPatch: (event: PatchEvent) => void,
  path: Path,
  readOnly?: boolean,
  type: Type,
  value: ?(FormBuilderValue[])
}

export default class EditNode extends React.Component<Props> {
  static defaultProps = {
    readOnly: false
  }
  handleChange = (patchEvent: PatchEvent) => {
    const {onPatch, path, value, onFocus, focusPath} = this.props
    let _patchEvent = patchEvent
    path
      .slice(0)
      .reverse()
      .forEach(segment => {
        _patchEvent = _patchEvent.prefixAll(segment)
      })
    // Intercept patches that unsets markDefs.
    // The child using the markDef must have that mark removed,
    // so insert patches that rewrite that block without the mark
    _patchEvent.patches.forEach((patch, index) => {
      if (patch.path.length === 3 && patch.path[1] === 'markDefs' && patch.type === 'unset') {
        const block = value && value.find(blk => blk._key === patch.path[0]._key)
        const _block = {...block}
        const markKey = patch.path[2]._key
        _block.children.forEach(child => {
          if (child.marks) {
            child.marks = child.marks.filter(mark => mark !== markKey)
          }
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

  handleDialogAction = () => {
    // NOOP
  }

  renderInput() {
    const {nodeValue, type, onFocus, readOnly, focusPath, path, markers} = this.props
    return (
      <div className={styles.formBuilderInputWrapper}>
        <FormBuilderInput
          type={type}
          level={1}
          readOnly={readOnly || type.readOnly}
          value={nodeValue}
          onChange={this.handleChange}
          onFocus={onFocus}
          focusPath={focusPath}
          path={path}
          markers={markers}
        />
      </div>
    )
  }

  renderWrapper() {
    const {type, node} = this.props
    const nodeRef = findDOMNode(node)
    const editModalLayout = get(type.options, 'editModal')
    if (editModalLayout === 'fullscreen') {
      return (
        <FullscreenDialog isOpen title="Edit" onClose={this.handleClose}>
          {this.renderInput()}
        </FullscreenDialog>
      )
    }
    if (editModalLayout === 'fold') {
      return (
        <div className={styles.editBlockContainerFold}>
          <EditItemFold isOpen title="Edit" onClose={this.handleClose}>
            {this.renderInput()}
          </EditItemFold>
        </div>
      )
    }
    if (editModalLayout === 'popover') {
      return (
        <Popper placement="bottom" target={nodeRef}>
          <Popover>{this.renderInput()}</Popover>
        </Popper>
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
        <DialogContent size="medium">{this.renderInput()}</DialogContent>
      </DefaultDialog>
    )
  }

  render() {
    const {nodeValue, fullscreen} = this.props
    if (!nodeValue) {
      return <div classNames={styles.root}>No value???</div>
    }
    return (
      <div className={[styles.root, fullscreen ? styles.fullscreen : null].join(' ')}>
        <Stacked>
          {isActive => (
            <div>
              <Escapable onEscape={event => isActive && this.handleClose()} />
              {this.renderWrapper()}
            </div>
          )}
        </Stacked>
      </div>
    )
  }
}
