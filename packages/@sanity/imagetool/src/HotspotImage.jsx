import React, {PropTypes} from 'react';
import calculateStyles from './calculateStyles';
import Debug from "debug";

const debug = Debug('sanity-imagetool');

const DEFAULT_HOTSPOT = {
  x: 0.5,
  y: 0.38, // golden ratio
  height: 0.1,
  width: 0.1
};

const DEFAULT_CROP = {
  top: 0,
  left: 0,
  right: 0,
  bottom: 0
};

export default React.createClass({
  displayName: 'HotspotImage',
  propTypes: {
    src: React.PropTypes.string,
    srcAspectRatio: PropTypes.number,
    srcSet: React.PropTypes.string,
    hotspot: React.PropTypes.object,
    crop: React.PropTypes.object,
    aspectRatio: PropTypes.number,
    alignX: PropTypes.oneOf(['center', 'left', 'right']),
    alignY: PropTypes.oneOf(['center', 'top', 'bottom']),
    className: PropTypes.string,
    style: PropTypes.object,
    onError: PropTypes.func,
    onLoad: PropTypes.func
  },

  componentDidMount() {
    const imageElement = this.refs.image.getDOMNode();
    // Fixes issues that may happen if the component is mounted after the image is done loading
    // In these situations, neither the onLoad or the onError events will be called.
    // Derived from http://imagesloaded.desandro.com/
    const alreadyLoaded = (imageElement.src && imageElement.complete && imageElement.naturalWidth !== undefined)
    if (alreadyLoaded) {
      debug("Image '%s' already loaded, refreshing (from cache) to trigger onLoad / onError", this.props.src);
      imageElement.src = imageElement.src;
    }
  },

  getDefaultProps() {
    return {
      aspectRatio: 4 / 3,
      alignX: 'center',
      alignY: 'center',
      crop: DEFAULT_CROP,
      hotspot: DEFAULT_HOTSPOT
    };
  },
  render() {
    const {
      aspectRatio,
      srcAspectRatio,
      crop,
      hotspot,
      src,
      srcSet,
      alignX,
      alignY,
      className,
      style,
      onError,
      onLoad
    } = this.props;

    const targetStyles = calculateStyles({
      container: { aspectRatio },
      image: { aspectRatio: srcAspectRatio },
      hotspot,
      crop,
      align: {
        x: alignX,
        y: alignY
      }
    });

    return (
      <div className={`${className || ''} sanity-image`} style={style}>
        <div className="sanity-image__container" style={targetStyles.container}>
          <div className="sanity-image__padding" style={{paddingTop: targetStyles.container.height}}/>
          <div className="sanity-image__crop-box" style={targetStyles.crop}>
            <img
              className="sanity-image__padding"
              ref="image"
              src={src}
              srcSet={srcSet}
              onLoad={onLoad}
              onError={onError}
              style={targetStyles.image}
              />
          </div>
        </div>
      </div>
    );
  }
});
