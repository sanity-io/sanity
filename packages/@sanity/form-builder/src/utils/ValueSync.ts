import PropTypes from 'prop-types'

import React from 'react'
import {debounce} from 'lodash'
import whyNotEqual from 'is-equal/why'
import withPatchSubscriber from './withPatchSubscriber'
import {Patch} from '../typedefs/patch'

declare let __DEV__: boolean

type Deserialized = any

type ChildProps = {value: Deserialized}

type Props = {
  value: Record<string, any>
  subscribe: Function
  serialize: (value: Deserialized) => Record<string, any>
  deserialize: (value: Record<string, any>) => Deserialized
  applyPatch: (patch: Patch) => Deserialized
  children: (arg0: ChildProps) => React.ElementType | null
}

export default withPatchSubscriber(
  class ValueSync extends React.Component {
    props: Props

    static contextTypes = {
      getValuePath: PropTypes.func,
      formBuilder: PropTypes.any
    }

    state: {
      value: Deserialized
    }

    unsubscribe: () => void

    constructor(props: Props) {
      super(props)
      this.state = {
        value: props.deserialize(props.value)
      }
      this.unsubscribe = props.subscribe(({snapshot, patches, shouldReset}) => {
        if (shouldReset) {
          // eslint-disable-next-line no-console
          console.warn(
            'Serialized local input value was reset due to a patch that targeted an ancestor'
          )
          this.setState({value: props.deserialize(snapshot)})
        }
        this.receivePatches(patches)
      })
    }

    componentWillUnmount() {
      this.unsubscribe()
      this.checkDiff.cancel()
    }

    receivePatches(patches: Array<Patch>) {
      const {applyPatch} = this.props
      this.setState((prevState: any) => ({
        value: patches.reduce(applyPatch, prevState.value)
      }))
    }

    checkDiff = debounce(() => {
      const propsVal = this.props.value
      const stateVal = this.state.value ? this.props.serialize(this.state.value) : this.state.value
      const notEqual = whyNotEqual(propsVal, stateVal)
      if (notEqual) {
        // eslint-disable-next-line no-console
        console.warn(
          'Serialized local input value (%o) out of sync with actual value (%o): %s',
          propsVal,
          stateVal,
          notEqual
        )
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
  }
)
