
export function isPointInEllipse(point, ellipse) {
  const center = {x: ellipse.center.x, y: ellipse.center.y};
  const xradius = ellipse.width / 2;
  const yradius = ellipse.height / 2;

  if (xradius <= 0 || yradius <= 0) {
    return false;
  }

  const normalized = {x: point.x - center.x, y: point.y - center.y};

  return Math.pow(normalized.x, 2) / Math.pow(xradius, 2) + Math.pow(normalized.y, 2) / Math.pow(yradius, 2) <= 1;
}

export function isPointInCircle({x, y}, circle) {
  return Math.pow(x - circle.x, 2) + Math.pow(y - circle.y, 2) < Math.pow(circle.radius, 2);
}

export function isPointInRect(point, rect) {
  return point.x >= rect.left && point.x <= rect.left + rect.width && point.y >= rect.top && point.y <= rect.top + rect.height;
}

export function getPointAtCircumference(radians, ellipse) {
  return {
    x: ellipse.center.x - ellipse.width / 2 * Math.cos(radians),
    y: ellipse.center.y - ellipse.height / 2 * Math.sin(radians)
  };
}
