export default function createLocalStatePatch(state) {
  return {
    type: 'localState',
    value: state
  }
}
