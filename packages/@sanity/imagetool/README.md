# ⚠️ THIS PACKAGE IS DEPRECATED

> This package is part of Sanity Studio v2, which has been superseded by **Sanity Studio v3**, the current major version released on Dec 7th, 2022. This package is no longer used/needed for Sanity Studio in its current version and will be retired on Dec 7th, 2023. The core packages for Sanity Studio v2 will only receive critical bug fixes until this date.
>
> Please head over to [the documentation for Sanity Studio v3](https://www.sanity.io/docs/sanity-studio) to learn more.

# The image tool used in sanity

## Getting started

    npm install --save @sanity/imagetool

## Usage

### ImageTool widget

```js
import React from 'react'
import ImageTool from '@sanity/imagetool'

class MyComponent extends React.Component {
  state = {
    value: {
      hotspot: {
        x: 0.4,
        y: 0.3,
        height: 0.6,
        width: 0.4,
      },
      crop: {
        left: 0.1,
        right: 0.2,
        top: 0.1,
        bottom: 0.21,
      },
    },
  }

  handleImageToolchange = (newValue) => {
    this.setState({value: newValue})
  }

  render() {
    return (
      <ImageTool
        src="https://c4.staticflickr.com/8/7514/16189387096_420dbca030_h.jpg"
        value={this.state.value}
        onChange={handleImageToolchange}
      />
    )
  }
}
```

## Usage

### CSS style calculator

```js
import calculateStyles from '@sanity/imagetool/calculateStyles'

const styles = calculateStyles({
  hotspot: {
    x: 0.4,
    y: 0.3,
    height: 0.6,
    width: 0.4,
  },
  crop: {
    left: 0.1,
    right: 0.2,
    top: 0.1,
    bottom: 0.21,
  },
  image: {height: 100, width: 125},
  container: {aspectRatio: 16 / 10},
  align: {
    x: 'left',
    y: 'center',
  },
})
```

returns an object with style objects that can be used with markup

```json
{
  "container": {
    "overflow": "hidden",
    "position": "relative",
    "width": "100%",
    "height": "62.5%"
  },
  "crop": {
    "position": "absolute",
    "overflow": "hidden",
    "height": "100%",
    "width": "79.26%",
    "top": "7.97%",
    "left": "17.51%"
  },
  "image": {
    "position": "absolute",
    "height": "144.93%",
    "width": "142.86%",
    "top": "-14.49%",
    "left": "-14.29%"
  },
  "padding": {
    "marginTop": "62.5%"
  }
}
```

this can then be passed to jsx markup with the following structure:

```jsx
<div style={styles.container}>
  <div style={styles.padding} />
  <div style={styles.crop}>
    <img
      src="https://c4.staticflickr.com/8/7514/16189387096_420dbca030_h.jpg"
      style={styles.image}
    />
  </div>
</div>
```
