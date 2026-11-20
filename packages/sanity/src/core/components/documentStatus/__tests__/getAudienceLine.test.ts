import {type ReleaseDocument} from '@sanity/client'
import {describe, expect, it} from 'vitest'

import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {getAudienceLine} from '../getAudienceLine'
import {type DocumentVersionStatusItem} from '../sortDocumentVersionsForStatus'

const GROUP_ID = 'article-1'
const NOW = Date.parse('2026-11-17T12:00:00.000Z')
const TWO_HOURS_AGO = '2026-11-17T10:00:00.000Z'
const THREE_WEEKS_AGO = '2026-10-27T12:00:00.000Z'
const FRIDAY = '2026-11-28T09:00:00.000Z'
const DECEMBER = '2026-12-05T09:00:00.000Z'

function release(
  name: string,
  title: string,
  metadata: Partial<ReleaseDocument['metadata']>,
  rest: Partial<ReleaseDocument> = {},
): ReleaseDocument {
  return {
    _id: `_.releases.${name}`,
    _type: 'system.release',
    _rev: `${name}-rev`,
    _createdAt: '2026-11-01T00:00:00.000Z',
    _updatedAt: '2026-11-01T00:00:00.000Z',
    name,
    state: 'active',
    ...rest,
    metadata: {title, releaseType: 'asap', ...metadata},
  }
}

const blackFriday = release(
  'rBlackFriday',
  'Black Friday',
  {releaseType: 'scheduled', intendedPublishAt: FRIDAY},
  {state: 'scheduled', publishAt: FRIDAY},
)
const winterSale = release(
  'rWinter',
  'Winter sale',
  {releaseType: 'scheduled', intendedPublishAt: DECEMBER},
  {state: 'scheduled', publishAt: DECEMBER},
)
const autumnCatalogue = release('rAutumn', 'Autumn catalogue', {releaseType: 'undecided'})
const asapRelease = release('rAsap', 'Fixes', {releaseType: 'asap'})
const wentOut = release(
  'rBlackFriday',
  'Black Friday',
  {releaseType: 'scheduled', intendedPublishAt: TWO_HOURS_AGO},
  {state: 'scheduled', publishAt: TWO_HOURS_AGO},
)

function stub(id: string, updatedAt: string, system: Partial<VersionInfoDocumentStub['_system']>) {
  return {
    _id: id,
    _type: 'article',
    _rev: `${id}-rev`,
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: updatedAt,
    _system: {group: {_ref: GROUP_ID, _weak: true}, ...system},
  } as VersionInfoDocumentStub
}

const published = (updatedAt = THREE_WEEKS_AGO): DocumentVersionStatusItem => ({
  version: stub(GROUP_ID, updatedAt, {}),
})
const draft = (updatedAt = TWO_HOURS_AGO): DocumentVersionStatusItem => ({
  version: stub(`drafts.${GROUP_ID}`, updatedAt, {bundleId: 'drafts'}),
})
const inRelease = (rel: ReleaseDocument, updatedAt = TWO_HOURS_AGO): DocumentVersionStatusItem => ({
  version: stub(`versions.${rel.name}.${GROUP_ID}`, updatedAt, {
    bundleId: rel.name,
    release: {_ref: rel._id, _weak: true},
  }),
  release: rel,
})

function line(...items: DocumentVersionStatusItem[]) {
  return getAudienceLine({items}, NOW)
}

