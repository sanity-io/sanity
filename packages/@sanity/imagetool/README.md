# The all awesome Image tool used in sanity

## Getting started

    npm install --save @sanity/imagetool


## Usage

### ImageTool widget

```jsx

import ImageTool from "@sanity/imagetool";

export default React.createClass({

  getInitialState() {
    return {
      imageMetadata: {
        hotspot: {
          x: 0.4,
          y: 0.3,
          height: 0.6,
          width: 0.4
        },
        crop: {
          left: 0.1,
          right: 0.2,
          top: 0.1,
          bottom: 0.21,
        }
      }
    }
  },

  handleImageToolValue(newValue) {
    this.setState({imageMetadata: newValue})
  },

  render() {
    return (
      <ImageTool image="https://c4.staticflickr.com/8/7514/16189387096_420dbca030_h.jpg" value={this.state.imageMetadata}></ImageTool>
    )
  }
})

```

## Usage

### CSS style calculator

```js
import calculateStyles from "@sanity/imagetool/calculateStyles";

const metadata = {
  hotspot: {
    x: 0.4,
    y: 0.3,
    height: 0.6,
    width: 0.4
  },
  crop: {
    left: 0.1,
    right: 0.2,
    top: 0.1,
    bottom: 0.21,
  }
}

calculateStyles({
  hotspot: metadata.hotspot,
  crop: metadata.crop,
  image: {aspectRatio: 5/4},
  container: {aspectRatio: 16/10},
  align: {
    x: 'left',
    y: 'center'
  }
});
```

`=>`

```json
 {
  image: {
    position: 'absolute',
    height: '144.93%',
    width: '142.86%',
    top: '-14.49%',
    left: '-14.29%'
  },
  crop: {
    position: 'absolute',
    overflow: 'hidden',
    height: '100%',
    width: '79.26%',
    top: '7.97%',
    left: '17.51%'
  },
  container: {
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
    height: '62.5%'
  }
}
```

## Developing

    git clone git@github.com:bengler/sanity-imagetool
    cd sanity-imagetool
    npm install
    npm start
