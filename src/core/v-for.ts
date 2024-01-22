import type { MagicString } from '@vue-macros/common'
import type { CallExpression, Node } from '@babel/types'
import { addAttribute, getReturnExpression } from './common'

export function transformVFor(
  node: CallExpression,
  parent: Node | null | undefined,
  s: MagicString,
) {
  const { callee, arguments: [argument] } = node
  if (
    argument.type !== 'FunctionExpression'
    && argument.type !== 'ArrowFunctionExpression'
  )
    return

  const start = parent?.type === 'JSXExpressionContainer' ? parent.start! : node.start!
  const end = parent?.type === 'JSXExpressionContainer' ? parent.end! : node.end!

  const left = s.sliceNode(argument.params)
  const right = callee.type === 'MemberExpression'
    ? s.sliceNode(callee.object)
    : null
  const directive = ` v-for="(${left}) in ${right}"`

  const returnExpression = getReturnExpression(argument)
  if (!returnExpression)
    return

  if (returnExpression.type === 'JSXElement' || returnExpression.type === 'JSXFragment') {
    addAttribute(returnExpression, directive, s)

    return () => {
      s.remove(start, returnExpression.start!)
      s.remove(returnExpression.end!, end)
    }
  }

  return () => {
    s.overwrite(start, returnExpression.start!, `<template${directive}>`)
    s.overwrite(returnExpression.end!, end, `</template>`)
  }
}