import getOffsetsTo from './getOffsetsTo'

function getRelativeRect(element, parent) {
  return {
    ...getOffsetsTo(element, parent),
    width: element.offsetWidth,
    height: element.offsetHeight
  }
}

export default getRelativeRect
