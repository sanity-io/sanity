// @flow
import React, {PropTypes} from 'react'
import type {Patch} from '../utils/patches'
import {debounce} from 'lodash'
import whyNotEqual from 'is-equal/why'
import SubscribePatchHOC from './SubscribePatchHOC'

declare var __DEV__: boolean

type Deserialized = any

type ChildProps = { value: Deserialized }

type Props = {
  value: Object,
  subscribe: Function,
  serialize: (value: Deserialized) => Object,
  deserialize: (value: Object) => Deserialized,
  applyPatch: (patch: Patch) => Deserialized,
  children: (ChildProps) => ?React$Element<any>
}


export default SubscribePatchHOC(class SubscribePatch extends React.Component {
  props: Props

  static contextTypes = {
    getValuePath: PropTypes.func,
    formBuilder: PropTypes.any,
  }

  state: {
    value: Deserialized
  }

  unsubscribe: () => void

  constructor(props: Props) {
    super()
    this.state = {
      value: props.deserialize(props.value)
    }
    this.unsubscribe = props.subscribe(({snapshot, patches, shouldReset}) => {
      if (shouldReset) {
        // eslint-disable-next-line no-console
        console.warn('Serialized local input value was reset due to a patch that targeted an ancestor')
        this.setState({value: props.deserialize(snapshot)})
      }
      this.receivePatches(patches)
    })
  }


  componentWillUnmount() {
    this.unsubscribe()
  }

  receivePatches(patches: Array<Patch>) {
    const {applyPatch} = this.props
    this.setState(prevState => ({
      value: patches.reduce(applyPatch, prevState.value)
    }))
  }

  checkDiff = debounce(() => {
    const propsVal = this.props.value
    const stateVal = this.state.value ? this.props.serialize(this.state.value) : this.state.value
    const notEqual = whyNotEqual(propsVal, stateVal)
    if (notEqual) {
      // eslint-disable-next-line no-console
      console.warn('Serialized local input value (%o) out of sync with actual value (%o): %s', propsVal, stateVal, notEqual)
    }
  }, 5000)

  componentDidUpdate() {
    if (__DEV__) {
      this.checkDiff()
    }
  }

  render() {
    const {value} = this.state
    return this.props.children({...this.props, value})
  }
})
