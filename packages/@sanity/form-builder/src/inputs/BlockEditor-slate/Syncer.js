import PropTypes from 'prop-types'
import React from 'react'
import BlockEditor from './BlockEditor'
import {Raw} from 'slate'
import sanityToSlateRaw from './conversion/sanityToSlateRaw'
import slateRawToSanity from './conversion/slateRawToSanity'
import {throttle} from 'lodash'
import PatchEvent, {set, unset} from '../../PatchEvent'
import SubscribePatchHOC from '../../utils/SubscribePatchHOC'
import Button from 'part:@sanity/components/buttons/default'
import styles from './styles/Syncer.css'

function deserialize(value, type) {
  return Raw.deserialize(sanityToSlateRaw(value, type))
}
function serialize(state) {
  return slateRawToSanity(Raw.serialize(state))
}

function isDocumentEqual(slateState, otherSlateState) {
  return slateState.get('document') === otherSlateState.get('document')
}

export default SubscribePatchHOC(class Syncer extends React.PureComponent {
  static propTypes = {
    value: PropTypes.array,
    type: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    subscribe: PropTypes.func
  }

  constructor(props) {
    super()
    this.state = {
      isOutOfSync: false,
      value: deserialize(props.value, props.type)
    }
    this.unsubscribe = props.subscribe(this.receivePatches)
  }

  handleChange = nextSlateState => {
    this.setState(prevState => (prevState.isOutOfSync ? {} : {value: nextSlateState}))
  }

  receivePatches = ({snapshot, shouldReset, patches}) => {

    if (patches.some(patch => patch.origin === 'remote')) {
      this.setState({isOutOfSync: true})
    }

    if (shouldReset) {
      // eslint-disable-next-line no-console
      console.warn('[BlockEditor] Reset state due to set patch that targeted ancestor path:', patches)
      this.setState({value: deserialize(snapshot, this.props.type)})
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
    const {value, isOutOfSync} = this.state
    return (
      <div className={styles.root}>
        <BlockEditor {...this.props} disabled={isOutOfSync} onChange={this.handleChange} value={value} />
        {isOutOfSync && (
          <div className={styles.isOutOfSyncWarning}>
            Heads up! Someone else edited this field.
            Make sure to let your co-workers know that you are working on this part of the document!
            <br />
            We're sorry for the inconvenience and working hard to get it working properly.
            <p>
              <Button inverted primary onClick={this.handleSynchronize}>Load remote changes</Button>
            </p>
          </div>
        )}
      </div>
    )
  }
})
