var React = require('react/addons');
var cx = React.addons.classSet;
var getHotspotStyles = require("../../calculateStyles");

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
    if (!this.state.loaded) {
      return (<div style={{overflow: 'hidden', height: 1, width: 1}}>
        <img src={this.props.imageUrl} onLoad={this.handleImageLoaded} onError={this.handleImageLoadError}/>
      </div>);
    }

    var rawImageSize = this.state.imageSize;

    var hotspot = this.props.hotspot || {
        x: 0.5,
        y: 0.5,
        height: 0.5,
        width: 0.5
      };

    var crop = this.props.crop;

    var styles = getHotspotStyles({
      container: this.props,
      image: rawImageSize,
      hotspot,
      crop
    });

    return (
      <div style={{border: '1px solid #eee'}}>
        <pre style={{width: 200, overflow: 'auto'}}>{JSON.stringify(styles, null, 2)}</pre>
        <div {...this.props} style={{outline: '1px solid rgb(189, 240, 164)', width: this.props.width || '100%'}}>
          <div style={styles.container}>
            <div style={{paddingTop: styles.container.height}}/>
            <div style={styles.crop}>
              <img src={this.props.imageUrl} style={styles.image} />
            </div>
          </div>
        </div>
      </div>
    );
  }
});
