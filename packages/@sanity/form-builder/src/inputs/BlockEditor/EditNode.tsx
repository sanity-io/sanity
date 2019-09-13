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
import {FormBuilderInput} from '../../FormBuilderInput'
import {set, PatchEvent} from '../../PatchEvent'
import {Block, Marker, Type, SlateNode, FormBuilderValue, SlateEditor} from './typeDefs'
import styles from './styles/EditNode.css'
import {Path} from '../../typedefs/path'
import {getKey} from './utils/getKey'
type Props = {
  editor: SlateEditor
  focusPath: Path
  fullscreen: boolean
  markers: Marker[]
  nodeValue: Block
  node: SlateNode
  onFocus: (arg0: Path) => void
  onPatch: (event: PatchEvent) => void
  path: Path
  readOnly?: boolean
  type: Type
  value: FormBuilderValue[] | null
}
export default class EditNode extends React.Component<Props, {}> {
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
        const block = value && value.find(blk => blk._key === getKey(patch.path[0]))
        const _block = {...block} as Block
        const markKey = getKey(patch.path[2])
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
    const {focusPath, onFocus, editor} = this.props
    onFocus(focusPath.slice(0, 1))
    editor.command('focusNoScroll')
  }
  handleDialogAction = () => {
    // NOOP
  }
  renderInput() {
    const {nodeValue, type, onFocus, readOnly, focusPath, path, markers} = this.props
    return (
      <div className={styles.formBuilderInputWrapper}>
        <FormBuilderInput
          // @ts-ignore (fixme: this is another type than the FormBuilderInput expects - turn into an common interface instead)
          type={type}
          level={0}
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
    const {title} = type
    if (editModalLayout === 'fullscreen') {
      return (
        <FullscreenDialog isOpen title={title} onClose={this.handleClose}>
          {this.renderInput()}
        </FullscreenDialog>
      )
    }
    if (editModalLayout === 'fold') {
      return (
        <div className={styles.editBlockContainerFold}>
          <EditItemFold isOpen title={title} onClose={this.handleClose}>
            {this.renderInput()}
          </EditItemFold>
        </div>
      )
    }
    if (editModalLayout === 'popover') {
      return (
        <Popover
          placement="bottom"
          referenceElement={nodeRef}
          onClickOutside={this.handleClose}
          onEscape={this.handleClose}
          onClose={this.handleClose}
          title={title}
          padding="none"
        >
          <DialogContent size="medium" padding="small">
            {this.renderInput()}
          </DialogContent>
        </Popover>
      )
    }
    return (
      <DefaultDialog
        isOpen
        title={title}
        onClose={this.handleClose}
        showCloseButton
        onAction={this.handleDialogAction}
      >
        <DialogContent size="medium">{this.renderInput()}</DialogContent>
      </DefaultDialog>
    )
  }
  render() {
    const {nodeValue} = this.props
    if (!nodeValue) {
      return <div>No value???</div>
    }
    return (
      <div>
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
