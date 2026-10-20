// The E9 field marks model (fieldmarks/markModel.ts): tally, array kinds, arbitration. Pure, no studio needed. node journeys/verify-marks-model.mts
import {arrayKinds, claimsOf, describe, sum, tally, unknownKeys} from '../fieldmarks/markModel.ts'
let failed = 0
const ok = (name: string, pass: boolean, note = '') => {
  console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${note ? ` - ${note}` : ''}`)
  if (!pass) failed++
}
const s = (key: string, heading: string, text: string) => ({_type: 'section', _key: key, heading, text})
const base = {title: 'A', settings: {meta: {owner: 'o', region: 'EU'}}, tags: ['alpha', 'beta', 'gamma', 'delta'], sections: [s('s1', 'One', 'same'), s('s2', 'Two', 'base'), s('s3', 'Three', 'gone')]}
const cur = {
  title: 'A',
  settings: {meta: {owner: 'o', region: 'Nordics'}},
  tags: ['delta', 'alpha', 'beta', 'epsilon'],
  sections: [s('s2', 'Two', 'base'), s('s1', 'One', 'changed'), s('s4', 'Four', 'new')],
}
ok('equal values tally zero', sum(tally(base, base)) === 0)
ok('a nested change counts one', sum(tally(base.settings, cur.settings)) === 1, JSON.stringify(tally(base.settings, cur.settings)))
const tags = tally(base.tags, cur.tags)
ok('tags: one added, one removed, one moved', tags.added === 1 && tags.removed === 1 && tags.moved === 1 && tags.changed === 0, JSON.stringify(tags))
const secs = arrayKinds(base.sections, cur.sections)
ok('sections: s2 moved, s1 changed, s4 added, s3 removed', secs.kinds.join() === 'moved,changed,added' && secs.removed.length === 1, `${secs.kinds.join()} removed=${secs.removed.length}`)
const total = tally(base, cur)
ok('the document rolls up every leaf change', sum(total) === 1 + (1 + 1 + 1) + (1 + 1 + 1 + 1), JSON.stringify(total))
const c = claimsOf(base.title, base.title, 'B', true, true)
ok('changed outranks differs from base, both are listed', c.top?.kind === 'changed' && c.all.length === 2)
ok('no published counterpart: differs from base is the top claim', claimsOf(undefined, base.title, 'B', false, true).top?.kind === 'differs')
ok('same as both: no claim', claimsOf('A', 'A', 'A', true, true).top === null)
ok('unknown keys are the ones the schema does not know', unknownKeys({_id: 'x', title: 't', legacyNote: 'n'}, ['title']).join() === 'legacyNote')
ok('describe reads a portable text block', describe({_type: 'block', children: [{text: 'Hello '}, {text: 'world'}]}) === 'Hello world')
process.exit(failed ? 1 : 0)
