var React = require('react');
var ReactDOM, {findDOMNode} = require('react-dom');
var cx = React.addons.classSet;
var getHotspotStyles = require("../../src/calculateStyles");

/**
 * Takes an imageUrl and a hotspot object and returns an optimal previews of the image
 */

var DebugPaint = React.createClass({
  displayName: 'DebugPaint',
  componentDidMount() {
    this._ctx = findDOMNode(this).getContext('2d');
    this.paint(this._ctx);
  },
  componentDidUpdate() {
    this.paint(this._ctx);
  },
  paint(ctx) {
    this.paintImage(ctx);
    this.paintCrop(ctx);
  },
  paintImage(ctx) {
    var {cropBounds: crop} = this.props.debug;
    ctx.drawImage(this.props.image, -this.t(crop.left), -this.t(crop.top), this.props.image.width, this.props.image.height);
  },
  paintCrop(ctx) {
    ctx.save();
    var {cropBounds: crop} = this.props.debug;
    ctx.beginPath();
    ctx.rect(-this.t(crop.left), -this.t(crop.top), this.t(crop.width), this.t(crop.height));
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black';
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  },
  t(x) {
    return this.props.image.width*x;
  },
  render() {
    return <canvas {...this.props}/>
  }
});

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
      image: e.target,
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

    var {ratio, height, width} = this.state.imageSize;

    var hotspot = this.props.hotspot;

    var crop = this.props.crop;

    var styles = getHotspotStyles({
      container: this.props,
      image: {aspectRatio: ratio},
      hotspot,
      crop
    });

    return (
    <div style={{outline: '1px solid #eee'}}>
      <pre style={{width: 200, overflow: 'auto'}}>{JSON.stringify(styles.debug, null, 2)}</pre>
      <div {...this.props} style={{width: this.props.width || '100%'}}>
        <div style={styles.container}>
          <div style={{paddingTop: styles.container.height}}/>
          <DebugPaint image={this.state.image} debug={styles.debug} height={height} width={width} style={styles.image}/>
        </div>
      </div>
    </div>
    );
  }
});
