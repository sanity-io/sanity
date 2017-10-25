class LayerStack {
  constructor() {
    this.stack = []
  }
  setFocus(focused) {
    this.stack.forEach(layer => {
      layer.setState({isFocused: layer === focused})
    })
  }

  addLayer(newLayer) {
    // Set all underlaying modals as unfocused
    this.stack.forEach(layer => {
      layer.setState({isFocused: false})
    })
    // Add it to the stack
    this.stack.push(newLayer)
  }

  removeLayer() {
    // Removes the upper layer
    this.stack.pop()
    const prevLayer = this.stack.slice(-1)[0]
    if (prevLayer) {
      this.setFocus(prevLayer)
    }
  }
}

export default new LayerStack()
