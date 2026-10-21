// The compare model (compare/address.ts): reading and writing comparisons in the structure URL. Pure. node journeys/verify-compare-model.mts
import {closePath, compareKind, compareTitle, isOneMove, openBesidePath, readComparison, setAgainstPath} from '../compare/address.ts'
let failed = 0
const ok = (name: string, pass: boolean, note = '') => { console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${note ? ` - ${note}` : ''}`); if (!pass) failed++ }
const g = {perspective: 'drafts', variant: 'aud-returning-visitors'}
// The one-dimension cap (E checks it in the pane bar and in the global bar, since the global bar no longer sees the Against side).
ok('one move: the same variant in another layer', isOneMove(g, {perspective: 'published', variant: g.variant}))
ok('one move: another variant in the same layer', isOneMove(g, {perspective: 'drafts', variant: 'aud-members'}))
ok('two moves are refused', !isOneMove(g, {perspective: 'published', variant: 'aud-members'}))
const one = '/structure/e9Case;e9-visitors'
const opened = openBesidePath(one, 'e9-visitors', {perspective: 'published', variant: 'aud-members'}, g)!
ok('open beside appends one group', decodeURIComponent(opened) === '/structure/e9Case;e9-visitors;e9-visitors,localPerspective=published,localVariant=aud-members', decodeURIComponent(opened))
const c = readComparison(opened, g)
ok('the comparison reads back', c?.docId === 'e9-visitors' && c.showing.variant === g.variant && c.against.variant === 'aud-members' && c.against.perspective === 'published')
const again = openBesidePath(opened, 'e9-visitors', {perspective: 'drafts', variant: 'none'}, g)!
ok('a second open beside replaces the Against pane', readComparison(again, g)?.groups.length === 3 && readComparison(again, g)?.against.variant === 'none')
ok('close removes the Against pane', closePath(opened, g) === '/structure/e9Case;e9-visitors' || decodeURIComponent(closePath(opened, g)!) === '/structure/e9Case;e9-visitors')
ok('no comparison for a plain rack', readComparison(one, g) === null)
ok('setAgainst changes only the last group', decodeURIComponent(setAgainstPath(c!, {perspective: 'drafts', variant: 'aud-members'})).endsWith('localPerspective=drafts,localVariant=aud-members'))
const isLocale = (v: string) => v.startsWith('loc-')
ok('variant against variant is "Comparing variants"', compareTitle(compareKind(g, {perspective: 'drafts', variant: 'aud-members'}, isLocale), g, g) === 'Comparing variants')
ok('locale against base is "Comparing translations"', compareKind({perspective: 'drafts', variant: 'none'}, {perspective: 'drafts', variant: 'loc-da-dk'}, isLocale) === 'translations')
ok('same variant, Published against: "Seeing what changed since Published"', compareTitle('layer', g, {perspective: 'published', variant: g.variant}) === 'Seeing what changed since Published')
ok('two dimensions are refused', compareKind(g, {perspective: 'published', variant: 'aud-members'}, isLocale) === 'refused')
process.exit(failed ? 1 : 0)
