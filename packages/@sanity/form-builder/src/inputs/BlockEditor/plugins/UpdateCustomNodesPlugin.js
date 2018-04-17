// @flow

// This plugin makes sure the custom nodes updates when needed due to external factors.
// Slate heavily restricts the shouldComponentUpdate by default. Thus markers
// and similar that change on the outside may not properly update the custom node components

export default function UpdateCustomNodesPlugin() {
  return {
    shouldNodeComponentUpdate(previousProps, nextProps) {
      if (
        !previousProps.markers ||
        (previousProps.markers &&
          nextProps.markers &&
          previousProps.markers.length !== nextProps.markers.length)
      ) {
        return true
      }
      return false
    }
  }
}
