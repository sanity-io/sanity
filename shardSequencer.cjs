'use strict'

const Sequencer = require('@jest/test-sequencer').default

module.exports = class JestShardSequencer extends Sequencer {
  shard(tests) {
    return tests.filter((test) => !test.path.includes('e2e'))
  }
}
