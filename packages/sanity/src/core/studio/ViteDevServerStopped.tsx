import {type ReactNode, useCallback, useEffect, useState} from 'react'
import {type ViteHotContext} from 'vite/types/hot.js'

import {ERROR_TITLE} from './ViteDevServerStoppedErrorScreen'

export class ViteDevServerStoppedError extends Error {
  ViteDevServerStoppedError: boolean

  constructor() {
    super(ERROR_TITLE)
    this.name = 'ViteDevServerStoppedError'
    this.ViteDevServerStoppedError = true
  }
}
const serverHot = import.meta.hot
const isViteServer = (hot: unknown): hot is ViteHotContext => Boolean(hot)

const useDetectViteDevServerStopped = () => {
  const [devServerStopped, setDevServerStopped] = useState(false)

  const markDevServerStopped = useCallback(() => setDevServerStopped(true), [])

  useEffect(() => {
    // no early return to optimize tree-shaking
    if (isViteServer(serverHot)) {
      serverHot.on('vite:ws:disconnect', markDevServerStopped)
    }
  }, [markDevServerStopped])

  return {devServerStopped}
}

const ThrowViteServerStopped = () => {
  const {devServerStopped} = useDetectViteDevServerStopped()

  if (devServerStopped) throw new ViteDevServerStoppedError()

  return null
}

export default function DetectViteDevServerStopped(): ReactNode {
  return isViteServer(serverHot) ? <ThrowViteServerStopped /> : null
}
