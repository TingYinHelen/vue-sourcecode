/* @flow */

import config from '../config'

import {
  warn,
  nextTick,
  toNumber,
  _toString,
  looseEqual,
  emptyObject,
  looseIndexOf,
  formatComponentName
} from '../util/index'

import VNode, {
  cloneVNodes,
  createTextVNode,
  createEmptyVNode
} from '../vdom/vnode'

import { createElement } from '../vdom/create-element'
import { renderList } from './render-helpers/render-list'
import { renderSlot } from './render-helpers/render-slot'
import { resolveFilter } from './render-helpers/resolve-filter'
import { checkKeyCodes } from './render-helpers/check-keycodes'
import { bindObjectProps } from './render-helpers/bind-object-props'
import { renderStatic, markOnce } from './render-helpers/render-static'
import { resolveSlots, resolveScopedSlots } from './render-helpers/resolve-slots'

export function initRender (vm: Component) {
  vm.$vnode = null // the placeholder node in parent tree
  vm._vnode = null // the root of the child tree
  vm._staticTrees = null
  const parentVnode = vm.$options._parentVnode
  const renderContext = parentVnode && parentVnode.context
  vm.$slots = resolveSlots(vm.$options._renderChildren, renderContext)
  vm.$scopedSlots = emptyObject
  // bind the createElement fn to this instance
  // so that we get proper render context inside it.
  // args order: tag, data, children, normalizationType, alwaysNormalize
  // internal version is used by render functions compiled from templates
  vm._c = (a, b, c, d) => createElement(vm, a, b, c, d, false)
  // normalization is always applied for the public version, used in
  // user-written render functions.
  vm.$createElement = (a, b, c, d) => createElement(vm, a, b, c, d, true)
}

export function renderMixin (Vue: Class<Component>) {
  Vue.prototype.$nextTick = function (fn: Function) {
    return nextTick(fn, this)
  }
  //new Watcher(vm, function updateComponent () {
  //   vm._update(vm._render(), hydrating)
  // }, noop)
  //此时option.render中已经存放了生成好的render函数
  Vue.prototype._render = function (): VNode {
    const vm: Component = this
    /**
     * 结构$options中的render
     * $options.render是compileToFunctions将template或者el编译出来的
     */
    const {
      render,
      staticRenderFns,
      _parentVnode
    } = vm.$options



    if (vm._isMounted) {
      // clone slot nodes on re-renders
      for (const key in vm.$slots) {
        vm.$slots[key] = cloneVNodes(vm.$slots[key])
      }
    }

    vm.$scopedSlots = (_parentVnode && _parentVnode.data.scopedSlots) || emptyObject

    if (staticRenderFns && !vm._staticTrees) {
      vm._staticTrees = []
    }
    // set parent vnode. this allows render functions to have access
    // to the data on the placeholder node.
    vm.$vnode = _parentVnode
    // render self
    let vnode
    try {
      /**
       * 运行render函数,
       * 可以看出生成的是一个vnode
       * vm._renderProxy = vm
       *
       * render = function anonymous(){
       *  with(this){return _c('div',{attrs:{"id":"app"}},[_v("\n    "+_s(sum)+"\n  ")])}
       * }
       * vm._renderProxy将render的作用域绑定在当前vue实例
       * _c,_v,_s以及sum都是Vue实例下的方法和属性
       */
      // vm.$createElement????

      vnode = render.call(vm._renderProxy, vm.$createElement)

    } catch (e) {
      /* istanbul ignore else */
      if (config.errorHandler) {
        config.errorHandler.call(null, e, vm)
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn(`Error when rendering ${formatComponentName(vm)}:`)
        }
        throw e
      }
      // return previous vnode to prevent render error causing blank component
      vnode = vm._vnode
    }
    // return empty vnode in case the render function errored out
    if (!(vnode instanceof VNode)) {
      if (process.env.NODE_ENV !== 'production' && Array.isArray(vnode)) {
        warn(
          'Multiple root nodes returned from render function. Render function ' +
          'should return a single root node.',
          vm
        )
      }
      vnode = createEmptyVNode()
    }
    // set parent
    vnode.parent = _parentVnode
    return vnode
  }

  // internal render helpers.
  // these are exposed on the instance prototype to reduce generated render
  // code size.
  /**
   * 内部的渲染helper
   * 这些将会暴露在原型对象上来减少生成render时候的代码大小
   */
  Vue.prototype._o = markOnce
  Vue.prototype._n = toNumber
  Vue.prototype._s = _toString
  Vue.prototype._l = renderList
  Vue.prototype._t = renderSlot
  Vue.prototype._q = looseEqual
  Vue.prototype._i = looseIndexOf
  Vue.prototype._m = renderStatic
  Vue.prototype._f = resolveFilter
  Vue.prototype._k = checkKeyCodes
  Vue.prototype._b = bindObjectProps
  Vue.prototype._v = createTextVNode
  Vue.prototype._e = createEmptyVNode
  Vue.prototype._u = resolveScopedSlots

}
