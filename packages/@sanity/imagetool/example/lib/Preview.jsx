var React = require('react');
var cx = require('classnames');
var HotspotImage = require("../../src/HotspotImage");
var calculateStyles = require("../../src/calculateStyles");

/**
 * Takes an imageUrl and a hotspot object and returns an optimal previews of the image
 */

module.exports = React.createClass({
  displayName: 'HotspotPreview',
  propTypes: {
    imageUrl: React.PropTypes.string,
    hotspot: React.PropTypes.object,
    crop: React.PropTypes.object
  },
  getInitialState() {
    return {
      loaded: false,
      imageSize: null
    };
  },
  handleImageLoaded(e) {
    var {width, height} = e.target;
    this.setState({
      loaded: true,
      imageSize: {
        width: width,
        height: height,
        ratio: width / height
      }
    });
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.imageUrl !== this.props.imageUrl) {
      this.setState(this.getInitialState())
    }
  },

  render() {
    const {imageUrl, hotspot, crop, width, aspectRatio} = this.props
    if (!this.state.loaded) {
      return (
        <div style={{overflow: 'hidden', height: 1, width: 1}}>
          <img src={this.props.imageUrl} onLoad={this.handleImageLoaded} onError={this.handleImageLoadError}/>
        </div>
      );
    }

    const rawImageSize = this.state.imageSize;

    const imageAspectRatio = rawImageSize.width / rawImageSize.height;

    const styles = calculateStyles({
      container: { aspectRatio },
      image: { aspectRatio: imageAspectRatio },
      hotspot: hotspot,
      crop: crop,
      align: {
        x: 'center',
        y: 'center'
      }
    });

    return (
      <div style={{border: '1px solid #eee'}}>
        <pre>{JSON.stringify(styles, null, 2)}</pre>
        <HotspotImage
          src={imageUrl}
          srcAspectRatio={imageAspectRatio}
          aspectRatio={aspectRatio}
          crop={crop}
          hotspot={hotspot}
          alignX="center"
          alignY="center"
          style={{outline: '1px solid rgb(189, 240, 164)', width: width || '100%'}}
          />
      </div>
    )
  }
});