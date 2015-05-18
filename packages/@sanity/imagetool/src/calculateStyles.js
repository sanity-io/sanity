function readAspectRatio(opts) {
  opts = opts || {};
  if (opts.hasOwnProperty('aspectRatio')) {
    return opts.aspectRatio;
  }
  if (!opts.height || !opts.width) {
    throw new Error("Please provide either aspect ratio or container dimensions (width, height)");
  }
  return opts.width / opts.height;
}

function readHotspot(hotspot, imageAspect) {

  if (hotspot.size) {
    hotspot.width = hotspot.size;
    hotspot.height = imageAspect;
    console.log("hotspot.size is deprecated. Should be hotspot.height and hotspot.width") //eslint-disable-line no-console
  }
  return hotspot;
}

function round(v, decimals) {
  let _decimals = typeof decimals === 'undefined' ? 2 : decimals;
  const multiplier = Math.pow(10, _decimals);
  return Math.round(v * multiplier) / multiplier;
}

function calculateHotSpotCrop(sourceAspect, descriptor, spec) {
  const crop = descriptor.crop;
  const viewportAspect = spec.aspect;
  const alignment = spec.align;

  // The rational aspect of the cropped image
  const netWidth = 1.0 - crop.left - crop.right;
  const netHeight = 1.0 - crop.top - crop.bottom;

  // Places the image inside the crop box
  const outImg = {
    top: -crop.top / netHeight,
    left: -crop.left / netWidth,
    width: 1 / netWidth,
    height: 1 / netHeight
  };

  // The rational aspect is the aspect ration of the crop in ratios of the image size meaning the image
  // is always considered having the size 1.0*1.0
  const cropRationalAspect = netWidth / netHeight;

  // cropAspect is the real aspect ratio of the crop box in pixel-space
  const cropAspect = cropRationalAspect * sourceAspect;

  // Now we transform the hotspot to be expressed in ratios of the cropped area, not the
  // full image:
  const hotspot = {
    x: (descriptor.hotspot.x - crop.left) / netWidth,
    y: (descriptor.hotspot.y - crop.top) / netHeight,
    height: descriptor.hotspot.height / netHeight,
    width: descriptor.hotspot.width / netWidth
  };

  // Lets calculate the maximum scale the image may be presented at without cropping the hotspot. A scale of
  // 1.0 means the cropped image exactly fill the width of the viewport.

  // The scale at which the hotspot would fill the viewport exactly in the X direction
  const maxHotspotXScale = 1.0 / hotspot.width;
  // The scale at which the hotspot would fill the veiwport exactly in the Y direction
  const maxHotspotYScale = (1.0 / hotspot.height) * cropAspect / viewportAspect;
  // This is the largest scale the image can have while still not cropping the hotspot:
  const maxScale = Math.min(maxHotspotXScale, maxHotspotYScale);

  // Now lets find the minimum scale we can have while maintaining full bleed (no letterboxing)
  let minFullBleedScale;
  const cropIsTaller = (cropAspect <= viewportAspect);
  if (cropIsTaller) { // Crop is taller than viewport
    minFullBleedScale = 1.0; // By definition 1.0 fills the width of the viewport exactly with the viewport cutting away from the height of the cropbox
  } else { // Image is wider than viewport
    minFullBleedScale = cropAspect / viewportAspect; // At this scale the viewport is filled exactly in the height while cutting away from the sides
  }

  let method;
  let outCrop;

  // Do we have to letterbox this image in order to leave the hotspot area uncropped?
  if (minFullBleedScale > maxScale) {

    // Yes :-( There is no way to protect the hot spot and still have full bleed, so we are letterboxing it
    method = "letterbox";
    let letterboxScale;
    const diff = minFullBleedScale - maxScale;

    // Determine a scale where the image fills one dimension of the container
    if (cropIsTaller) {
      letterboxScale = 1.0 - diff;
    } else {
      letterboxScale = maxScale;
    }

    outCrop = {
      width: letterboxScale,
      height: letterboxScale / cropAspect * viewportAspect
    };

    const hotspotLeft = (hotspot.x * outCrop.width) - (hotspot.width * outCrop.width) / 2;
    switch(alignment.x){
      case "left":
        outCrop.left = cropIsTaller ? 0 : -hotspotLeft;
        break;
      case "right":
        // todo: broken atm
        outCrop.left = cropIsTaller ? 1 - outCrop.width : hotspotLeft;
        break;
      case "center":
        outCrop.left = cropIsTaller ? (1 - outCrop.width) / 2 : -hotspotLeft;
        break;
    }
    const hotspotTop = (hotspot.y * outCrop.height) - (hotspot.height * outCrop.height) / 2;
    switch(alignment.y) {
      case "top":
        outCrop.top = cropIsTaller ? -hotspotTop : 0;
        break;
      case "bottom":
          // todo: broken atm
        outCrop.top = hotspotTop;
        break;
      case "center":
        outCrop.top = cropIsTaller ? -hotspotTop : (1 - outCrop.height) / 2;
        break;
    }
  }
  else {
    // We are going full bleed! Now we need to determine which dimension of the image is fully displayed, and which is cropped
    if (cropIsTaller) {
      // TODO: Clamp hotspot offset to avoid moving image off canvas
      method = "full_width";

      let top = (-hotspot.y / cropAspect) * viewportAspect + 0.5;
      const height = minFullBleedScale / cropAspect * viewportAspect;
      // Clamp top so that we will not move the image off of the viewport
      if (top > 0) {
        top = 0
      } else if (-top > height - 1.0) {
        top = -(height - 1.0);
      }

      outCrop = {
        width: minFullBleedScale,
        height: height,
        left: 0,
        // Place the Y center of the hotspot near the center of the viewport
        top: top
      }
    }
    else { // crop is wider
      method = "full_height";

      const width = minFullBleedScale;
      let left = 0.5 - (hotspot.x * minFullBleedScale);
      if (left > 0) {
        left = 0;
      } else if (-left > width - 1.0) {
        left = -(width - 1.0);
      }
      // Clamp left so that we will not move the image off of the viewport.
      outCrop = {
        width: width,
        height: minFullBleedScale / cropAspect * viewportAspect,
        top: 0,
        // Place the X center of the hotspot at the center of the viewport
        left: left
      }
    }
  }

  return {
    method: method,
    crop: outCrop,
    image: outImg
  }
}

