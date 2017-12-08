/* @flow */

import { initProxy } from './proxy'
import { initState } from './state'
import { initRender } from './render'
import { initEvents } from './events'
import { initLifecycle, callHook } from './lifecycle'
import { mergeOptions } from '../util/index'

let uid = 0
/**
 * It is my idea. You stole my thought.
 * I wanna respct everyone. But it is difficault that make everyone respect me.
 * eventhough my loved ones.
 *
 */
//vm 是new的vue实例
export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this
    // a uid
    vm._uid = uid++
    // a flag to avoid this being observed
    vm._isVue = true
    // merge options
    if (options && options._isComponent) {
      // optimize internal component instantiation
      // since dynamic options merging is pretty slow, and none of the
      // internal component options needs special treatment.

      /**
       * 翻译一下：
       * 优化内部的 component 实例
       * 当动态的options的合并太慢，并且没有内部的component options需要特别处理
       * 在createComponentInstanceForVnode有初始化
       */


      initInternalComponent(vm, options)
    } else {

      //不看resolveConstructorOptions
      /**
       * 1.x版本的写法
       * this.$options = mergeOptions(
       *  this.constructor.options,
       *  options,
       *  this
       * )
       *
       *
       */
      vm.$options = mergeOptions(
        resolveConstructorOptions(vm.constructor),
        options || {},
        vm
      )
    }

    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'production') {
      initProxy(vm)
    } else {
      vm._renderProxy = vm
    }
    // expose real self
    vm._self = vm
    //
    initLifecycle(vm)
    initEvents(vm)
    initRender(vm)
    callHook(vm, 'beforeCreate')
    initState(vm)
    callHook(vm, 'created')
    if (vm.$options.el) {
      vm.$mount(vm.$options.el)
    }
  }
}

function initInternalComponent (vm: Component, options: InternalComponentOptions) {
  const opts = vm.$options = Object.create(vm.constructor.options)
  // doing this because it's faster than dynamic enumeration.
  opts.parent = options.parent
  opts.propsData = options.propsData
  opts._parentVnode = options._parentVnode
  opts._parentListeners = options._parentListeners
  opts._renderChildren = options._renderChildren
  opts._componentTag = options._componentTag
  opts._parentElm = options._parentElm
  opts._refElm = options._refElm
  if (options.render) {
    opts.render = options.render
    opts.staticRenderFns = options.staticRenderFns
  }
}

export function resolveConstructorOptions (Ctor: Class<Component>) {
  /**
   * Ctor 是构造函数
   *
   *
   */
  let options = Ctor.options
  if (Ctor.super) {
    const superOptions = Ctor.super.options
    const cachedSuperOptions = Ctor.superOptions
    const extendOptions = Ctor.extendOptions
    if (superOptions !== cachedSuperOptions) {
      // super option changed
      Ctor.superOptions = superOptions
      extendOptions.render = options.render
      extendOptions.staticRenderFns = options.staticRenderFns
      extendOptions._scopeId = options._scopeId
      options = Ctor.options = mergeOptions(superOptions, extendOptions)
      if (options.name) {
        options.components[options.name] = Ctor
      }
    }
  }
  return options
}
