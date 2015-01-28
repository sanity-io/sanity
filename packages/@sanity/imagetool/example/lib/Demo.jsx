import React from "react";
import Preview from "./Preview.jsx";
import LoadImageProxy from "./LoadImageProxy.jsx";

const IMAGES = [
  `/hubble.jpg`,
  `http://www.jpl.nasa.gov/spaceimages/images/largesize/PIA17970_hires.jpg`,
  `http://placekitten.com/g/500/800`,
  `http://placekitten.com/g/800/500`,
  `http://placekitten.com/g/50/70`,
  `http://placekitten.com/g/70/50`,
  `/dog_smaller.jpg`,
  `/storesmeden.jpg`
];

export default React.createClass({
  displayName: 'ImageHotspotDemo',
  getInitialState() {
    return {
      imageUrl: IMAGES[this.props.imageIndex || 4],
      hotspot: {
        x: 0.5,
        y: 0.5,
        height: 0.9,
        width: 0.9
      },
      crop: {
        top: 0.0,
        bottom: 0.0,
        left: 0.0,
        right: 0.0
      }
    };
  },

  getImageUrl() {
    return this.state.imageUrl;
  },
  setHotspot(hotspot) {
    var newHotspot = Object.assign(this.state.hotspot, hotspot);
    this.setState({hotspot: newHotspot})
  },
  setCrop(crop) {
    this.setState({crop: crop})
  },
  handleHotspotMove(delta) {
    this.setHotspot({x: this.state.hotspot.x + delta.x, y: this.state.hotspot.y + delta.y})
  },
  handleHotspotResize(delta) {
    this.setHotspot({
      height: this.state.hotspot.height + delta.height,
      width: this.state.hotspot.width + delta.width
    })
  },
  handleCrop(delta) {
    var {crop} = this.state;
    this.setCrop({
      left: crop.left + (delta.left || 0),
      right: crop.right + (delta.right || 0),
      top: crop.top + (delta.top || 0),
      bottom: crop.bottom + (delta.bottom || 0)
    })
  },
  changeHotspot(field) {
    return e => {
      var newHotspot = Object.assign(this.state.hotspot, {
        [field]: Number(e.target.value)
      });
      this.setState({hotspot: newHotspot});
    }
  },
  changeCrop(field) {
    return e => {
      var newCrop = Object.assign(this.state.crop, {
        [field]: Number(e.target.value)
      });
      this.setState({crop: newCrop});
    }
  },
  selectImage(i) {
    this.setState({imageUrl: i});
  },
  render() {
    var value = {
      hotspot: this.state.hotspot,
      crop: this.state.crop
    };
    var imageUrl = this.getImageUrl();
    var HOTSPOT_WIDTH = 500;
    var thumbWidth = (HOTSPOT_WIDTH - IMAGES.length*4) / IMAGES.length;
    return (
      <div style={{width: '100%', margin: 15, clear: 'both'}}>
        <div style={{float: 'left'}}>
          <div style={{width: HOTSPOT_WIDTH}}>
            <LoadImageProxy
              value={value}
              imageUrl={imageUrl}
              onMove={this.handleHotspotMove}
              onResize={this.handleHotspotResize}
              onCrop={this.handleCrop}/>
            <div>
              <label>
                <input type="radio" name="strict" checked/> Innholdet i sirkelen kan kuttes for beste mulig visning
              </label>
            </div>
            <div>
            <label>
              <input type="radio" name="strict"/> Innholdet i sirkelen må alltid vises (nyttig for f.eks. grafikk)
            </label>
            </div>
          </div>
          <div style={{width: HOTSPOT_WIDTH, outline: '1px dotted #aaa'}}>
            <ul style={{margin: 0, padding: 0, listStyle:'none', clear: 'both'}}>
            {
              IMAGES.map((image, i)=> {
                return (
                  <li style={{display: 'inline-block', padding: 2}}>
                    <a href={'?image='+i}> <img src={image} style={{verticalAlign: 'middle', width: thumbWidth}}/></a>
                  </li>
                )
              })
            }
            </ul>
          </div>
          <p className="hint">Dra i den store sirkelen for å flytte utsnittet. Den lille for å endre størrelse</p>
          <h2>Hotspot</h2>
          <div>
            x :<input value={value.hotspot.x} type="range" min="0" max="1" step="0.001" onChange={this.changeHotspot('x')}/>
          </div>
          <div>
            y :<input value={value.hotspot.y} type="range" min="0" max="1" step="0.001" onChange={this.changeHotspot('y')}/>
          </div>
          <div>
            height :<input value={Math.abs(value.hotspot.height)} type="range" min="0" max="1" step="0.001" onChange={this.changeHotspot('height')}/>
          </div>
          <div>
            width :<input value={Math.abs(value.hotspot.width)} type="range" min="0" max="1" step="0.001" onChange={this.changeHotspot('width')}/>
          </div>
          <h2>Crop</h2>
          <div>
            left :<input value={value.crop.left} type="range" min="0" max="1" step="0.001" onChange={this.changeCrop('left')}/>
          </div>
          <div>
            right :<input value={value.crop.right} type="range" min="0" max="1" step="0.001" onChange={this.changeCrop('right')}/>
          </div>
          <div>
            top :<input value={value.crop.top} type="range" min="0" max="1" step="0.001" onChange={this.changeCrop('top')}/>
          </div>
          <div>
            bottom :<input value={value.crop.bottom} type="range" min="0" max="1" step="0.001" onChange={this.changeCrop('bottom')}/>
          </div>
          <pre>
          {JSON.stringify(value, null, 2)}
          </pre>
        </div>
        <div style={{padding: 5, margin: 5, float: 'left'}}>
          <ul className="previews">
            <li>
              <h3>Liggende</h3>
              <Preview aspectRatio={16/9} hotspot={value.hotspot} crop={value.crop} imageUrl={imageUrl}/>
            </li>
            <li>
              <h3>Kvadratisk</h3>
              <Preview aspectRatio={1} hotspot={value.hotspot} crop={value.crop} imageUrl={imageUrl}/>
            </li>
            <li>
              <h3>Panorama</h3>
              <Preview aspectRatio={4}  hotspot={value.hotspot} crop={value.crop} imageUrl={imageUrl}/>
            </li>
            <li>
              <h3>Stående</h3>
              <Preview aspectRatio={9/16}  hotspot={value.hotspot} crop={value.crop} imageUrl={imageUrl}/>
            </li>
          </ul>
        </div>
      </div>
    );
  }
});

