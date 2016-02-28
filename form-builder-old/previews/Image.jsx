import React from 'react'
import SanityImage from '../../../widgets/SanityImage'

export default React.createClass({
  displayName: 'Image',
  render() {
    const {value, reference} = this.props
    const meta = reference && reference.meta

    return (
      <div className="preview-item--reference--image">
        <div className="image-preview">
          <div className="image-preview__image">
            <SanityImage maxWidth={1000} image={value}/>
          </div>
          <div className="image-preview__meta">
            <h4>{meta && meta.title}</h4>

            <p>{meta && meta.description}</p>
          </div>
        </div>
      </div>
    )
  }
})
