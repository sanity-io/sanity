let globalElement = null

export const defaultContextValue = {
  get element() {
    if (globalElement) return globalElement

    globalElement = document.createElement('div')
    globalElement.setAttribute('data-portal', 'default')
    document.body.appendChild(globalElement)

    return globalElement
  },
}
