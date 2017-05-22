const getRandomValues = require('get-random-values')
const Base62 = require('base62')

const NUM_GROUPS = 4

// WHATWG crypto RNG - https://w3c.github.io/webcrypto/Overview.html
function whatwgRNG(length) {
  const buf = new ArrayBuffer(length)
  const rnds = new Uint32Array(buf)
  getRandomValues(new Uint8Array(buf))
  return rnds
}

module.exports = function Uid() {
  const rnds = whatwgRNG(NUM_GROUPS * 4)
  let uid = Base62.encode(rnds[0])
  for (let i = 1; i < rnds.length; i++) {
    uid = uid + '-' + Base62.encode(rnds[i])
  }
  return uid
}
