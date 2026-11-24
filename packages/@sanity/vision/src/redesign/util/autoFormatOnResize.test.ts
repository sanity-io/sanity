import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest'

import {createAutoFormatOnResize, RESIZE_SETTLE_MS, reformatForWidth} from './autoFormatOnResize'
import {formatGroq} from './groqWasm'

const QUERY =
  '*[_type == "movie" && releaseDate > "2000"]{_id, title, "director": crew[job == "Director"][0].person->name, releaseDate, popularity} | order(popularity desc)[0...20]'

/** An editor whose width (in columns) and query the test sets */
function createEditor(initial: {query: string; width: number}) {
  const editor = {
    ...initial,
    enabled: true,
    busy: false,
    formats: 0,
    /** Every change of the controller's `pending`, in order */
    pendingChanges: [] as boolean[],
  }
  const controller = createAutoFormatOnResize({
    measure: () => editor.width,
    getQuery: () => editor.query,
    isEnabled: () => editor.enabled,
    isBusy: () => editor.busy,
    format: formatGroq,
    formatForEditor: (query) => formatGroq(query, editor.width),
    onPendingChange: (pending) => editor.pendingChanges.push(pending),
    apply: (formatted) => {
      editor.formats++
      editor.query = formatted
      // As the hook does for every query the tab takes
      controller.sync(formatted)
    },
  })
  return {
    editor,
    controller,
    /** Resizes the editor to `width` columns, as a drag or the window would */
    resize(width: number) {
      editor.width = width
      controller.resized()
    },
  }
}

