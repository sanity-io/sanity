import Matcher from '../src/jsonpath/Matcher'
import PlainProbe from '../src/jsonpath/PlainProbe'

// Just a couple of basic tests to check that basic object descent works.
// The real hardcore testing of the matcher is done indirectly in the
// 'patch' test.
test('basic path match', () => {
  const mx = Matcher.fromPath('a.b').setPayload('My Patch')
  const r1: any = mx.match(new PlainProbe({a: {b: 1}}))
  // console.log("r1", JSON.stringify(r1, null, 0))
  expect(r1.leads[0].target.name()).toBe('a')
  expect(r1.delivery).toBe(undefined)
  const r2 = r1.leads[0].matcher.match(new PlainProbe({b: 1}))
  // console.log("r2", JSON.stringify(r2, null, 0), 'wtf')
  expect(r2.leads.length).toBe(0)
  expect(r2.delivery.targets[0].name()).toBe('b')
  expect(r2.delivery.payload).toBe('My Patch')
})

// TODO: Fix recursion
// test('recursive path match', tap => {
//   const mx = Matcher.fromPath('..b').setPayload('My Patch')
//   const r1 = mx.match(new PlainProbe({a: {b: 1}}))
//   console.log("r1", JSON.stringify(r1, null, 0))
//   tap.equal(r1.leads[0].target.name(), 'a')
//   tap.notOk(r1.delivery)
//   const r2 = r1.leads[0].matcher.match(new PlainProbe({b: 1}))
//   console.log("r2", JSON.stringify(r2, null, 0), 'wtf')
//   tap.equal(r2.leads.length, 0)
//   tap.equal(r2.delivery.targets[0].name(), 'b')
//   tap.equal(r2.delivery.payload, 'My Patch')
//   tap.end()
// })
