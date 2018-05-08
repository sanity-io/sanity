export function imageWithNoCropSpecified() {
  return {
    _type: 'image',
    asset: {
      _ref: 'image-vK7bXJPEjVpL_C950gH1N73Zv14r7pYsbUdXl-4288x2848-jpg',
      _type: 'reference'
    }
  }
}

export function uncroppedImage() {
  return {
    _type: 'image',
    asset: {
      _ref: 'image-Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000-jpg',
      _type: 'reference'
    },
    crop: {
      bottom: 0.0,
      left: 0,
      right: 0,
      top: 0
    },
    hotspot: {
      height: 0.3,
      width: 0.3,
      x: 0.3,
      y: 0.3
    }
  }
}

export function croppedImage() {
  return {
    _type: 'image',
    asset: {
      _ref: 'image-Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000-jpg',
      _type: 'reference'
    },
    crop: {
      bottom: 0.1,
      left: 0.1,
      right: 0.1,
      top: 0.1
    },
    hotspot: {
      height: 0.3,
      width: 0.3,
      x: 0.3,
      y: 0.3
    }
  }
}

export function noHotspotImage() {
  return {
    _type: 'image',
    asset: {
      _ref: 'image-Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000-jpg',
      _type: 'reference'
    }
  }
}
