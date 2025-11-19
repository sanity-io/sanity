import {SparklesIcon} from '@sanity/icons'
import {type BlockDecoratorDefinition} from 'sanity'

// Custom render function that logs to console when the sparkles decorator is applied
const sparklesRender = (props: {children: React.ReactNode}) => {
  // Log when this decorator is rendered (i.e., when text has the sparkles mark applied)
  console.log('selected sparkles')

  // Return children unchanged - no visual styling
  return props.children
}

/**
 * Reusable Sparkles Decorator
 *
 * This decorator adds a sparkles button to the PTE toolbar. When applied to text,
 * it logs 'selected sparkles' to the console but doesn't add any visual styling.
 *
 * Usage: Add this to any PTE field's `marks.decorators` array:
 *
 * @example
 * ```typescript
 * {
 *   type: 'array',
 *   of: [{
 *     type: 'block',
 *     marks: {
 *       decorators: [
 *         sparklesDecorator, // Add the sparkles button!
 *       ],
 *     },
 *   }],
 * }
 * ```
 */
export const sparklesDecorator: BlockDecoratorDefinition = {
  title: 'Sparkles',
  value: 'sparkles',
  icon: SparklesIcon,
  component: sparklesRender,
}
