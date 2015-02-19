import React from "react";
import getBackingStoreRatio from "./getBackingStoreRatio";
import DraggableMixin from "./DraggableMixin";

// The margin available in all directions for drawing the crop tool
const MARGIN_PX = 0;
const CROP_HOT_AREA = 10;

const CURSORS = require("./cursors.json");

export default React.createClass({
  displayName: 'ImageTool',
  mixins: [DraggableMixin],

  getHotspotBounds() {
    const {hotspot} = this.props.value;
    const {image} = this.props;
    const margin = MARGIN_PX * this.getScale();

    const innerHeight = (image.height - margin * 2);
    const innerWidth = (image.width - margin * 2);
    const height = hotspot.height * innerHeight;
    const width = hotspot.width * innerWidth;

    const x = margin + hotspot.x * innerWidth;
    const y = margin + hotspot.y * innerHeight;

    const left = x - width / 2;
    const top = y - height / 2;
    const right = x + width / 2;
    const bottom = y + height / 2;

    return { x, y, height, width, left, top, right, bottom }
  },

  getCropRect(minThickness=0) {
    const {crop} = this.props.value;
    const {image} = this.props;

    const margin = MARGIN_PX * this.getScale();

    const innerHeight = image.height - margin*2;
    const innerWidth = image.width - margin*2;

    const top = Math.max(minThickness, crop.top * innerHeight);
    const bottom = innerHeight - Math.max(minThickness, crop.bottom * innerHeight);
    const left = Math.max(minThickness, crop.left * innerWidth);
    const right = innerWidth - Math.max(minThickness, crop.right * innerWidth);
    return {
      top, bottom, left, right
    }
  },

  getCropHandles(minThickness=0) {
    const margin = MARGIN_PX * this.getScale();

    const {top, bottom, left, right} = this.getCropRect(minThickness);
    const {image} = this.props;

    const innerHeight = image.height - margin*2;
    const innerWidth = image.width - margin*2;

    return {
      left: {
        left: 0, top: 0, width: margin + left, height: innerHeight + margin*2
      },
      right: {
        left: right + margin, top: 0, width: innerWidth - right+margin, height: innerHeight + margin*2
      },
      top: {
        left: 0, top: 0, width: innerWidth+margin*2, height: margin + top
      },
      bottom: {
        left: 0, top: bottom + margin, width: innerWidth + margin * 2, height: innerHeight - bottom + margin
      }
    };
  },

  getActiveCropHandlesFor({x, y}) {
    const cropHandles = this.getCropHandles(CROP_HOT_AREA*this.getScale());
    return Object.keys(cropHandles).reduce((handles, align)=> {
      if (this.contains(cropHandles[align], {x, y})) {
        return handles.concat(align);
      }
      return handles;
    }, []);
  },

  contains(rect, point) {
    return point.x >= rect.left && point.x <= rect.left + rect.width && point.y >= rect.top && point.y <= rect.top + rect.height;
  },

  componentDidDragStart({x, y}) {
    const pos = {x: x * this.getScale(), y: y * this.getScale()};
    const hotspot = this.getHotspotBounds();
    const inHotspot = this.isPointInEllipse(pos, hotspot);

    const dragHandle = this.getDragHandleCoords();

    const inDragHandle = this.isPointInCircle(pos, dragHandle);

    const activeCropHandles = this.getActiveCropHandlesFor(pos);

    if (activeCropHandles.length) {
      return this.setState({cropping: activeCropHandles});
    }
    else if (inDragHandle) {
      return this.setState({resizing: true});
    }
    else if (inHotspot) {
      return this.setState({moving: true});
    }
  },

  componentDidDrag(pos) {
    if (this.state.cropping.length) {
      return this.crop(this.state.cropping, pos);
    }
    if (this.state.moving) {
      return this.move(pos);
    }
    if (this.state.resizing) {
      return this.resize(pos)
    }
  },

  componentDidDragEnd(pos) {
    this.setState({moving: false, resizing: false, cropping: []})
  },

  handleMouseMove(event) {
    const clientRect = event.target.getBoundingClientRect();
    this.setState({
      mousePosition: {
        x: (event.clientX - clientRect.left) * this.getScale(),
        y: (event.clientY - clientRect.top) * this.getScale()
      }
    });
  },

  handleMouseOut() {
    this.setState({mousePosition: null});
  },

  move(pos) {
    const {height, width} = this.props.image;
    const scale = this.getScale();
    const delta = {
      x: pos.x * scale / width,
      y: pos.y * scale / height
    };
    this.props.onMove(delta);
  },

  crop(sides, pos) {
    const {height, width} = this.props.image;
    const scale = this.getScale();
    const delta = {};
    sides.forEach((side)=> {
      if (side == 'left') {
        delta[side] = pos.x * scale / width;
      }
      else if (side == 'right') {
        delta[side] = -pos.x * scale / width;
      }
      else if (side == 'top') {
        delta[side] = pos.y * scale / height;
      }
      else if (side == 'bottom') {
        delta[side] = -pos.y * scale / height;
      }
    });

    this.props.onCrop(delta);
  },

  resize(pos) {
    const {height, width} = this.props.image;
    const scale = this.getScale();

    const delta = {
      x: pos.x * scale * 2 / width,
      y: pos.y * scale * 2 / height
    };
    this.props.onResize({height: delta.y, width: delta.x});
  },

  isPointInCircle({x, y}, circle) {
    return Math.pow(x - circle.x, 2) + Math.pow(y - circle.y, 2) < Math.pow(circle.radius, 2);
  },

  isPointInEllipse(point, ellipse) {
    const center = {x: ellipse.x, y: ellipse.y};
    const xradius = ellipse.width / 2;
    const yradius = ellipse.height / 2;

    if (xradius <= 0 || yradius <= 0) {
      return false;
    }

    const normalized = {x: point.x - center.x, y: point.y - center.y};

    return Math.pow(normalized.x, 2) / Math.pow(xradius, 2) + Math.pow(normalized.y, 2) / Math.pow(yradius, 2) <= 1;
  },

  getInitialState() {
    return {
      devicePixelVsBackingStoreRatio: null,
      cropping: [],
      dragging: false,
      moving: false
    };
  },

  componentDidMount() {
    this.setState({
      devicePixelVsBackingStoreRatio: this.getDevicePixelVsBackingStoreRatio(this.getDOMNode().getContext('2d'))
    });
  },

  getDevicePixelVsBackingStoreRatio(context) {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const backingStoreRatio = getBackingStoreRatio(context) || 1;
    return devicePixelRatio / backingStoreRatio;
  },

  paintDragHandle(context) {
    const {x, y, radius} = this.getDragHandleCoords();
    context.beginPath();
    context.arc(x, y, radius + 1*this.getScale(), 0, 2 * Math.PI, false);
    context.strokeStyle = "rgb(0, 0, 0)";
    context.lineWidth = 0.5 * this.getScale();
    context.stroke();
    context.closePath();

    context.beginPath();
    context.arc(x, y, radius, 0, 2 * Math.PI, false);
    context.fillStyle = "rgb(255,255,255)";
    context.fill();
    context.closePath();
  },

  paintHotspot(context) {
    context.save();

    const image = this.props.image;
    const margin = MARGIN_PX * this.getScale();

    const cropRect = this.getCropRect();

    const sx = margin + cropRect.left;
    const sy = margin + cropRect.top;
    const sw = image.width - (image.width - cropRect.right) - cropRect.left;
    const sh = image.height - (image.height - cropRect.bottom) - cropRect.top;
    const dx = margin + cropRect.left;
    const dy = margin + cropRect.top;
    const dw = image.width - (image.width - cropRect.right) - cropRect.left;
    const dh = image.height - (image.height - cropRect.bottom) - cropRect.top;

    const drawImage = ()=> {
      context.save();
      context.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
      context.restore();
    };

    const drawEllipse = ()=> {
      context.save();
      const bbox = this.getHotspotBounds();
      const scaleY = bbox.height / bbox.width;
      context.scale(1, scaleY);
      context.beginPath();
      context.globalAlpha = 0.8;
      context.arc(bbox.x, (bbox.y / scaleY), Math.abs(bbox.width / 2), 0, 2 * Math.PI, false);
      context.strokeStyle = "white";
      context.lineWidth = 1.5 * this.getScale();
      context.stroke();
      context.closePath();
      context.restore();
    };

    const drawBackdrop = ()=> {
      context.save();
      drawImage();
      context.globalAlpha = 0.5;
      context.fillStyle = 'black';
      context.fillRect(sx, sy, sw, sh);
      context.restore();
    };

    drawBackdrop();
    drawEllipse();
    context.clip();
    drawImage();

    context.restore();
  },

  getActualSize() {
    const node = this.getDOMNode();
    return {height: node.clientHeight, width: node.clientWidth};
  },

  getDragHandleCoords() {
    const bbox = this.getHotspotBounds();
    return {
      x: bbox.right,
      y: bbox.y,
      radius: 8*this.getScale()
    }
  },

  debug(context) {
    context.save();

    const {image} = this.props;

    const bbox = this.getHotspotBounds();
    const scale = this.getScale();
    const margin = MARGIN_PX * scale;

    context.setLineDash([2*scale, 2*scale]);
    context.lineWidth = 0.5*scale;

    context.strokeStyle = 'rgba(200, 200, 200, 0.5)';

    // --- center line x
    vline(bbox.x);
    // --- center line y
    hline(bbox.y);

    context.strokeStyle = 'rgba(150, 150, 150, 0.5)';
    // --- line top
    hline(bbox.top);

    // --- line bottom
    hline(bbox.bottom);

    // --- line left
    vline(bbox.left);
    // --- line right
    vline(bbox.right);

    context.restore();

    function vline(x) {
      line(x, margin, x, image.height - margin);
    }

    function hline(y) {
      line(margin, y, image.width - margin, y);
    }

    function line(x1, y1, x2, y2) {
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);
      context.stroke();
      context.closePath();
    }
  },

  hatchRect(context, rect) {
    context.save();
    context.strokeStyle = 'rgba(200, 200, 200, 0.5)';
    const scale = this.getScale();
    context.lineWidth = scale;

    const step =  6 * scale;

    const drawHatchedLine = (x)=> {
      context.moveTo(rect.left+x+step, rect.top);
      context.lineTo(rect.left+x, rect.top + rect.height);
    };
    context.beginPath();
    let x = rect.left;
    while (x < (rect.left + rect.width+step)){
      drawHatchedLine(x);
      x += step;
    }
    context.closePath();
    context.stroke();
    context.restore();
  },

  paintBackground(context) {
    const {image} = this.props;
    context.fillStyle = 'white';

    context.clearRect(0, 0, image.width, image.height)
    this.hatchRect(context, {
      left: 0, top: 0, height: image.height, width: image.width
    });
  },

  paint(context) {
    context.save();

    const pxratio = this.state.devicePixelVsBackingStoreRatio;
    context.scale(pxratio, pxratio);

    this.paintBackground(context);
    //return context.restore();
    this.paintHotspot(context);
    this.paintDragHandle(context);
    this.debug(context);

    if (this.state.mousePosition) {
      //this.paintMousePosition(context)
      this.highlightCropHandles(context)
    }

    context.restore();
  },

  paintMousePosition(context) {
    const {x, y} = this.state.mousePosition;
    context.save();
    context.beginPath();
    context.arc(x, y, 4*this.getScale(), 0, 2 * Math.PI, false);
    context.fillStyle = 'lightblue';
    context.fill();
    context.restore();
  },

  highlightCropHandles(context) {
    context.save();
    const crophandles = this.getCropHandles(CROP_HOT_AREA*this.getScale());

    //context.globalCompositeOperation = "difference";

    Object.keys(crophandles).forEach(handle => {
      context.fillStyle = `rgba(200, 200, 200, 0.4)`;
      const {left, top, height, width} = crophandles[handle];

      context.fillRect(left, top, width, height);
    });
    context.restore();

  },
  getScale() {
    const actualSize = this.getActualSize();
    return this.props.image.width / actualSize.width
  },
  componentDidUpdate() {
    const context = this.getDOMNode().getContext('2d');
    this.paint(context);
  },
  getCursor() {
    const {mousePosition} = this.state;
    if (!mousePosition) {
      return 'auto';
    }
    const activeCropHandles = this.getActiveCropHandlesFor(mousePosition);
    if (activeCropHandles.length) {
      if (activeCropHandles.indexOf('top') > -1) {
        if (activeCropHandles.indexOf('left') > -1) {
          return 'nwse-resize';
        }
        else if (activeCropHandles.indexOf('right') > -1) {
          return 'nesw-resize';
        }
        return 'row-resize'
      }
      else if (activeCropHandles.indexOf('bottom') > -1) {
        if (activeCropHandles.indexOf('left') > -1) {
          return 'nesw-resize';
        }
        else if (activeCropHandles.indexOf('right') > -1) {
          return 'nwse-resize';
        }
        return 'row-resize'
      }
      return 'col-resize';
    }

    const mouseOverDragHandle = this.isPointInCircle(mousePosition, this.getDragHandleCoords());

    if (this.state.resizing || mouseOverDragHandle) {
      return 'move';
    }

    if (this.state.moving) {
      return `url(${CURSORS.closedhand}), move`;
    }

    const mouseoverHotspot = this.isPointInEllipse(mousePosition, this.getHotspotBounds());
    if (mouseoverHotspot) {
      return `url(${CURSORS.openhand}), move`;
    }
    return 'auto';
  },
  render() {
    const {height, width} = this.props.image;
    const ratio = this.state.devicePixelVsBackingStoreRatio;

    const style = {
      width: '100%',
      cursor: this.getCursor(),
      border: '1px solid gray'
    };
    return (
      <canvas
        onMouseMove={this.handleMouseMove}
        onMouseOut={this.handleMouseOut}
        style={style}
        height={height * ratio}
        width={width * ratio}
      />
    );
  }
});