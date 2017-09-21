import PropTypes from 'prop-types'
import React from 'react'
import generateHelpUrl from '@sanity/generate-help-url'
import FormField from 'part:@sanity/components/formfields/default'
import BlockEditor from './BlockEditor'
import {State} from 'slate'
import sanityToSlateRaw from './conversion/sanityToSlateRaw'
import slateRawToSanity from './conversion/slateRawToSanity'
import {throttle} from 'lodash'
import PatchEvent, {set, unset} from '../../PatchEvent'
import withPatchSubscriber from '../../utils/withPatchSubscriber'
import Button from 'part:@sanity/components/buttons/default'
import styles from './styles/Syncer.css'

function deserialize(value, type) {
  return State.fromJSON(sanityToSlateRaw(value, type))
}
function serialize(state) {
  return slateRawToSanity(state.toJSON({preserveKeys: true}))
}

function isDocumentEqual(slateState, otherSlateState) {
  return slateState.get('document') === otherSlateState.get('document')
}

function isDeprecatedBlockSchema(type) {
  const blockType = type.of.find(ofType => ofType.name === 'block')
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

export default withPatchSubscriber(class Syncer extends React.PureComponent {
  static propTypes = {
    schema: PropTypes.object,
    value: PropTypes.array,
    type: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    subscribe: PropTypes.func
  }

  constructor(props) {
    super()
    const deprecatedSchema = isDeprecatedBlockSchema(props.type)
    const deprecatedBlockValue = isDeprecatedBlockValue(props.value)
    this.state = {
      isOutOfSync: false,
      deprecatedSchema,
      deprecatedBlockValue,
      value: (deprecatedBlockValue || deprecatedBlockValue)
        ? undefined : deserialize(props.value, props.type)
    }
    this.unsubscribe = props.subscribe(this.receivePatches)
  }

  handleChange = slateChange => {
    this.setState(prevState => (prevState.isOutOfSync ? {} : {value: slateChange.state}))
  }

  receivePatches = ({snapshot, shouldReset, patches}) => {

    if (patches.some(patch => patch.origin === 'remote')) {
      this.setState({isOutOfSync: true})
    }

    if (shouldReset) {
      // @todo
      // eslint-disable-next-line no-console
      // console.warn('[BlockEditor] Reset state due to set patch that targeted ancestor path:', patches)
      // this.setState({value: deserialize(snapshot, this.props.type)})
    }// else {
    //   // console.log('TODO: Apply patches:', patches)
    // }
  }

  componentWillUnmount() {
    // This is a defensive workaround for an issue causing content to be overwritten
    // It cancels any pending saves, so if the component gets unmounted within the
    // 1 second window, work may be lost.
    // This is by no means ideal, but preferable to overwriting content in other documents
    // Should be fixed by making the block editor "real" realtime
    this.emitSet.cancel()

    this.unsubscribe()
  }

  componentDidUpdate(prevProps, prevState) {
    const didSync = prevState.isOutOfSync && !this.state.isOutOfSync
    if (!didSync && !isDocumentEqual(prevState.value, this.state.value)) {
      this.emitSet()
    }
  }

  handleSynchronize = () => {
    this.setState({
      value: deserialize(this.props.value, this.props.type),
      isOutOfSync: false
    })
  }

  emitSet = throttle(() => {
    const {onChange} = this.props
    // const onChange = event => console.log(event.patch.type, event.patch.value)
    const {value} = this.state
    const nextVal = serialize(value)

    onChange(PatchEvent.from(nextVal ? set(nextVal) : unset()))

  }, 1000, {trailing: true})

  render() {
    const {value, isOutOfSync, deprecatedSchema, deprecatedBlockValue} = this.state
    const isDeprecated = deprecatedSchema || deprecatedBlockValue
    const {type} = this.props
    return (
      <div className={styles.root}>
        { !isDeprecated && (
          <BlockEditor
            {...this.props}
            disabled={isOutOfSync}
            onChange={this.handleChange}
            value={value}
          />)
        }

        {isDeprecated && (

          <FormField
            label={type.title}
          >
            <div className={styles.disabledEditor}>

              <strong>Heads up!</strong>
              <p>
                You&apos;re using a new version of the Studio with

                {deprecatedSchema && ' a block schema that hasn\'t been updated.'}

                {deprecatedSchema && deprecatedBlockValue && ' Also block text needs to be updated.'}

                {deprecatedBlockValue && !deprecatedSchema && ' block text that hasn\'t been updated.'}
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

        {isOutOfSync && (
          <div className={styles.isOutOfSyncWarning}>
            Heads up! Someone else edited this field.
            Make sure to let your co-workers know that you are working on this part of the document!
            <br />
            We&apos;re sorry for the inconvenience and working hard to get it working properly.
            <p>
              <Button inverted primary onClick={this.handleSynchronize}>Load remote changes</Button>
            </p>
          </div>
        )}
      </div>
    )
  }
})
