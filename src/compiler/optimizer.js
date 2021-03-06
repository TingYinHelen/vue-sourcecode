/* @flow */

import { makeMap, isBuiltInTag, cached, no } from 'shared/util'

let isStaticKey
let isPlatformReservedTag



//cached返回一个函数，这个函数是任意执行字符串操作的函数，
/**
 * 然后传入一个字符串，去执行这个函数
 *
 *
 */

const genStaticKeysCached = cached(genStaticKeys)

/**
 * Goal of the optimizer: walk the generated template AST tree
 * and detect sub-trees that are purely static, i.e. parts of
 * the DOM that never needs to change.
 *
 * Once we detect these sub-trees, we can:
 *
 * 1. Hoist them into constants, so that we no longer need to
 *    create fresh nodes for them on each re-render;
 * 2. Completely skip them in the patching process.
 */
/**
*为了检测子节点是否是静态节点，如果一些节点从来不需要改变，就是静态的子节点
*一旦我们发现有这种子节点，我们就可以
*1.把他们提到一个常量里去，我们就不需要在每次render的时候建立新的子节点
*2.在patch的过程中跳过他们
*/
//我有一个问题： 这里的option使用啦做啥的
export function optimize (root: ?ASTElement, options: CompilerOptions) {
  if (!root) return
  //问题就是：这里打印出来看到的options并没有staticKeys这个属性
  //测试options.staticKeys中的没有属性是否为true，即就是静态的

  isStaticKey = genStaticKeysCached(options.staticKeys || '')

  isPlatformReservedTag = options.isReservedTag || no

  // first pass: mark all non-static nodes.
  //记录所有不是静态的
  //给所有静态节点加上static属性
  markStatic(root)

  // second pass: mark static roots.
  //记录静态的根节点，所谓静态根节点就是这个标签下，所有的标签都是静态节点
  // 并且是被挂载的标签

  markStaticRoots(root, false)
}

function genStaticKeys (keys: string): Function {
  return makeMap(
    'type,tag,attrsList,attrsMap,plain,parent,children,attrs' +
    (keys ? ',' + keys : '')
  )
}
//传过来的参数就是AST,将判断是否是静态节点，如果是则它的static就是true否则就是false
function markStatic (node: ASTNode) {
  node.static = isStatic(node)
  if (node.type === 1) {
    // do not make component slot content static. this avoids
    // 1. components not able to mutate slot nodes
    // 2. static slot content fails for hot-reloading
    if (
      !isPlatformReservedTag(node.tag) &&
      node.tag !== 'slot' &&
      node.attrsMap['inline-template'] == null
    ) {
      return
    }
    for (let i = 0, l = node.children.length; i < l; i++) {
      const child = node.children[i]
      markStatic(child)
      if (!child.static) {
        node.static = false
      }
    }
  }
}
//在静态节点的基础上判断静态根节点
function markStaticRoots (node: ASTNode, isInFor: boolean) {
  if (node.type === 1) {
    if (node.static || node.once) {
      node.staticInFor = isInFor
    }
    // For a node to qualify as a static root, it should have children that
    // are not just static text. Otherwise the cost of hoisting out will
    // outweigh the benefits and it's better off to just always render it fresh.


    if (node.static && node.children.length && !(
      node.children.length === 1 &&
      node.children[0].type === 3
    )) {
      node.staticRoot = true
      return
    } else {
      node.staticRoot = false
    }
    if (node.children) {
      for (let i = 0, l = node.children.length; i < l; i++) {
        markStaticRoots(node.children[i], isInFor || !!node.for)
      }
    }
    if (node.ifConditions) {
      walkThroughConditionsBlocks(node.ifConditions, isInFor)
    }
  }
}

function walkThroughConditionsBlocks (conditionBlocks: ASTIfConditions, isInFor: boolean): void {
  for (let i = 1, len = conditionBlocks.length; i < len; i++) {
    markStaticRoots(conditionBlocks[i].block, isInFor)
  }
}
//其实是在遍历每一层的AST，递归下去
function isStatic (node: ASTNode): boolean {
  //如果是表达式直接返回不是静态节点

  if (node.type === 2) { // expression
    return false
  }
  //如果是文本直接返回是静态节点

  if (node.type === 3) { // text
    return true
  }
  //如果是标签就判断以下
  //这里所做的就是把前面的全部都判断，判断正确后，然后把node的所有key都存在cache中
  //也就是说把静态node存入到cache中去
  return !!(node.pre || (
    !node.hasBindings && // no dynamic bindings
    !node.if && !node.for && // not v-if or v-for or v-else
    !isBuiltInTag(node.tag) && // not a built-in //如果返回的是slot或者component就返回true
    isPlatformReservedTag(node.tag) && // not a component
    !isDirectChildOfTemplateFor(node) && //判断是否是<template>的子元素

    Object.keys(node).every(isStaticKey)
  ))
}

function isDirectChildOfTemplateFor (node: ASTElement): boolean {
  while (node.parent) {
    node = node.parent
    if (node.tag !== 'template') {
      return false
    }
    if (node.for) {
      return true
    }
  }
  return false
}

/**
 *
 *
 *
 *
 *
 *
 */