module.exports = function calculateStyles(options) {

  options = options || {};
  const containerAspect = readAspectRatio(options.container);
  const imageAspect = readAspectRatio(options.image);
  const hotspot = options.hotspot ? readHotspot(options.hotspot, imageAspect) : {x: 0.5, y: 0.5, height: 1, width: 1};
  const crop = options.crop || { top: 0, right: 0, bottom: 0, left: 0 };
  const align = options.align || { x: 'center', y: 'center' };

  const result = calculateHotSpotCrop(imageAspect, {hotspot: hotspot, crop: crop}, {
    aspect: containerAspect,
    align: align
  });

  function styleFormat(n) {
    return n === 0 ? 0 : (n + '%')
  }

  function toStylePercentage(n) {
    return styleFormat(round(n * 100));
  }

  return {
    debug: {
      result: result
    },
    image: {
      position: 'absolute',
      height: toStylePercentage(result.image.height),
      width: toStylePercentage(result.image.width),
      top: toStylePercentage(result.image.top),
      left: toStylePercentage(result.image.left)
    },
    crop: {
      position: 'absolute',
      overflow: 'hidden',
      height: toStylePercentage(result.crop.height),
      width: toStylePercentage(result.crop.width),
      top: toStylePercentage(result.crop.top),
      left: toStylePercentage(result.crop.left)
    },
    container: {
      //outline: '1px solid cyan',
      overflow: 'hidden',
      position: 'relative',
      width: '100%',
      height: styleFormat(round(100 / containerAspect))
    }
  }
};
