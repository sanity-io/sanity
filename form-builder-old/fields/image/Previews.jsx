import React from 'react'
import HotspotImage from '../../../HotspotImage'
import _t from '../../../../lib/translate'._t

export default React.createClass({
  displayName: 'Previews',
  propTypes: {
    crop: React.PropTypes.object,
    hotspot: React.PropTypes.object,
    imageUrl: React.PropTypes.string.isRequired
  },
  render() {
    const {imageUrl, hotspot, crop} = this.props
    return (
      <div className="span1of2">
        <h1>{_t('formBuilder.fields.image.preview')}</h1>

        <div className="previews">
          <div className="left">
            <div className="square">
              <h3>
                {_t('formBuilder.fields.image.squared')}
              </h3>
              <HotspotImage
                aspectRatio={1}
                crop={crop}
                hotspot={hotspot}
                imageUrl={imageUrl}/>
            </div>
            <div className="landscape">
              <h3>
                {_t('formBuilder.fields.image.landscape')}
              </h3>
              <HotspotImage
                aspectRatio={16 / 9}
                crop={crop}
                hotspot={hotspot}
                imageUrl={imageUrl}/>
            </div>
          </div>
          <div className="left">
            <div className="portrait">
              <h3>
                {_t('formBuilder.fields.image.portrait')}
              </h3>
              <HotspotImage
                aspectRatio={10 / 15}
                crop={crop}
                hotspot={hotspot}
                imageUrl={imageUrl}/>
            </div>
          </div>
        </div>
      </div>
    )
  }
})
