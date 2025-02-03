import {useInsertionEffect} from 'react'

const Bridge = () => {
  useInsertionEffect(() => {
    const src = 'https://core.sanity-cdn.com/bridge.js'
    const script = document.createElement('script')
    script.type = 'module'
    script.async = true
    script.src = src

    document.head.appendChild(script)
  }, [])

  return null
}

export {Bridge}
