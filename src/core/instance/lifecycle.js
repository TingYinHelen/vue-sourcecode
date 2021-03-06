/* @flow */

import Watcher from '../observer/watcher'
import { createEmptyVNode } from '../vdom/vnode'
import { observerState } from '../observer/index'
import { updateComponentListeners } from './events'
import { resolveSlots } from './render-helpers/resolve-slots'
import { warn, validateProp, remove, noop, emptyObject } from '../util/index'

export let activeInstance: any = null

export function initLifecycle (vm: Component) {
  const options = vm.$options

  // locate first non-abstract parent
  let parent = options.parent
  if (parent && !options.abstract) {
    while (parent.$options.abstract && parent.$parent) {
      parent = parent.$parent
    }
    parent.$children.push(vm)
  }

  vm.$parent = parent
  vm.$root = parent ? parent.$root : vm

  vm.$children = []
  vm.$refs = {}

  vm._watcher = null
  vm._inactive = false
  vm._isMounted = false
  vm._isDestroyed = false
  vm._isBeingDestroyed = false
}

export function lifecycleMixin (Vue: Class<Component>) {

  Vue.prototype._mount = function (
    el?: Element | void,
    hydrating?: boolean
  ): Component {
    const vm: Component = this
    //
    vm.$el = el
    if (!vm.$options.render) {
      vm.$options.render = createEmptyVNode
      if (process.env.NODE_ENV !== 'production') {
        /* istanbul ignore if */
        if (vm.$options.template && vm.$options.template.charAt(0) !== '#') {
          warn(
            'You are using the runtime-only build of Vue where the template ' +
            'option is not available. Either pre-compile the templates into ' +
            'render functions, or use the compiler-included build.',
            vm
          )
        } else {
          warn(
            'Failed to mount component: template or render function not defined.',
            vm
          )
        }
      }
    }
    callHook(vm, 'beforeMount')
    /**
     * class Watcher{
     *  constructor(vm, expOrFn, cb, option){}
     * }
     * 这里 就是对这个函数求职
     *  function updateComponent () {
          vm._update(vm._render(), hydrating)
        }
        这里需要看一下_update和_render
        noop是不执行任何代码的函数
        也就是说这一步的作用仅仅是监听vm._update(vm._render(), hydrating)
        这句是数据改变触发视图改变的核心代码
     */


    //  这样看来，每一个实例，就会有一次new Watcher,就会有一个watcher实例
    vm._watcher = new Watcher(vm, function updateComponent () {
      //先执行_render() 在'./render.js'中定义
      //vm._render()生成的是一个vnode
      //vm._update()其实就是虚拟DOM中的最后一步: patch
      vm._update(vm._render(), hydrating)
    }, noop)
    hydrating = false
    // manually mounted instance, call mounted on self
    // mounted is called for render-created child components in its inserted hook
    if (vm.$vnode == null) {
      vm._isMounted = true
      callHook(vm, 'mounted')
    }
    return vm
  }
  //虚拟DOM patch的最后一步
  Vue.prototype._update = function (vnode: VNode, hydrating?: boolean) {
    const vm: Component = this
    if (vm._isMounted) {
      callHook(vm, 'beforeUpdate')
    }
    const prevEl = vm.$el

    const prevVnode = vm._vnode

    const prevActiveInstance = activeInstance
    activeInstance = vm
    vm._vnode = vnode
    // Vue.prototype.__patch__ is injected in entry points
    // based on the rendering backend used.
    if (!prevVnode) {
      // initial render
      //如果没有prevVnode说明是首次渲染,就直接生成Dom
      //这里生成dom
      vm.$el = vm.__patch__(
        vm.$el, vnode, hydrating, false /* removeOnly */,
        vm.$options._parentElm,
        vm.$options._refElm
      )
    } else {
      // updates
      // 如果有了prevVnode说明不是首次渲染
      // 那么就采取patch算法，进行必要的DOM操作
      vm.$el = vm.__patch__(prevVnode, vnode)
    }
    activeInstance = prevActiveInstance
    // update __vue__ reference
    if (prevEl) {
      prevEl.__vue__ = null
    }
    if (vm.$el) {
      vm.$el.__vue__ = vm
    }
    // if parent is an HOC, update its $el as well
    if (vm.$vnode && vm.$parent && vm.$vnode === vm.$parent._vnode) {
      vm.$parent.$el = vm.$el
    }
    // updated hook is called by the scheduler to ensure that children are
    // updated in a parent's updated hook.
  }

  Vue.prototype._updateFromParent = function (
    propsData: ?Object,
    listeners: ?Object,
    parentVnode: VNode,
    renderChildren: ?Array<VNode>
  ) {
    const vm: Component = this

    // determine whether component has slot children
    // we need to do this before overwriting $options._renderChildren
    const hasChildren = !!(
      renderChildren ||               // has new static slots
      vm.$options._renderChildren ||  // has old static slots
      parentVnode.data.scopedSlots || // has new scoped slots
      vm.$scopedSlots !== emptyObject // has old scoped slots
    )

    vm.$options._parentVnode = parentVnode
    vm.$vnode = parentVnode // update vm's placeholder node without re-render
    if (vm._vnode) { // update child tree's parent
      vm._vnode.parent = parentVnode
    }
    vm.$options._renderChildren = renderChildren

    // update props
    if (propsData && vm.$options.props) {
      observerState.shouldConvert = false
      if (process.env.NODE_ENV !== 'production') {
        observerState.isSettingProps = true
      }
      const propKeys = vm.$options._propKeys || []
      for (let i = 0; i < propKeys.length; i++) {
        const key = propKeys[i]
        vm[key] = validateProp(key, vm.$options.props, propsData, vm)
      }
      observerState.shouldConvert = true
      if (process.env.NODE_ENV !== 'production') {
        observerState.isSettingProps = false
      }
      vm.$options.propsData = propsData
    }
    // update listeners
    if (listeners) {
      const oldListeners = vm.$options._parentListeners
      vm.$options._parentListeners = listeners
      updateComponentListeners(vm, listeners, oldListeners)
    }
    // resolve slots + force update if has children
    if (hasChildren) {
      vm.$slots = resolveSlots(renderChildren, parentVnode.context)
      vm.$forceUpdate()
    }
  }

  Vue.prototype.$forceUpdate = function () {
    const vm: Component = this
    if (vm._watcher) {
      vm._watcher.update()
    }
  }

  Vue.prototype.$destroy = function () {
    const vm: Component = this
    if (vm._isBeingDestroyed) {
      return
    }
    callHook(vm, 'beforeDestroy')
    vm._isBeingDestroyed = true
    // remove self from parent
    const parent = vm.$parent
    if (parent && !parent._isBeingDestroyed && !vm.$options.abstract) {
      remove(parent.$children, vm)
    }
    // teardown watchers
    if (vm._watcher) {
      vm._watcher.teardown()
    }
    let i = vm._watchers.length
    while (i--) {
      vm._watchers[i].teardown()
    }
    // remove reference from data ob
    // frozen object may not have observer.
    if (vm._data.__ob__) {
      vm._data.__ob__.vmCount--
    }
    // call the last hook...
    vm._isDestroyed = true
    callHook(vm, 'destroyed')
    // turn off all instance listeners.
    vm.$off()
    // remove __vue__ reference
    if (vm.$el) {
      vm.$el.__vue__ = null
    }
    // invoke destroy hooks on current rendered tree
    vm.__patch__(vm._vnode, null)
  }
}

export function callHook (vm: Component, hook: string) {
  const handlers = vm.$options[hook]
  if (handlers) {
    for (let i = 0, j = handlers.length; i < j; i++) {
      handlers[i].call(vm)
    }
  }
  if (vm._hasHookEvent) {
    vm.$emit('hook:' + hook)
  }
}
