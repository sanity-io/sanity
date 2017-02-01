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

  resolveRefType(value, type) {
    resolveRefType(value, type).then(refType => {
      this.setState({
        refType
      })
    })
  }

  componentDidMount() {
    const {type, value} = this.props
    this.resolveRefType(value, type)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.type !== nextProps.type || this.props.value !== nextProps.value) {
      this.resolveRefType(nextProps.value, nextProps.type)
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
