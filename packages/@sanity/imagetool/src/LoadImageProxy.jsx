import React from "react";
import ImageTool from "./ImageTool";
import PureRenderMixin from 'react-addons-pure-render-mixin'

export default React.createClass({
  displayName: 'LoadImageProxy',
  mixins: [PureRenderMixin],

  getInitialState() {
    return {
      image: new Image(),
      loaded: false,
      error: null
    };
  },

  componentDidMount() {
    const image = this.state.image;
    image.onload = ()=> {
      this.setState({
        loaded: true,
        error: null
      });
    };

    image.onerror = ()=> {
      this.setState({
        error: new Error(`Could not load image from ${JSON.stringify(image.src)}`)
      });
    };
    image.src = this.props.imageUrl;
  },

  componentWillUnmount() {
    this.state.image.onload = null;
    this.state.image.onerror = null;
  },

  componentDidUpdate(prevProps) {
    if (prevProps.imageUrl !== this.props.imageUrl) {
      this.state.image.src = this.props.imageUrl;
    }
  },

  render() {
    if (this.state.error) {
      return <div style={{display: 'inline-block'}}>{this.state.error.message}</div>
    }
    if (!this.state.loaded) {
      return <div style={{display: 'inline-block'}}>...</div>;
    }
    return <ImageTool {...this.props} image={this.state.image}/>;
  }
});
