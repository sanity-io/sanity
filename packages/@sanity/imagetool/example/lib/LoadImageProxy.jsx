import React from "react";
import ImageTool from "../..";

export default React.createClass({
  displayName: 'LoadImageProxy',
  getInitialState() {
    return {
      loaded: false,
      image: null,
      error: null
    };
  },
  componentDidMount() {
    this._image = new Image();
    this.load();
  },
  componentWillUnmount() {
    this.cancel();
  },
  componentDidUpdate() {
    this.load();
  },
  cancel() {
    this._image.src = '';
  },
  load() {
    var image = this._image;
    image.onload = ()=> {
      this.setState({image: image, loaded: true});
    };

    image.onerror = ()=> {
      this.setState({
        loaded: true,
        error: new Error(`Could not load image from ${JSON.stringify(this.props.imageUrl)}`)
      });
    };
    image.src = this.props.imageUrl;
  },
  componentWillReceiveProps(nextProps) {
    if (nextProps.imageUrl !== this.props.imageUrl) {
      this.setState(this.getInitialState());
    }
  },
  render() {
    if (!this.state.loaded) {
      return <div style={{display: 'inline-block'}}>{this.props.children}</div>;
    }
    if (this.state.error) {
      return <div style={{display: 'inline-block'}}>{this.state.error.stack}</div>
    }
    return <ImageTool {...this.props} image={this.state.image}/>
  }
});