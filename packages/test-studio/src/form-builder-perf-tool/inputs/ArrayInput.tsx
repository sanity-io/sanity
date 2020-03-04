import React from 'react'
import randomKey from './randomKey'
import {Type} from '@sanity/form-builder/lib/typedefs'
import {resolveTypeName} from '@sanity/form-builder/lib/utils/resolveTypeName'
import {PatchEvent} from '@sanity/form-builder/lib/PatchEvent'
import {setIfMissing, set, insert} from '@sanity/form-builder/lib/PatchEvent'
import {FormBuilderInput} from '@sanity/form-builder/lib/FormBuilderInput'
import {Modal} from '../components/Modal'
import {PresenceMarkerList} from '../components/PresenceMarkerList'
import {PreviewAny} from '@sanity/form-builder/lib/utils/fallback-preview/PreviewAny'
import {PositionsOverlay} from '../components/PositionsOverlay'
import {PositionTracker} from '../components/PositionTracker'

const pathSegmentMatchesKey = (pathSegment, key) => pathSegment?._key === key

export const ArrayItem = React.memo(
  React.forwardRef((props, ref) => {
    const {type, value, level, presence, focusPath} = props

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

    const hasFocus = pathSegmentMatchesKey(firstFocusPathSegment, key)
    const hasFocusWithin = hasFocus && childFocusPath.length > 0

    const presenceInside = hasFocusWithin
      ? []
      : presence.filter(entry => {
          return pathSegmentMatchesKey(entry.path[0], key)
        })
    return (
      <div style={{border: '1px solid', position: 'relative'}}>
        <div tabIndex={0} onFocus={handleSelfFocus}>
          <pre style={{fontSize: '0.9em'}}>
            <PreviewAny value={value} maxDepth={1} />
            {hasFocus && <span style={{position: 'absolute', top: 0, right: 0}}>🎯</span>}
            <PresenceMarkerList presence={presenceInside} />
          </pre>
        </div>
        <button onClick={handleEditStart}>Edit</button>
        {hasFocusWithin && (
          <Modal onClose={handleEditEnd}>
            <PositionTracker>
              <div style={{position: 'relative'}}>
                <PositionsOverlay />
                <FormBuilderInput
                  level={level}
                  value={value}
                  type={type}
                  presence={presence}
                  path={[{_key: value._key}]}
                  focusPath={props.focusPath}
                  onChange={handleChange}
                  onFocus={props.onFocus}
                />
              </div>
            </PositionTracker>
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
    const {
      type,
      level,
      presence,
      focusPath = [],
      markers,
      onFocus,
      readOnly,
      onChange,
      value
    } = this.props

    return (
      <div style={{backgroundColor: '#aaa'}}>
        <button onClick={this.handleAddBtnClick}>Append item</button>
        {(value || []).map(item => (
          <ArrayItem
            level={level + 1}
            onChange={onChange}
            type={this.getMemberTypeOfItem(item)}
            value={item}
            presence={presence}
            focusPath={focusPath}
            onFocus={onFocus}
          />
        ))}
      </div>
    )
  }
}
