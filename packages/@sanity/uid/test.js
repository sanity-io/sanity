const Uid = require('./')

const generated = Object.create(null)

const NUM_RUNS = 10000000

let run = NUM_RUNS
while (run--) {
  const uid = Uid()
  if (uid in generated) {
    throw new Error(`Collision! ${uid}`)
  }
  generated[uid] = 0
}
