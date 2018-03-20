// @flow

import PropTypes from 'prop-types'
import React from 'react'
import generateHelpUrl from '@sanity/generate-help-url'

import FormField from 'part:@sanity/components/formfields/default'
import withPatchSubscriber from '../../utils/withPatchSubscriber'
import PatchEvent from '../../PatchEvent'
import Input from './Input'

import changeToPatches from './utils/changeToPatches'
import deserialize from './utils/deserialize'
import patchesToChange from './utils/patchesToChange'

import styles from './styles/SyncWrapper.css'

function findBlockType(type) {
  return type.of.find(ofType => ofType.name === 'block')
}

function isDeprecatedBlockSchema(type) {
  const blockType = findBlockType(type)
  if (blockType.span !== undefined) {
    return true
  }
  return false
}

function isDeprecatedBlockValue(value) {
  if (!value) {
    return false
  }
  const block = value.find(item => item._type === 'block')
  if (block && Object.keys(block).includes('spans')) {
    return true
  }
  return false
}

export default withPatchSubscriber(
  class SyncWrapper extends React.PureComponent {
    static propTypes = {
      focusPath: PropTypes.array,
      onBlur: PropTypes.func,
      onChange: PropTypes.func,
      onFocus: PropTypes.func,
      schema: PropTypes.object,
      subscribe: PropTypes.func,
      type: PropTypes.object.isRequired,
      value: PropTypes.array
    }

    _input = null

    constructor(props) {
      super()
      const deprecatedSchema = isDeprecatedBlockSchema(props.type)
      const deprecatedBlockValue = isDeprecatedBlockValue(props.value)
      this.state = {
        deprecatedSchema,
        deprecatedBlockValue,
        editorValue:
          deprecatedSchema || deprecatedBlockValue
            ? deserialize([], props.type)
            : deserialize(props.value, props.type)
      }
      this.unsubscribe = props.subscribe(this.handleRemotePatches)
    }

    handleEditorChange = (change: SlateChange) => {
      const {value, onChange, type} = this.props
      const {patches, selection} = changeToPatches(this.state.editorValue, change, value, type)
      this.setState({editorValue: change.value, selection})
      return onChange(PatchEvent.from(patches))
    }

    handleFormBuilderPatch = (event: PatchEvent) => {
      const {onChange, type} = this.props
      const {editorValue} = this.state
      const change = patchesToChange(event.patches, editorValue, null, type)
      this.setState({editorValue: change.value})
      return onChange(event)
    }

    focus() {
      this._input.focus()
    }

    handleRemotePatches = ({patches, shouldReset, snapshot}) => {
      const {editorValue} = this.state
      const {type} = this.props
      const remotePatches = patches.filter(patch => patch.origin === 'remote')
      if (remotePatches.length) {
        const change = patchesToChange(remotePatches, editorValue, snapshot, type)
        this.setState({editorValue: change.value})
      }
    }

    componentWillUnmount() {
      this.unsubscribe()
    }

    refInput = (input: Input) => {
      this._input = input
    }

    render() {
      const {editorValue, deprecatedSchema, deprecatedBlockValue} = this.state
      const {onChange, ...rest} = this.props
      const {type} = this.props
      const isDeprecated = deprecatedSchema || deprecatedBlockValue
      return (
        <div className={styles.root}>
          {!isDeprecated && (
            <Input
              editorValue={editorValue}
              onChange={this.handleEditorChange}
              onPatch={this.handleFormBuilderPatch}
              ref={this.refInput}
              {...rest}
            />
          )}

          {isDeprecated && (
            <FormField label={type.title}>
              <div className={styles.disabledEditor}>
                <strong>Heads up!</strong>
                <p>
                  You&apos;re using a new version of the Studio with
                  {deprecatedSchema && " a block schema that hasn't been updated."}
                  {deprecatedSchema &&
                    deprecatedBlockValue &&
                    ' Also block text needs to be updated.'}
                  {deprecatedBlockValue &&
                    !deprecatedSchema &&
                    " block text that hasn't been updated."}
                </p>
                <p>
                  <a
                    href={generateHelpUrl('migrate-to-block-children')}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Read more
                  </a>
                </p>
              </div>
            </FormField>
          )}
        </div>
      )
    }
  }
)
