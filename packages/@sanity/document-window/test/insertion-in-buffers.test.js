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

describe('insertion outside of main window, but within buffer', () => {
  test('shifts window by one item when item is added within pre-buffer', async () => {
    const newDocument = {
      _id: 'dat-new-product',
      name: 'That new product',
      _updatedAt: '2017-06-02T11:59:58Z',
      __injected: true,
    }

    const query = new Query().from(12).to(17).orderBy('_updatedAt', 'desc')
    const client = getMockClient({
      responses: [getSnapshotFixture(0, 35)],
      events: [mockMutation(newDocument)],
    })

    docWindow = new DocumentWindow({client, query})
    expect(willBackfill(docWindow)).resolves.toBe(false)
    const windows = await gatherWindows(docWindow, 2)

    expect(windows[0]).toMatchSnapshot('01. a) window prior to pre-buffer injection')
    expect(windows[1]).toMatchSnapshot('01. b) window after pre-buffer injection')
    expect(docWindow).toMatchSnapshot('01. c) buffers after pre-buffer injection')
  })

  test('shifts window by one item when item is added within post-buffer', async () => {
    const newDocument = {
      _id: 'dat-new-product',
      name: 'That new product',
      _updatedAt: '2017-06-01T09:30:00Z',
      __injected: true,
    }

    const query = new Query().from(12).to(17).orderBy('_updatedAt', 'desc')
    const client = getMockClient({
      responses: [getSnapshotFixture(0, 35)],
      events: [mockMutation(newDocument)],
    })

    docWindow = new DocumentWindow({client, query})
    expect(willBackfill(docWindow)).resolves.toBe(false)
    const windows = await gatherWindows(docWindow, 2)
    expect(windows[0]).toMatchSnapshot('02. a) window prior to post-buffer injection')
    expect(windows[1]).toMatchSnapshot('02. b) window after post-buffer injection')
    expect(docWindow).toMatchSnapshot('02. c) buffers after post-buffer injection')
  })
})
