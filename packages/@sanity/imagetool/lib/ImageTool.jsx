import React from "react";
import getBackingStoreRatio from "./getBackingStoreRatio";
import DraggableMixin from "./DraggableMixin";
import * as utils2d from "./2d/utils";
import {Size, Rect, Point} from "./2d/shapes";

// The margin available in all directions for drawing the crop tool
const MARGIN_PX = 28;
const CROP_HANDLE_SIZE = 12;
const HOTSPOT_HANDLE_SIZE = 10;

const CURSORS = require("./cursors.json");

function getCropCursorForHandle(handle) {
  switch (handle) {
    case 'left':
    case 'right':
      return 'col-resize';

    case 'top':
    case 'bottom':
      return 'row-resize';

    case 'topRight':
    case 'bottomLeft':
      return 'nesw-resize';

    case 'topLeft':
    case 'bottomRight':
      return 'nwse-resize';
  }
}

export default React.createClass({
  displayName: 'ImageTool',
  mixins: [DraggableMixin],

  getHotspotRect() {
    const {value, image} = this.props;

    const hotspot = new Rect()
        .setSize(value.hotspot)
        .setCenter(value.hotspot);

    return new Rect()
        .setSize(image)
        .shrink(MARGIN_PX * this.getScale())
        .multiply(hotspot);
  },

  getCropRect() {
    const {value, image} = this.props;

    return new Rect()
        .setSize(image)
        .shrink(MARGIN_PX * this.getScale())
        .cropRelative(Rect.fromEdges(value.crop).clamp(new Rect(0, 0, 1, 1)));
  },

  getCropHandles() {

    const inner = this.getCropRect();

    const handleSize = CROP_HANDLE_SIZE * this.getScale();

    const halfCropHandleSize = handleSize / 2;

    const cropHandle = new Rect(0, 0, handleSize, handleSize);
    return {
      left: cropHandle.setTopLeft(inner.left - halfCropHandleSize, inner.center.y - halfCropHandleSize),
      right: cropHandle.setTopLeft(inner.right - halfCropHandleSize, inner.center.y - halfCropHandleSize),

      top: cropHandle.setTopLeft(inner.center.x - halfCropHandleSize, inner.top - halfCropHandleSize),
      topLeft: cropHandle.setTopLeft(inner.left - halfCropHandleSize, inner.top - halfCropHandleSize),
      topRight: cropHandle.setTopLeft(inner.right - halfCropHandleSize, inner.top - halfCropHandleSize),

      bottom: cropHandle.setTopLeft(inner.center.x - halfCropHandleSize, inner.bottom - halfCropHandleSize),
      bottomLeft: cropHandle.setTopLeft(inner.left - halfCropHandleSize, inner.bottom - halfCropHandleSize),
      bottomRight: cropHandle.setTopLeft(inner.right - halfCropHandleSize, inner.bottom - halfCropHandleSize)
    };
  },

  getActiveCropHandleFor({x, y}) {
    const cropHandles = this.getCropHandles();

    return Object.keys(cropHandles).find(position => {
      return utils2d.isPointInRect({x, y}, cropHandles[position])
    });
  },

  componentDidDragStart({x, y}) {
    const mousePosition = {x: x * this.getScale(), y: y * this.getScale()};

    const inHotspot = utils2d.isPointInEllipse(mousePosition, this.getHotspotRect());

    const inDragHandle = utils2d.isPointInCircle(mousePosition, this.getDragHandleCoords());

    const activeCropHandle = this.getActiveCropHandleFor(mousePosition);

    const inCropRect = utils2d.isPointInRect(mousePosition, this.getCropRect());

    if (activeCropHandle) {
      return this.setState({cropping: activeCropHandle});
    }
    else if (inDragHandle) {
      return this.setState({resizing: true});
    }
    else if (inHotspot) {
      return this.setState({moving: true});
    }
    else if (inCropRect) {
      return this.setState({cropMoving: true});
    }
  },

  componentDidDrag(pos) {
    if (this.state.cropping) {
      return this.emitCrop(this.state.cropping, pos);
    }
    if (this.state.cropMoving) {
      return this.emitCropMove(pos);
    }
    if (this.state.moving) {
      return this.emitMove(pos);
    }
    if (this.state.resizing) {
      return this.emitResize(pos)
    }
  },

  componentDidDragEnd(pos) {
    this.setState({moving: false, resizing: false, cropping: false, cropMoving: false});
    const {hotspot, crop} = this.getClampedValue();

    this.emitChange({
      crop: {
        top: crop.top,
        left: crop.left,
        right: 1 - crop.right,
        bottom: 1 - crop.bottom
      },
      hotspot: {
        x: hotspot.center.x,
        y: hotspot.center.y,
        height: hotspot.height,
        width: hotspot.width
      }
    })
  },

  emitChange(value) {
    if (this.props.onChange) {
      this.props.onChange(value);
    }
  },
  emitMove(pos) {
    const {height, width} = this.props.image;
    const scale = this.getScale();
    const delta = {
      x: pos.x * scale / width,
      y: pos.y * scale / height
    };
    this.props.onMove(delta);
  },
  emitCropMove(pos) {
    const {height, width} = this.props.image;
    const scale = this.getScale();
    const delta = {};
    delta.left = pos.x * scale / width;
    delta.right = -pos.x * scale / width;

    delta.top = pos.y * scale / height;
    delta.bottom = -pos.y * scale / height;

    this.props.onCrop(delta);
  },
  emitCrop(side, pos) {
    const {height, width} = this.props.image;
    const scale = this.getScale();
    const delta = {};

    if (side == 'left' || side === 'topLeft' || side === 'bottomLeft') {
      delta.left = pos.x * scale / width;
    }
    else if (side == 'right' || side === 'topRight' || side === 'bottomRight') {
      delta.right = -pos.x * scale / width;
    }

    if (side == 'top' || side === 'topLeft' || side === 'topRight') {
      delta.top = pos.y * scale / height;
    }
    else if (side == 'bottom' || side === 'bottomLeft' || side === 'bottomRight') {
      delta.bottom = -pos.y * scale / height;
    }

    this.props.onCrop(delta);
  },

  emitResize(pos) {
    const {height, width} = this.props.image;
    const scale = this.getScale();

    const delta = {
      x: pos.x * scale * 2 / width,
      y: pos.y * scale * 2 / height
    };
    this.props.onResize({height: delta.y, width: delta.x});
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

  getInitialState() {
    return {
      devicePixelVsBackingStoreRatio: null,
      cropping: false,
      cropMoving: false,
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

  getClampedValue() {
    const value = this.props.value;

    const crop = Rect.fromEdges(value.crop)
        .clamp(new Rect(0, 0, 1, 1));

    const hotspot = new Rect(0, 0, 1, 1)
      .setSize(value.hotspot)
      .setCenter(value.hotspot)
      .clamp(crop);

    return {crop: crop, hotspot: hotspot}
  },

  paintHotspot(context) {

    const {image} = this.props;

    const imageRect = new Rect().setSize(image);

    const {hotspot, crop} = this.getClampedValue();

    const scale = this.getScale();
    const margin = MARGIN_PX * scale;

    context.save();
    drawBackdrop();
    drawEllipse();
    context.clip();
    drawHole();
    context.restore();
    drawDragHandle(Math.PI*1.25);

    function drawEllipse() {
      context.save();

      const dest = imageRect
          .shrink(margin)
          .multiply(hotspot);

      const scaleY = dest.height / dest.width;

      context.scale(1, scaleY);
      context.beginPath();
      context.globalAlpha = 0.8;
      context.arc(dest.center.x, (dest.center.y / scaleY), Math.abs(dest.width / 2), 0, 2 * Math.PI, false);
      context.strokeStyle = "white";
      context.lineWidth = 1.5 * scale;
      context.stroke();
      context.closePath();

      context.restore();
    }

    function drawImage(...args) {
      context.save();
      context.drawImage(image, ...args);
      context.restore();
    }

    function drawHole() {

      const src = imageRect.multiply(hotspot);

      const dest = imageRect
          .shrink(margin)
          .multiply(hotspot);

      drawImage(src.left, src.top, src.width, src.height, dest.left, dest.top, dest.width, dest.height);
    }

    function drawBackdrop() {

      const src = imageRect
          .cropRelative(crop);

      const dest = imageRect
          .shrink(margin)
          .cropRelative(crop);

      context.save();
      drawImage(src.left, src.top, src.width, src.height, dest.left, dest.top, dest.width, dest.height);
      context.globalAlpha = 0.5;
      context.fillStyle = 'black';
      context.fillRect(dest.left, dest.top, dest.width, dest.height);
      context.restore();
    }

    function drawDragHandle(radians) {
      context.save();

      const radius = HOTSPOT_HANDLE_SIZE * scale;
      const dest = imageRect
          .shrink(margin)
          .multiply(hotspot);

      const point = utils2d.getPointAtCircumference(radians, dest);

      context.beginPath();
      context.arc(point.x, point.y, radius, 0, 2 * Math.PI, false);
      context.fillStyle = "rgb(255,255,255)";
      context.fill();
      context.closePath();
      context.restore();

      context.beginPath();
      context.arc(point.x, point.y, radius, 0, 2 * Math.PI, false);
      context.strokeStyle = "rgb(0, 0, 0)";
      context.lineWidth = 0.5 * scale;
      context.stroke();
      context.closePath();

    }
  },

  getActualSize() {
    const node = this.getDOMNode();
    return {height: node.clientHeight, width: node.clientWidth};
  },

  getDragHandleCoords() {
    const bbox = this.getHotspotRect();
    const point = utils2d.getPointAtCircumference(Math.PI * 1.25, bbox);
    return {
      x: point.x,
      y: point.y,
      radius: 8 * this.getScale()
    }
  },

  debug(context) {
    context.save();

    const {image} = this.props;

    const bbox = this.getHotspotRect();
    const scale = this.getScale();
    const margin = MARGIN_PX * scale;

    context.setLineDash([2 * scale, 2 * scale]);
    context.lineWidth = 0.5 * scale;

    context.strokeStyle = 'rgba(200, 200, 200, 0.5)';

    // --- center line x
    vline(bbox.center.x);
    // --- center line y
    hline(bbox.center.y);

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
  paintBackground(context) {
    const {image} = this.props;
    const inner = new Rect()
        .setSize(image)
        .shrink(MARGIN_PX * this.getScale());

    context.save();
    context.fillStyle = 'white';
    context.clearRect(0, 0, image.width, image.height);

    context.globalAlpha = 0.3;
    //context.globalCompositeOperation = 'lighten';

    context.drawImage(image, inner.left, inner.top, inner.width, inner.height);
    context.restore();
  },

  paint(context) {
    context.save();

    const pxratio = this.state.devicePixelVsBackingStoreRatio;
    context.scale(pxratio, pxratio);

    this.paintBackground(context);
    //return context.restore();
    this.paintHotspot(context);
    //this.paintDragHandle(context);
    this.debug(context);
    this.paintCropBorder(context)

    if (this.state.mousePosition) {
      //this.paintMousePosition(context)
      this.highlightCropHandles(context)
    }

    context.restore();
  },

  paintMousePosition(context) {
    const {x, y} = this.state.mousePosition;
    context.beginPath();
    context.arc(x, y, 14 * this.getScale(), 0, 2 * Math.PI, false);
    context.fillStyle = 'lightblue';
    context.fill();
    context.restore();
  },

  paintCropBorder(context) {
    const cropRect = this.getCropRect();
    context.save();
    context.beginPath();
    context.fillStyle = `rgba(66, 66, 66, 0.9)`;
    context.lineWidth = 1;
    context.rect(cropRect.left, cropRect.top, cropRect.width, cropRect.height);
    context.stroke();
    context.closePath();
    context.restore();
  },

  highlightCropHandles(context) {
    context.save();
    const crophandles = this.getCropHandles();

    //context.globalCompositeOperation = "difference";

    Object.keys(crophandles).forEach(handle => {
      context.fillStyle = this.state.cropping === handle ? `rgba(202, 54, 53, 0.9)` : `rgba(230, 230, 230, 0.9)`;
      const {left, top, height, width} = crophandles[handle];
      context.fillRect(left, top, width, height);
      context.beginPath();
      context.fillStyle = `rgba(66, 66, 66, 0.9)`;
      context.rect(left, top, width, height);
      context.closePath();
      context.stroke();

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

    const activeCropArea = this.state.cropping || this.getActiveCropHandleFor(mousePosition);
    if (activeCropArea) {
      return getCropCursorForHandle(activeCropArea)
    }

    const mouseOverDragHandle = utils2d.isPointInCircle(mousePosition, this.getDragHandleCoords());

    if (this.state.resizing || mouseOverDragHandle) {
      return 'move';
    }

    if (this.state.moving || this.state.cropMoving) {
      return `url(${CURSORS.closedhand}), move`;
    }

    const mouseoverHotspot = utils2d.isPointInEllipse(mousePosition, this.getHotspotRect());
    const mouseoverCropRect = utils2d.isPointInRect(mousePosition, this.getCropRect());
    if (mouseoverHotspot || mouseoverCropRect) {
      return `url(${CURSORS.openhand}), move`;
    }
    return 'auto';
  },
  render() {
    const {height, width} = this.props.image;
    const ratio = this.state.devicePixelVsBackingStoreRatio;

    const style = {
      width: '100%',
      cursor: this.getCursor()
      //outline: '1px dotted cyan'
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