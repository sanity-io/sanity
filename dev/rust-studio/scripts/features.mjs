// oxlint-disable no-console
// Releases, history, review changes and comments in the Rust studio (STUDIO_BASE=/rust) or JS-lite
// (STUDIO_BASE=/js-lite), checked against the API, and the comments it posts checked in the JS
// studio (and a JS reply checked in the studio under test). Origins and SHARE_URL as in
// `collab.mjs`.
import {randomUUID} from 'node:crypto'
import {mkdirSync} from 'node:fs'
import {createRequire} from 'node:module'

const require = createRequire(new URL('../../../e2e/package.json', import.meta.url))
const {chromium} = require('@playwright/test')

const token = process.env.STUDIO_AUTH_TOKEN
const api = 'https://ppsg7ml5.api.sanity.io/v2025-02-19/data'
const auth = {'authorization': `Bearer ${token}`, 'content-type': 'application/json'}
const t0 = Date.now()
const log = (...args) => console.log(`[${((Date.now() - t0) / 1000).toFixed(2)}s]`, ...args)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const origin = process.env.STUDIO_ORIGIN ?? 'http://localhost:3333'
const shots = process.env.SHOTS ?? '/tmp/feature-shots'
const base = process.env.STUDIO_BASE ?? '/rust'
mkdirSync(shots, {recursive: true})

