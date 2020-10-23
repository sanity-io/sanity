const DocumentWindow = require('../src/DocumentWindow')
const {getSnapshotFixture} = require('./fixtures')
const {getMockClient, gatherWindows, mockMutation, willBackfill} = require('./helpers')

const Query = DocumentWindow.Query
let docWindow = null

afterEach(() => {
  if (docWindow) {
    docWindow.removeAllListeners()
  }
})

describe('update outside of main window, but within buffer', () => {
  test('updates item within pre-buffer, no sort change', async () => {
    const newDocument = {
      __updated: true,
      _id: 'bcdefghijklmnopqrstuvwxyz',
      _updatedAt: '2017-06-02T12:00:00Z',
      name: 'New product title',
      productIndex: 1,
    }

    const query = new Query().from(12).to(17).orderBy('_updatedAt', 'desc')
    const client = getMockClient({
      responses: [getSnapshotFixture(0, 35)],
      events: [mockMutation(newDocument)],
    })

    docWindow = new DocumentWindow({client, query})
    expect(willBackfill(docWindow)).resolves.toBe(false)
    const windows = await gatherWindows(docWindow, 2)

    expect(windows[0]).toMatchSnapshot('01. a) window prior to pre-buffer update')
    expect(windows[1]).toMatchSnapshot('01. b) window after pre-buffer update')
    expect(docWindow).toMatchSnapshot('01. c) buffers after pre-buffer update')
  })

  test('updates item within pre-buffer, sort moves it inside of pre-buffer', async () => {
    const newDocument = {
      __updated: true,
      _id: 'fghijklmnopqrstuvwxyz',
      name: 'New product name',
      productIndex: 5,
      _updatedAt: '2017-06-02T11:59:59Z',
    }

    const query = new Query().from(12).to(17).orderBy('_updatedAt', 'desc')
    const client = getMockClient({
      responses: [getSnapshotFixture(0, 35)],
      events: [mockMutation(newDocument)],
    })

    docWindow = new DocumentWindow({client, query})
    expect(willBackfill(docWindow)).resolves.toBe(false)
    const windows = await gatherWindows(docWindow, 2)
    expect(windows[0]).toMatchSnapshot('02. a) window prior to post-buffer update')
    expect(windows[1]).toMatchSnapshot('02. b) window after post-buffer update')
    expect(docWindow).toMatchSnapshot('02. c) buffers after post-buffer update')
  })

  test('updates item within post-buffer, no sort change', async () => {
    const newDocument = {
      __updated: true,
      _id: '3-efghijklmnopqrstuvwxyz',
      _updatedAt: '2017-05-31T12:06:40Z',
      name: 'New product title',
      productIndex: 34,
    }

    const query = new Query().from(12).to(17).orderBy('_updatedAt', 'desc')
    const client = getMockClient({
      responses: [getSnapshotFixture(0, 35)],
      events: [mockMutation(newDocument)],
    })

    docWindow = new DocumentWindow({client, query})
    expect(willBackfill(docWindow)).resolves.toBe(false)
    const windows = await gatherWindows(docWindow, 2)

    expect(windows[0]).toMatchSnapshot('03. a) window prior to pre-buffer update')
    expect(windows[1]).toMatchSnapshot('03. b) window after pre-buffer update')
    expect(docWindow).toMatchSnapshot('03. c) buffers after pre-buffer update')
  })

  test('updates item within post-buffer, sort moves it inside of post-buffer', async () => {
    const newDocument = {
      __updated: true,
      _id: '2-onmlkjihgfedcba',
      name: 'New product name',
      productIndex: 21,
      _updatedAt: '2017-06-02T11:59:34Z',
    }

    const query = new Query().from(12).to(17).orderBy('_updatedAt', 'desc')
    const client = getMockClient({
      responses: [getSnapshotFixture(0, 35)],
      events: [mockMutation(newDocument)],
    })

    docWindow = new DocumentWindow({client, query})
    expect(willBackfill(docWindow)).resolves.toBe(false)
    const windows = await gatherWindows(docWindow, 2)
    expect(windows[0]).toMatchSnapshot('04. a) window prior to post-buffer update')
    expect(windows[1]).toMatchSnapshot('04. b) window after post-buffer update')
    expect(docWindow).toMatchSnapshot('04. c) buffers after post-buffer update')
  })

  test('transition out within pre-buffer', async () => {
    const newDocument = {
      __updated: true,
      _id: 'fghijklmnopqrstuvwxyz',
      name: 'New product name',
      productIndex: 105,
      _updatedAt: '2017-09-22T12:00:00Z',
    }

    const query = new Query()
      .constraint('productIndex < 100')
      .from(20)
      .to(25)
      .orderBy('_updatedAt', 'desc')

    const client = getMockClient({
      responses: [getSnapshotFixture(5, 40), getSnapshotFixture(42, 43)],
      events: [mockMutation(newDocument, 'disappear')],
    })

    docWindow = new DocumentWindow({client, query})
    const windows = await gatherWindows(docWindow, 3)
    expect(windows[0]).toMatchSnapshot('05. a) window prior to transition out of pre-buffer')
    expect(docWindow).toMatchSnapshot('05. c) buffers after transition out of pre-buffer')

    await docWindow.onSettle()
  })

  test('transition out of post-buffer', async () => {
    const newDocument = {
      __updated: true,
      _id: '2-gfedcba',
      name: 'New product name',
      productIndex: 105,
      _updatedAt: '2017-09-22T12:00:00Z',
    }

    const query = new Query()
      .constraint('productIndex < 100')
      .from(20)
      .to(25)
      .orderBy('_updatedAt', 'desc')

    const client = getMockClient({
      responses: [getSnapshotFixture(5, 40), getSnapshotFixture(42, 43)],
      events: [mockMutation(newDocument, 'disappear')],
    })

    docWindow = new DocumentWindow({client, query})
    const windows = await gatherWindows(docWindow, 3)
    expect(windows[0]).toMatchSnapshot('06. a) window prior to transition out of post-buffer')
    expect(docWindow).toMatchSnapshot('06. c) buffers after transition out of post-buffer')

    await docWindow.onSettle()
  })
})
