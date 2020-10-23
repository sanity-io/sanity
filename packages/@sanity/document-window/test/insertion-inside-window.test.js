const DocumentWindow = require('../src/DocumentWindow')
const {getSnapshotFixture} = require('./fixtures')
const {getMockClient, gatherWindows, mockMutation} = require('./helpers')

const Query = DocumentWindow.Query
let docWindow = null

afterEach(() => {
  if (docWindow) {
    docWindow.removeAllListeners()
  }
})

describe('insertion inside of range', () => {
  test('injects into window when item is added to middle of range, fills post', async () => {
    const newDocument = {
      _id: 'alpha',
      name: 'That new product',
      _updatedAt: '2017-06-02T12:00:00Z',
      __injected: true,
    }

    const query = new Query().from(0).to(5).orderBy('_updatedAt', 'desc')
    const client = getMockClient({
      responses: [getSnapshotFixture(0, 10)],
      events: [mockMutation(newDocument)],
    })

    docWindow = new DocumentWindow({client, query})
    const windows = await gatherWindows(docWindow, 2)

    expect(windows[0]).toMatchSnapshot('01. a) window prior to inject')
    expect(windows[1]).toMatchSnapshot('01. b) window after injection')
    expect(docWindow).toMatchSnapshot('01. c) buffers after injection')
  })

  test('injects into window when item is added to beginning of range, fills post', async () => {
    const newDocument = {
      _id: 'abacus',
      name: 'That new product',
      _updatedAt: '2017-06-02T12:00:00Z',
      __injected: true,
    }

    const query = new Query().from(0).to(5).orderBy('_updatedAt', 'desc')
    const client = getMockClient({
      responses: [getSnapshotFixture(0, 10)],
      events: [mockMutation(newDocument)],
    })

    docWindow = new DocumentWindow({client, query})
    const windows = await gatherWindows(docWindow, 2)

    expect(windows[0]).toMatchSnapshot('02. a) window prior to inject')
    expect(windows[1]).toMatchSnapshot('02. b) window after injection')
    expect(docWindow).toMatchSnapshot('02. c) buffers after injection')
  })

  test('injects into window when window only contains a single item (end)', async () => {
    const newDocument = {
      _id: 'alpha',
      name: 'That new product',
      _updatedAt: '2017-06-02T12:00:00Z',
      __injected: true,
    }

    const query = new Query().from(0).to(5).orderBy('_updatedAt', 'desc')
    const client = getMockClient({
      responses: [getSnapshotFixture(0, 1)],
      events: [mockMutation(newDocument)],
    })

    docWindow = new DocumentWindow({client, query})
    const windows = await gatherWindows(docWindow, 2)

    expect(windows[0]).toMatchSnapshot('03. a) window prior to inject')
    expect(windows[1]).toMatchSnapshot('03. b) window after injection')
    expect(docWindow).toMatchSnapshot('03. c) buffers after injection')
  })

  test('injects into window when window only contains a single item (start)', async () => {
    const newDocument = {
      _id: 'abacus',
      name: 'That new product',
      _updatedAt: '2017-06-02T12:00:00Z',
      __injected: true,
    }

    const query = new Query().from(0).to(5).orderBy('_updatedAt', 'desc')
    const client = getMockClient({
      responses: [getSnapshotFixture(0, 1)],
      events: [mockMutation(newDocument)],
    })

    docWindow = new DocumentWindow({client, query})
    const windows = await gatherWindows(docWindow, 2)

    expect(windows[0]).toMatchSnapshot('04. a) window prior to inject')
    expect(windows[1]).toMatchSnapshot('04. b) window after injection')
    expect(docWindow).toMatchSnapshot('04. c) buffers after injection')
  })

  test('injects into window when window is empty', async () => {
    const newDocument = {
      _id: 'alpha',
      name: 'That new product',
      _updatedAt: '2017-06-02T12:00:00Z',
      __injected: true,
    }

    const query = new Query().from(0).to(5).orderBy('_updatedAt', 'desc')
    const client = getMockClient({
      responses: [[]],
      events: [mockMutation(newDocument)],
    })

    docWindow = new DocumentWindow({client, query})
    const windows = await gatherWindows(docWindow, 2)

    expect(windows[0]).toMatchSnapshot('05. a) window prior to inject')
    expect(windows[1]).toMatchSnapshot('05. b) window after injection')
    expect(docWindow).toMatchSnapshot('05. c) buffers after injection')
  })
})
