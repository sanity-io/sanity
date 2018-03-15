export default function internalRouterContextTypeCheck(context, propName, componentName) {
  if (!context.__internalRouter) {
    throw new Error(
      'The router is accessed outside the context of a <RouterProvider>.' +
        ' No router state will be accessible and links will not go anywhere. To fix this,' +
        ` make sure ${componentName} is rendered in the context of a <RouterProvider /> element`
    )
  }
}