/** Lets the settle timer run out and the reformat it starts finish */
async function settle(ms = RESIZE_SETTLE_MS) {
  await vi.advanceTimersByTimeAsync(ms)
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

beforeAll(async () => {
  // The formatter loads lazily; loaded once with real timers, every test formats synchronously
  await formatGroq('*')
})

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('reformatForWidth', () => {
  it('lays a query formatted for the old width out for the new one', async () => {
    const query = await formatGroq(QUERY, 80)
    expect(
      await reformatForWidth({
        query,
        previousWidth: 80,
        format: formatGroq,
        formatForEditor: (text) => formatGroq(text, 30),
      }),
    ).toBe(await formatGroq(QUERY, 30))
  })

  it('leaves empty, invalid and hand-formatted queries alone', async () => {
    const options = {previousWidth: 80, format: formatGroq, formatForEditor: formatGroq}
    expect(await reformatForWidth({...options, query: ''})).toBeUndefined()
    expect(await reformatForWidth({...options, query: '  \n '})).toBeUndefined()
    expect(await reformatForWidth({...options, query: '*[_type == '})).toBeUndefined()
    expect(await reformatForWidth({...options, query: '*[_type=="movie"]'})).toBeUndefined()
  })
})

describe('createAutoFormatOnResize', () => {
  it('reformats a prettified query for the new width once the resize settles', async () => {
    const {editor, resize} = createEditor({query: await formatGroq(QUERY, 80), width: 80})

    resize(30)
    await settle()
    expect(editor.query).toBe(await formatGroq(QUERY, 30))

    resize(200)
    await settle()
    expect(editor.query).toBe(await formatGroq(QUERY, 200))
    expect(editor.formats).toBe(2)
  })

  it('leaves a query laid out by hand alone', async () => {
    const handFormatted = '*[_type == "movie"] {\n    _id,   title\n}'
    const {editor, resize} = createEditor({query: handFormatted, width: 80})

    resize(20)
    await settle()
    expect(editor.query).toBe(handFormatted)

    const edited = `${await formatGroq(QUERY, 80)} `
    editor.query = edited
    resize(80)
    await settle()
    resize(30)
    await settle()
    expect(editor.query).toBe(edited)
    expect(editor.formats).toBe(0)
  })

  it('does nothing when the new width lays the query out the same', async () => {
    const short = await formatGroq('*[_type == "movie"]', 80)
    const {editor, resize} = createEditor({query: short, width: 80})

    resize(120)
    await settle()
    expect(editor.query).toBe(short)
    expect(editor.formats).toBe(0)
  })

  it('does nothing while the setting is switched off', async () => {
    const query = await formatGroq(QUERY, 80)
    const {editor, resize} = createEditor({query, width: 80})
    editor.enabled = false

    resize(30)
    await settle()
    expect(editor.query).toBe(query)

    editor.enabled = true
    resize(80)
    await settle()
    expect(editor.query).toBe(query)
    resize(30)
    await settle()
    expect(editor.query).toBe(await formatGroq(QUERY, 30))
  })

  it('leaves empty and invalid queries alone', async () => {
    for (const query of ['', '\n', '*[_type == "movie" && ']) {
      const {editor, resize} = createEditor({query, width: 80})
      resize(20)
      await settle()
      expect(editor.query).toBe(query)
      expect(editor.formats).toBe(0)
    }
  })

  it('waits for a drag to end, and compares the width before it with the width after', async () => {
    const {editor, resize} = createEditor({query: await formatGroq(QUERY, 80), width: 80})
    editor.busy = true

    // Moving the handle, pausing on the way: nothing happens while it is held
    for (const width of [70, 60, 50, 40]) {
      resize(width)
      await settle(RESIZE_SETTLE_MS / 2)
    }
    await settle(RESIZE_SETTLE_MS * 4)
    expect(editor.formats).toBe(0)

    resize(30)
    editor.busy = false
    await settle(RESIZE_SETTLE_MS - 1)
    expect(editor.formats).toBe(0)
    await settle(1)
    expect(editor.query).toBe(await formatGroq(QUERY, 30))
    expect(editor.formats).toBe(1)
  })

  it('does not reformat a query edited while the resize settles', async () => {
    const {editor, resize} = createEditor({query: await formatGroq(QUERY, 80), width: 80})

    resize(30)
    await settle(RESIZE_SETTLE_MS - 1)
    editor.query = `${editor.query}\n`
    await settle(1)
    expect(editor.formats).toBe(0)
  })

  it('takes the width again for every query, so a prettified query counts at its own width', async () => {
    const {editor, controller, resize} = createEditor({query: '', width: 80})

    // Prettify ran while the editor had fewer columns (a wider line-number gutter, say)
    editor.width = 76
    editor.query = await formatGroq(QUERY, 76)
    controller.sync(editor.query)

    resize(30)
    await settle()
    expect(editor.query).toBe(await formatGroq(QUERY, 30))
  })

  it('stops when disposed', async () => {
    const query = await formatGroq(QUERY, 80)
    const {editor, controller, resize} = createEditor({query, width: 80})

    resize(30)
    controller.dispose()
    await settle()
    expect(editor.query).toBe(query)
  })
  describe('pending', () => {
    it('is pending from the first change of a resize until the reformat has been applied', async () => {
      const {editor, controller, resize} = createEditor({
        query: await formatGroq(QUERY, 80),
        width: 80,
      })
      expect(controller.pending).toBe(false)

      resize(70)
      await settle(0)
      expect(controller.pending).toBe(true)

      // A drag keeps it pending, however long it pauses on the way
      editor.busy = true
      for (const width of [60, 50, 40]) {
        resize(width)
        await settle(RESIZE_SETTLE_MS * 2)
        expect(controller.pending).toBe(true)
      }

      editor.busy = false
      resize(30)
      await settle(RESIZE_SETTLE_MS - 1)
      expect(controller.pending).toBe(true)
      await settle(1)
      expect(editor.formats).toBe(1)
      expect(controller.pending).toBe(false)
      expect(editor.pendingChanges).toEqual([true, false])
    })

    it('is released once the reformat is applied, with the new query already in place', async () => {
      let queryWhenReleased: string | undefined
      const editor = {query: await formatGroq(QUERY, 80), width: 80}
      const controller = createAutoFormatOnResize({
        measure: () => editor.width,
        getQuery: () => editor.query,
        isEnabled: () => true,
        isBusy: () => false,
        format: formatGroq,
        formatForEditor: (query) => formatGroq(query, editor.width),
        apply: (formatted) => {
          editor.query = formatted
          controller.sync(formatted)
        },
        onPendingChange: (pending) => {
          if (!pending) queryWhenReleased = editor.query
        },
      })

      editor.width = 30
      controller.resized()
      await settle()
      expect(queryWhenReleased).toBe(await formatGroq(QUERY, 30))
    })

    it('is not pending for a query the formatter did not lay out, which Format stays on', async () => {
      const handFormatted = '*[_type == "movie"] {\n    _id,   title\n}'
      for (const query of [handFormatted, '', '*[_type == "movie" && ']) {
        const {editor, controller, resize} = createEditor({query, width: 80})
        resize(30)
        await settle(0)
        expect(controller.pending).toBe(false)
        await settle()
        expect(editor.pendingChanges).toEqual([])
      }

      const edited = `${await formatGroq(QUERY, 80)} `
      const {editor, controller, resize} = createEditor({query: edited, width: 80})
      resize(30)
      await settle(0)
      expect(controller.pending).toBe(false)
      expect(editor.pendingChanges).toEqual([])
    })

    it('is not pending while the setting is off', async () => {
      const {editor, controller, resize} = createEditor({
        query: await formatGroq(QUERY, 80),
        width: 80,
      })
      editor.enabled = false
      resize(30)
      await settle(0)
      expect(controller.pending).toBe(false)
      await settle()
      expect(editor.pendingChanges).toEqual([])
    })

    it('is released when the resize ends with nothing to reformat', async () => {
      const short = await formatGroq('*[_type == "movie"]', 80)
      const {editor, controller, resize} = createEditor({query: short, width: 80})

      resize(120)
      await settle(0)
      expect(controller.pending).toBe(true)
      await settle()
      expect(controller.pending).toBe(false)
      expect(editor.pendingChanges).toEqual([true, false])
    })

    it('is released when the query was edited while the resize settled', async () => {
      const {editor, controller, resize} = createEditor({
        query: await formatGroq(QUERY, 80),
        width: 80,
      })
      resize(30)
      await settle(RESIZE_SETTLE_MS - 1)
      editor.query = `${editor.query}\n`
      await settle(1)
      expect(controller.pending).toBe(false)
    })

    it('stays pending across a resize that starts while the reformat is in flight', async () => {
      const query = await formatGroq(QUERY, 80)
      const {editor, controller, resize} = createEditor({query, width: 80})
      resize(30)
      // The settle has begun and its reformat is in flight when the editor changes again
      await vi.advanceTimersByTimeAsync(RESIZE_SETTLE_MS)
      resize(60)
      await settle(0)
      expect(controller.pending).toBe(true)
      await settle()
      expect(controller.pending).toBe(false)
      expect(editor.pendingChanges.at(-1)).toBe(false)
    })

    it('is released when disposed, and reports nothing after', async () => {
      const {editor, controller, resize} = createEditor({
        query: await formatGroq(QUERY, 80),
        width: 80,
      })
      resize(30)
      await settle(0)
      controller.dispose()
      await settle()
      expect(editor.pendingChanges).toEqual([true])
    })
  })
})