const post = async (path, body) => {
  const res = await fetch(`${api}/${path}`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${path}: ${res.status} ${JSON.stringify(json)}`)
  return json
}
const mutate = (mutations, dataset = 'test') => post(`mutate/${dataset}`, {mutations})
const actions = (list) => post('actions/test', {actions: list})
const query = async (groq, params = {}, dataset = 'test', perspective = 'raw') => {
  const search = new URLSearchParams({query: groq, perspective})
  for (const [key, value] of Object.entries(params)) search.set(`$${key}`, JSON.stringify(value))
  const res = await fetch(`${api}/query/${dataset}?${search}`, {headers: auth})
  return (await res.json()).result
}
const getDoc = async (id) => (await query('*[_id == $id][0]', {id})) ?? null
const poll = async (fn, timeout = 15_000) => {
  const until = Date.now() + timeout
  let last
  while (Date.now() < until) {
    last = await fn()
    if (last) return last
    await sleep(400)
  }
  return null
}

const results = []
const check = (name, ok, detail) => {
  results.push({name, ok: Boolean(ok)})
  log(ok ? 'PASS' : 'FAIL', name, detail ?? '')
}

const id = `features-${randomUUID()}`
const draft = `drafts.${id}`
const release = `rfeat${randomUUID().slice(0, 6)}`
const version = `versions.${release}.${id}`
const body = (text) => [
  {
    _type: 'block',
    _key: 'b1',
    style: 'normal',
    markDefs: [],
    children: [{_type: 'span', _key: 's1', text, marks: []}],
  },
]

const browser = await chromium.launch({channel: 'chrome', headless: process.env.HEADED !== '1'})
const context = await browser.newContext({viewport: {width: 1440, height: 900}})
const page = await context.newPage()
if (process.env.SHARE_URL && !origin.startsWith('http://localhost')) {
  await page.goto(process.env.SHARE_URL)
  await page.waitForLoadState('domcontentloaded')
}
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
const title = () => page.locator('[data-testid="field-title"] input')
const waitTitle = (value, timeout = 15_000) =>
  page
    .waitForFunction(
      (value) => document.querySelector('[data-testid="field-title"] input')?.value === value,
      value,
      {timeout},
    )
    .then(
      () => true,
      () => false,
    )
const typeTitle = async (value) => {
  await title().click()
  await title().press('ControlOrMeta+a')
  await page.keyboard.type(value, {delay: 15})
}

try {
  // A published document with a draft on top, so the history has a publish event.
  await mutate([
    {
      createOrReplace: {
        _id: draft,
        _type: 'simpleBlock',
        title: 'History v1',
        body: body('First version of the body.'),
      },
    },
  ])
  await actions([{actionType: 'sanity.action.document.publish', draftId: draft, publishedId: id}])
  await poll(async () => (await getDoc(id))?.title === 'History v1')
  await mutate([
    {
      createOrReplace: {
        _id: draft,
        _type: 'simpleBlock',
        title: 'History v2',
        body: body('Second version of the body.'),
      },
    },
  ])
  await actions([
    {
      actionType: 'sanity.action.release.create',
      releaseId: release,
      metadata: {title: 'Feature demo', releaseType: 'asap'},
    },
  ])
  log('seeded', id, 'and release', release)

  await page.goto(
    `${origin}${base}/test/structure/simpleBlock;${id}#token=${encodeURIComponent(token)}`,
  )
  check('the form shows the draft', await waitTitle('History v2', 60_000))
  check(
    'version chips show published and draft',
    (await page.locator('[data-testid="version-chip-published"]').count()) === 1 &&
      (await page.locator('[data-testid="version-chip-drafts"]').count()) === 1,
  )

  // History and review changes.
  await page.locator('[data-testid="history-button"]').click()
  const items = await poll(async () => {
    const labels = await page.locator('[data-testid="timeline-item"]').allInnerTexts()
    return labels.length >= 2 ? labels : null
  })
  check(
    'the timeline lists the edit and the publish',
    items && items.some((label) => label.includes('Published')) && items[0].includes('Edited'),
    JSON.stringify(items?.map((label) => label.split('\n')[0])),
  )
  const diff = page.locator('[data-testid="change-title"]')
  await diff.waitFor({timeout: 10_000}).catch(() => {})
  const removed = await diff.locator('[data-diff="removed"]').allInnerTexts()
  const added = await diff.locator('[data-diff="added"]').allInnerTexts()
  check(
    'review changes diffs the title against the published version',
    removed.join('') === '1' && added.join('') === '2',
    `removed ${JSON.stringify(removed)}, added ${JSON.stringify(added)}`,
  )
  check(
    'review changes diffs the body text',
    (await page.locator('[data-testid="change-body"] [data-diff]').count()) > 0,
  )
  await page.screenshot({path: `${shots}/history-review.png`})

  await diff.getByRole('button', {name: 'Revert'}).click()
  check('reverting a field restores its published value in the form', await waitTitle('History v1'))
  check(
    'reverting a field writes the draft',
    await poll(async () => (await getDoc(draft))?.title === 'History v1'),
  )

  await typeTitle('History v3')
  check(
    'the draft saves the new title',
    await poll(async () => (await getDoc(draft))?.title === 'History v3'),
  )
  // The timeline reloads after the edits settle.
  await sleep(2500)
  const published = page.locator('[data-testid="timeline-item"]', {hasText: 'Published'}).first()
  await published.click()
  await page.locator('[data-testid="revision-banner"]').waitFor({timeout: 10_000})
  check('selecting a revision shows it in the form', await waitTitle('History v1'))
  check(
    'a revision is read-only',
    await title().evaluate((input) => input.readOnly || input.disabled),
  )
  await page.screenshot({path: `${shots}/history-revision.png`})
  await page.locator('[data-testid="restore-revision"]').click()
  check(
    'restoring a revision writes it to the draft',
    await poll(async () => {
      const doc = await getDoc(draft)
      return (
        doc?.title === 'History v1' &&
        doc.body?.[0]?.children?.[0]?.text === 'First version of the body.' &&
        !doc._system
      )
    }),
  )
  check('the form shows the restored draft', await waitTitle('History v1'))
  await page.locator('[data-testid="history-button"]').click()

  // Releases.
  await page.locator('[data-testid="perspective-menu"]').click()
  await page.locator(`[data-testid="perspective-${release}"]`).click()
  check(
    'the release perspective is in the URL',
    await poll(async () => page.url().includes(`perspective=${release}`)),
  )
  await page.locator('[data-testid="not-in-release-banner"]').waitFor({timeout: 10_000})
  check(
    'a document not in the release is read-only',
    await title().evaluate((input) => input.readOnly || input.disabled),
  )
  await page.screenshot({path: `${shots}/release-not-in.png`})
  await page.locator('[data-testid="add-to-release"]').click()
  check(
    'adding to the release creates the version',
    await poll(async () => (await getDoc(version))?.title === 'History v1'),
  )
  await page
    .locator('[data-testid="not-in-release-banner"]')
    .waitFor({state: 'detached', timeout: 10_000})
  check(
    'the version chip shows',
    (await page.locator(`[data-testid="version-chip-${release}"]`).count()) === 1,
  )
  await typeTitle('Release title')
  check(
    'editing in the release writes the version',
    await poll(async () => (await getDoc(version))?.title === 'Release title'),
  )
  check('the draft stays as it was', (await getDoc(draft))?.title === 'History v1')
  await page.screenshot({path: `${shots}/release-editing.png`})
  await page.locator('[data-testid="version-chip-drafts"]').click()
  check('the draft chip shows the draft', await waitTitle('History v1'))
  await page.locator(`[data-testid="version-chip-${release}"]`).click()
  check('the release chip shows the version', await waitTitle('Release title'))
  await page.locator('[data-testid="version-chip-drafts"]').click()
  await waitTitle('History v1')

  // Comments.
  await page.locator('[data-testid="comment-button-title"]').click()
  await page
    .locator('[data-testid="new-thread"] [data-testid="comment-input"] textarea')
    .fill('Looks good from the Rust studio')
  await page.locator('[data-testid="new-thread"] [data-testid="post-comment"]').click()
  const commentQuery =
    '*[_type == "comment" && target.document._ref == $id] | order(_createdAt asc)'
  const posted = await poll(async () => {
    const list = await query(commentQuery, {id}, 'test-cmts')
    return list?.length === 1 ? list[0] : null
  })
  check(
    'posting a comment creates a comment document in the addon dataset',
    posted,
    posted &&
      JSON.stringify({
        field: posted.target?.path?.field,
        status: posted.status,
        ref: posted.target?.document?._ref,
        type: posted.target?.document?._type,
      }),
  )
  check(
    'the comment button counts the open thread',
    await poll(async () =>
      (await page.locator('[data-testid="comment-button-title"]').innerText()).includes('1'),
    ),
  )
  await page
    .locator('[data-testid="comment-thread"] [data-testid="comment-input"] textarea')
    .fill('A reply from Rust')
  await page.locator('[data-testid="comment-thread"] [data-testid="post-comment"]').click()
  const reply = await poll(async () => {
    const list = await query(commentQuery, {id}, 'test-cmts')
    return list?.length === 2 ? list.find((comment) => comment.parentCommentId) : null
  })
  check(
    'a reply joins the thread',
    reply && reply.threadId === posted?.threadId && reply.parentCommentId === posted?._id,
  )
  await page.screenshot({path: `${shots}/comments-rust.png`})

  // The JS studio shows the thread, and a reply posted there shows in the Rust studio.
  const js = await context.newPage()
  js.on('pageerror', () => {})
  await js.goto(`${origin}/test/intent/edit/id=${id};type=simpleBlock`)
  await js
    .locator('[data-testid="field-title"] input')
    .first()
    .waitFor({timeout: 60_000})
    .catch(() => {})
  await js
    .getByRole('button', {name: 'Comments', exact: true})
    .first()
    .click({timeout: 30_000})
    .catch((error) => log('JS comments button:', error.message.split('\n')[0]))
  const jsShows = await js
    .getByText('Looks good from the Rust studio')
    .first()
    .waitFor({timeout: 60_000})
    .then(
      () => true,
      () => false,
    )
  check('the JS studio shows the comment posted in the Rust studio', jsShows)
  check(
    'the JS studio shows the reply',
    await js
      .getByText('A reply from Rust')
      .first()
      .waitFor({timeout: 10_000})
      .then(
        () => true,
        () => false,
      ),
  )
  let jsReplied = false
  try {
    const replyBox = js
      .locator('[data-testid="comments-list"] [data-testid="comment-input-editable"]')
      .last()
    await replyBox.click({timeout: 10_000})
    await js.keyboard.type('Replying from the JS studio', {delay: 10})
    await js
      .locator('[data-testid="comments-list"] [data-testid="comment-input-send-button"]')
      .last()
      .click({timeout: 10_000})
    jsReplied = true
    await js
      .getByText('Replying from the JS studio')
      .first()
      .waitFor({timeout: 10_000})
      .catch(() => {})
  } catch (error) {
    log('could not type a reply in the JS studio:', error.message.split('\n')[0])
  }
  await js.screenshot({path: `${shots}/comments-js.png`})
  if (jsReplied) {
    const shown = await page
      .getByText('Replying from the JS studio')
      .first()
      .waitFor({timeout: 20_000})
      .then(
        () => true,
        () => false,
      )
    check('a reply posted in the JS studio shows in the Rust studio', shown)
  }
  await js.close()

  await page.locator('[data-testid="resolve-thread"]').first().click()
  check(
    'resolving sets the status of the whole thread',
    await poll(async () => {
      const list = await query(commentQuery, {id}, 'test-cmts')
      return list?.length >= 2 && list.every((comment) => comment.status === 'resolved')
    }),
  )
  await page.locator('[data-testid="comments-tab-resolved"]').click()
  check(
    'the resolved tab lists the thread',
    (await page.locator('[data-testid="comment-thread"]').count()) === 1,
  )
  await page.screenshot({path: `${shots}/comments-resolved.png`})

  check('no page errors in the Rust studio', errors.length === 0, errors.join(' | '))
} catch (error) {
  check('the walkthrough ran to the end', false, error.stack)
  await page.screenshot({path: `${shots}/failure.png`}).catch(() => {})
} finally {
  await actions([{actionType: 'sanity.action.document.version.discard', versionId: version}]).catch(
    (error) => log('discard', error.message),
  )
  await mutate([{delete: {id}}, {delete: {id: draft}}]).catch((error) =>
    log('cleanup', error.message),
  )
  await actions([{actionType: 'sanity.action.release.archive', releaseId: release}]).catch(
    (error) => log('archive', error.message),
  )
  await sleep(1500)
  await actions([{actionType: 'sanity.action.release.delete', releaseId: release}]).catch((error) =>
    log('delete release', error.message),
  )
  await mutate(
    [{delete: {query: `*[_type == "comment" && target.document._ref == "${id}"]`}}],
    'test-cmts',
  ).catch((error) => log('comments', error.message))
  await browser.close()
  const failed = results.filter((result) => !result.ok)
  log(
    failed.length
      ? `${failed.length} of ${results.length} checks failed`
      : `all ${results.length} checks passed`,
  )
  process.exitCode = failed.length ? 1 : 0
}