describe('getAudienceLine', () => {
  it('published only: "Published 3 wk ago"', () => {
    expect(line(published())).toEqual({lead: {kind: 'published', at: THREE_WEEKS_AGO}})
  })

  it('published and a draft: "Unpublished edits · 2 hr ago"', () => {
    expect(line(published(), draft())).toEqual({
      lead: {kind: 'unpublished-edits'},
      detail: {kind: 'time-ago', at: TWO_HOURS_AGO},
    })
  })

  it('draft only: "Not published yet · edited 2 hr ago"', () => {
    expect(line(draft())).toEqual({
      lead: {kind: 'not-published-yet'},
      detail: {kind: 'edited', at: TWO_HOURS_AGO},
    })
  })

  it('published and in a scheduled release: "Update scheduled Fri 28 Nov, 9:00 · Black Friday"', () => {
    expect(line(published(), inRelease(blackFriday))).toEqual({
      lead: {kind: 'update-scheduled', release: blackFriday},
      detail: {kind: 'release-name', release: blackFriday},
    })
  })

  it('only in a scheduled release: "First publish scheduled Fri 28 Nov, 9:00 · Black Friday"', () => {
    expect(line(inRelease(blackFriday))).toEqual({
      lead: {kind: 'first-publish-scheduled', release: blackFriday},
      detail: {kind: 'release-name', release: blackFriday},
    })
  })

  it('published, a draft and a scheduled release: "Update scheduled … · unpublished edits"', () => {
    expect(line(published(), draft(), inRelease(blackFriday))).toEqual({
      lead: {kind: 'update-scheduled', release: blackFriday},
      detail: {kind: 'unpublished-edits'},
    })
  })

  it('in two releases, one scheduled: "First publish scheduled … · +1 release"', () => {
    expect(line(inRelease(autumnCatalogue), inRelease(blackFriday))).toEqual({
      lead: {kind: 'first-publish-scheduled', release: blackFriday},
      detail: {kind: 'more-releases', count: 1},
    })
  })

  it('in two scheduled releases: the earliest date leads', () => {
    expect(line(published(), inRelease(winterSale), inRelease(blackFriday))).toEqual({
      lead: {kind: 'update-scheduled', release: blackFriday},
      detail: {kind: 'more-releases', count: 1},
    })
  })

  it('published, and a scheduled release that has gone out: "Updated 2 hr ago · Black Friday"', () => {
    expect(line(published(TWO_HOURS_AGO), inRelease(wentOut, THREE_WEEKS_AGO))).toEqual({
      lead: {kind: 'updated', at: TWO_HOURS_AGO},
      detail: {kind: 'release-name', release: wentOut},
    })
  })

  it('says "Published" when the document was published again after the release went out', () => {
    const later = '2026-11-17T11:30:00.000Z'
    expect(line(published(later), inRelease(wentOut))).toEqual({
      lead: {kind: 'published', at: later},
    })
  })

  it('only in an unscheduled release: "Not published yet · in Autumn catalogue"', () => {
    expect(line(inRelease(autumnCatalogue))).toEqual({
      lead: {kind: 'not-published-yet'},
      detail: {kind: 'in-release', release: autumnCatalogue},
    })
  })

  it('published and in an unscheduled release: "Update waiting in Autumn catalogue · no date set"', () => {
    expect(line(published(), inRelease(autumnCatalogue))).toEqual({
      lead: {kind: 'update-waiting', release: autumnCatalogue},
      detail: {kind: 'no-date-set'},
    })
  })

  it('counts an "As soon as possible" release as unscheduled', () => {
    expect(line(published(), inRelease(asapRelease))).toEqual({
      lead: {kind: 'update-waiting', release: asapRelease},
      detail: {kind: 'no-date-set'},
    })
  })

  it('counts an "At time" release with no date yet as unscheduled', () => {
    const noDate = release('rNoDate', 'Spring', {releaseType: 'scheduled'})
    expect(line(inRelease(noDate))).toEqual({
      lead: {kind: 'not-published-yet'},
      detail: {kind: 'in-release', release: noDate},
    })
  })

  it('puts unpublished edits before an unscheduled release', () => {
    expect(line(published(), draft(), inRelease(autumnCatalogue))).toEqual({
      lead: {kind: 'unpublished-edits'},
      detail: {kind: 'time-ago', at: TWO_HOURS_AGO},
    })
  })

  it('puts the draft before an unscheduled release when never published', () => {
    expect(line(draft(), inRelease(autumnCatalogue))).toEqual({
      lead: {kind: 'not-published-yet'},
      detail: {kind: 'edited', at: TWO_HOURS_AGO},
    })
  })

  it('leaves out versions whose release is not known', () => {
    const unknown: DocumentVersionStatusItem = {
      version: stub(`versions.rGone.${GROUP_ID}`, TWO_HOURS_AGO, {
        bundleId: 'rGone',
        release: {_ref: '_.releases.rGone', _weak: true},
      }),
    }
    expect(line(published(), unknown)).toEqual({lead: {kind: 'published', at: THREE_WEEKS_AGO}})
  })
})
