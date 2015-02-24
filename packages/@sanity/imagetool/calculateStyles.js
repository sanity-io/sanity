
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
    console.log("hotspot.size is deprecated. Should be hotspot.height and hotspot.width")
  }
  return hotspot;
}

function round(v) {
  return Math.round(v*100)/100;
}

function calculateHotSpotCrop(sourceAspect, descriptor, spec) {
  var crop = descriptor.crop;
  var viewportAspect = spec.aspect;
  var alignment = spec.align;

  // The rational aspect of the cropped image
  var netWidth = 1.0 - crop.left - crop.right;
  var netHeight = 1.0 - crop.top - crop.bottom;

  // Places the image inside the crop box
  var outImg = {
    top: -crop.top / netHeight,
    left: -crop.left / netWidth,
    width: 1/netWidth,
    height: 1/netHeight
  };

  // The rational aspect is the aspect ration of the crop in ratios of the image size meaning the image
  // is always considered having the size 1.0*1.0
  var cropRationalAspect = netWidth / netHeight;

  // cropAspect is the real aspect ratio of the crop box in pixel-space
  var cropAspect = cropRationalAspect * sourceAspect;

  // Now we transform the hotspot to be expressed in ratios of the cropped area, not the
  // full image:
  var hotspot = {
    x: (descriptor.hotspot.x-crop.left) / netWidth,
    y: (descriptor.hotspot.y-crop.top) / netHeight,
    height: descriptor.hotspot.height / netHeight,
    width: descriptor.hotspot.width / netWidth
  };

  // Lets calculate the maximum scale the image may be presented at without cropping the hotspot. A scale of
  // 1.0 means the cropped image exactly fill the width of the viewport.

  // The scale at which the hotspot would fill the viewport exactly in the X direction
  var maxHotspotXScale = 1.0/hotspot.width;
  // The scale at which the hotspot would fill the veiwport exactly in the Y direction
  var maxHotspotYScale = (1.0/hotspot.height) * cropAspect / viewportAspect;
  // This is the largest scale the image can have while still not cropping the hotspot:
  var maxScale = Math.min(maxHotspotXScale, maxHotspotYScale);

  // Now lets find the minimum scale we can have while maintaining full bleed (no letterboxing)
  var minFullBleedScale;
  var cropIsTaller = (cropAspect <= viewportAspect);
  if (cropIsTaller) { // Crop is taller than viewport
    minFullBleedScale = 1.0; // By definition 1.0 fills the width of the viewport exactly with the viewport cutting away from the height of the cropbox
  } else { // Image is wider than viewport
    minFullBleedScale = cropAspect / viewportAspect; // At this scale the viewport is filled exactly in the height while cutting away from the sides
  }

  var method;
  var outCrop;

  // Do we have to letterbox this image in order to leave the hotspot area uncropped?
  if (minFullBleedScale > maxScale) {
    // Yes :-( There is no way to protect the hot spot and still have full bleed, so we are letterboxing it
    method = "letterbox";
    var letterboxScale;

    // Determine a scale where the image fills one dimension of the container
    if (cropIsTaller) {
      letterboxScale = cropAspect / viewportAspect;
    } else {
      letterboxScale = 1.0;
    }

    var height = letterboxScale / cropAspect * viewportAspect;
    var width = letterboxScale;

    var top = 0, left = 0;
    switch(alignment.x){
      case "left":
        left = 0;
        break;
      case "right":
        left = -(width - (outImg.width + outImg.left));
        break;
      case "center":
        left = -(letterboxScale / 2 - outImg.width / 2 - outImg.left);
        break;
    }
    switch(spec.align.y){
      case "top":
        top = 0;
        break;
      case "bottom":
        top = -(height - (outImg.height + outImg.top));
        break;
      case "center":
        top = -(height / 2 - outImg.height / 2 - outImg.top);
        break;
    }
    outCrop = {
      width: letterboxScale,
      height: height,
      top: top,
      left: left
    }
  }
  else {
    // We are going full bleed! Now we need to determine which dimension of the image is fully displayed, and which is cropped
    if (cropIsTaller) {
      // TODO: Clamp hotspot offset to avoid moving image off canvas
      method = "full_width";

      var top = (-hotspot.y / cropAspect) * viewportAspect + 0.5;
      var height = minFullBleedScale / cropAspect * viewportAspect;
      // Clamp top so that we will not move the image off of the viewport
      if (top > 0) {
        top = 0
      } else if (-top > height - 1.0) {
        top = - (height - 1.0);
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

      var width = minFullBleedScale;
      var left = 0.5 - (hotspot.x * minFullBleedScale);
      if (left > 0) {
        left = 0;
      } else if (-left > width - 1.0) {
        left = - (width - 1.0);
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
  var containerAspect = readAspectRatio(options.container);
  var imageAspect     = readAspectRatio(options.image);
  var hotspot         = options.hotspot ? readHotspot(options.hotspot, imageAspect) : {x: 0.5, y: 0.5, height: 1, width: 1};
  var crop            = options.crop || { top: 0, right: 0, bottom: 0, left: 0 };
  var align           = options.align || {x: 'center', y: 'center'};

  var result = calculateHotSpotCrop(imageAspect, {hotspot: hotspot, crop: crop}, {
    aspect: containerAspect,
    align: align
  });

  return {
    debug: {
      result: result
    },
    image: {
      position: 'absolute',
      height: round(result.image.height*100) + '%',
      width: round(result.image.width*100) + '%',
      top: round(result.image.top*100) + '%',
      left: round(result.image.left*100) + '%'
    },
    crop: {
      position: 'absolute',
      overflow: 'hidden',
      height: round(result.crop.height*100) + '%',
      width: round(result.crop.width*100) + '%',
      top: round(result.crop.top*100) + '%',
      left: round(result.crop.left*100) + '%'
    },
    container: {
      //outline: '1px solid cyan',
      overflow: 'hidden',
      position: 'relative',
      width: '100%',
      height: round(100 / containerAspect) + '%'
    }
  }
};
