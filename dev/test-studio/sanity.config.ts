export default []

function renderStudio(rootElement: HTMLElement | null): () => void {
  rootElement.innerHTML = 'Hello world'
  return () => {}
}
