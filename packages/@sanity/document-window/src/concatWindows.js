const Constants = require('./Constants')

// @todo Optimize this to cut down on iteration
const concatWindows = (winA, winB, end = Constants.REAR) => {
  const idsInA = winA.map((item) => item._id)
  const itemsToMerge = winB.filter((item) => !idsInA.includes(item._id))
  const items = end === Constants.FRONT ? itemsToMerge.concat(winA) : winA.concat(itemsToMerge)

  return items
}

module.exports = concatWindows
