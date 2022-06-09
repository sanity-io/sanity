interface MultiKeyWeakMapNode {
  type: 'multi-key-weak-map-node'
  value: unknown
  next: WeakMap<object, MultiKeyWeakMapNode>
}

export interface MultiKeyWeakMap {
  get<T>(keys: object[]): T | undefined
  get(keys: object[]): unknown

  set(keys: object[], value: unknown): void
}

export function createMultiKeyWeakMap(): MultiKeyWeakMap {
  const rootMap = new WeakMap<object, MultiKeyWeakMapNode>()
  const idCache = new WeakMap<object, string>()

  function randomId() {
    return Array.from({length: 10})
      .map(() =>
        Math.floor(Math.random() * 255)
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  }

  function assignId(key: object) {
    const cachedId = idCache.get(key)
    if (cachedId) return cachedId
    const id = randomId()
    idCache.set(key, id)
    return id
  }

  function arrangeKeys(keys: object[]) {
    return Array.from(new Set(keys))
      .map((key) => [assignId(key), key] as const)
      .sort(([a], [b]) => a.localeCompare(b, 'en'))
      .map(([, key]) => key)
  }

  function getDeep(keys: object[], map: WeakMap<object, MultiKeyWeakMapNode>): unknown {
    if (!keys.length) return undefined
    const [firstKey, ...restOfKeys] = keys
    const node = map.get(firstKey)

    if (!node) return undefined
    if (!restOfKeys.length) return node.value
    return getDeep(restOfKeys, node.next)
  }

  function setDeep(
    keys: object[],
    map: WeakMap<object, MultiKeyWeakMapNode>,
    value: unknown
  ): void {
    if (!keys.length) return

    const [firstKey, ...restOfKeys] = keys
    const node = map.get(firstKey) || {
      type: 'multi-key-weak-map-node',
      value: undefined,
      next: new WeakMap(),
    }
    map.set(firstKey, node)

    if (!restOfKeys.length) {
      node.value = value
      return
    }

    setDeep(restOfKeys, node.next, value)
  }

  function get<T>(keys: object[]): T | undefined
  function get(keys: object[]) {
    return getDeep(arrangeKeys(keys), rootMap)
  }

  function set(keys: object[], value: unknown) {
    setDeep(arrangeKeys(keys), rootMap, value)
  }

  return {get, set}
}
