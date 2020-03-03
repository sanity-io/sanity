import React from 'react'
import randomKey from './randomKey'
import {Type} from '@sanity/form-builder/lib/typedefs'
import {resolveTypeName} from '@sanity/form-builder/lib/utils/resolveTypeName'
import {PatchEvent} from '@sanity/form-builder/lib/PatchEvent'
import {setIfMissing, set, insert} from '@sanity/form-builder/lib/PatchEvent'
import {FormBuilderInput} from '@sanity/form-builder/lib/FormBuilderInput'
import {Modal} from '../components/Modal'

export const ArrayItem = React.memo(
  React.forwardRef((props, ref) => {
    const {type, value, level, focusPath} = props

    const key = value._key

    const handleChange = React.useCallback(patchEvent => {
      props.onChange(patchEvent.prefixAll({_key: value._key}))
    }, [])

    const handleEditStart = React.useCallback(() => {
      props.onFocus([{_key: key}, 0])
    }, [])

    const handleEditEnd = React.useCallback(() => {
      props.onFocus([{_key: key}])
    }, [])

    const handleSelfFocus = React.useCallback(() => {
      props.onFocus([{_key: key}])
    }, [])

    const [firstFocusPathSegment, ...childFocusPath] = focusPath

    const hasFocus = firstFocusPathSegment?._key === value._key
    const hasFocusWithin = hasFocus && childFocusPath.length > 0
    return (
      <div style={{border: '1px solid', position: 'relative'}}>
        <div tabIndex={0} onFocus={handleSelfFocus}>
          <pre style={{fontSize: '0.9em'}}>
            {JSON.stringify(value)}
            {hasFocus && <span style={{position: 'absolute', top: 0, right: 0}}>🎯</span>}
          </pre>
        </div>
        <button onClick={handleEditStart}>Edit</button>
        {hasFocusWithin && (
          <Modal onClose={handleEditEnd}>
            <FormBuilderInput
              level={level}
              value={value}
              type={type}
              path={[{_key: value._key}]}
              focusPath={props.focusPath}
              onChange={handleChange}
              onFocus={props.onFocus}
            />
          </Modal>
        )}
      </div>
    )
  })
)

interface Props {
  type: any
  onChange(patchEvent: PatchEvent): void
}

export class ArrayInput extends React.Component<Props> {
  getMemberTypeOfItem(item): Type {
    const {type} = this.props
    const itemTypeName = resolveTypeName(item)
    return type.of.find(memberType => memberType.name === itemTypeName)
  }

  handleAddBtnClick = () => {
    const {type, onChange, onFocus} = this.props
    const itemType = type.of[0]
    const key = randomKey()
    const patches = [
      setIfMissing([]),
      insert([{_key: key}], 'after', [-1]),
      ...(itemType.name === 'object' ? [] : [set(itemType.name, [{_key: key}, '_type'])])
    ]
    onChange(PatchEvent.from(patches))
    onFocus([{_key: key}, 0])
  }

  render() {
    const {type, level, focusPath = [], markers, onFocus, readOnly, onChange, value} = this.props

    return (
      <div style={{backgroundColor: '#aaa'}}>
        <button onClick={this.handleAddBtnClick}>Append item</button>
        {(value || []).map(item => (
          <ArrayItem
            level={level + 1}
            onChange={onChange}
            type={this.getMemberTypeOfItem(item)}
            value={item}
            focusPath={focusPath}
            onFocus={onFocus}
          />
        ))}
      </div>
    )
  }
}
