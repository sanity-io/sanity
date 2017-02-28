import React, {PropTypes} from 'react'
import resolveRefType from './resolveRefType'
import {resolver as previewResolver} from 'part:@sanity/base/preview'
export default class SanityPreview extends React.PureComponent {

  static propTypes = {
    value: PropTypes.object,
    type: PropTypes.object.isRequired
  };

  state = {
    loading: true,
    materialized: null,
    refType: null
  }

  componentDidMount() {
    const {type, value} = this.props
    this.subscribeRefType(value, type)
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  subscribeRefType(value, type) {
    this.unsubscribe()
    this.subscription = resolveRefType(value, type)
      .subscribe(refType => {
        this.setState({refType})
      })
  }

  unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe()
      this.subscription = null
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.type !== nextProps.type || this.props.value !== nextProps.value) {
      this.subscribeRefType(nextProps.value, nextProps.type)
    }
  }

  render() {
    const {refType} = this.state

    if (!refType) {
      return null
    }

    const Preview = previewResolver(refType)
    return (
      <Preview {...this.props} type={refType} />
    )
  }
}
