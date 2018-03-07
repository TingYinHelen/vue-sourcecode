/* @flow */

import config from '../config'
import Dep, { pushTarget, popTarget } from './dep'
import { queueWatcher } from './scheduler'
import {
  warn,
  remove,
  isObject,
  parsePath,
  _Set as Set
} from '../util/index'

let uid = 0

// vm.$watch(
//   function () {
//     return this.a + this.b
//   },
//   function (newVal, oldVal) {
//     // 做点什么
//   }
// )

/**
 * A watcher parses an expression, collects dependencies,
 * and fires callback when the expression value changes.
 * This is used for both the $watch() api and directives.
 */
/**
 * 一个watcher就是parse一个expression，收集依赖
 * 当expression的值改变的时候fire一个回调函数
 * 这被用在$watch() api 和 directives
 */
//有三个地方new Watcher => mountComponent,initComputed,Vue.prototype.$watch

export default class Watcher {
  vm: Component;
  expression: string;
  cb: Function;
  id: number;
  deep: boolean;
  user: boolean;
  lazy: boolean;
  sync: boolean;
  dirty: boolean;
  active: boolean;
  deps: Array<Dep>;
  newDeps: Array<Dep>;
  depIds: Set;
  newDepIds: Set;
  getter: Function;
  value: any;
  /**
   *
   * @param {*} options
   */
  constructor (
    vm: Component,
    expOrFn: string | Function, //watch可以是表达式也可以是计算属性函数
    cb: Function,
    options?: Object //
  ) {
    this.vm = vm
    vm._watchers.push(this)
    // options
    if (options) {
      this.deep = !!options.deep
      this.user = !!options.user
      this.lazy = !!options.lazy
      this.sync = !!options.sync
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }
    this.cb = cb
    this.id = ++uid // uid for batching
    this.active = true
    this.dirty = this.lazy // for lazy watchers
    this.deps = []
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()
    this.expression = process.env.NODE_ENV !== 'production'
      ? expOrFn.toString()
      : ''
    // parse expression for getter
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      /**
       *  this.getter就是watch的属性
       *  取值就会触发data的get，
       *  就会将watch.target设置成 dep.target然后存入依赖队列
       */
      this.getter = parsePath(expOrFn)
      if (!this.getter) {
        this.getter = function () {}
        process.env.NODE_ENV !== 'production' && warn(
          `Failed watching path: "${expOrFn}" ` +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        )
      }
    }
    /**
     * 这句是核心，获取当前的值
     * 也就是对expOrFn就值
     */
    this.value = this.lazy
      ? undefined
      : this.get()
  }

  /**
   * Evaluate the getter, and re-collect dependencies.
   * 这里看一下呢
   */
  get () {
    /**
     * 将这个watcher实例设置为Dep.target
     * 只有在new Watcher的时候才会执行pushTarget(this)
     * 也就是只有在pushTarget的时候才会Dep.target = this
     */
    pushTarget(this)
    /**
     * 获取值，触发defineProperty中的get方法
     * this.getter = expOrFn
     * expOrFn.call(this.vm, this.vm)
     * 其实就是执行一次expOrFn
     * 也就会使用到this.a,this.b
     * 就会触发get()
     */
    const value = this.getter.call(this.vm, this.vm)
    //上面这一步是将这个watcher放进属性的subs中
    // "touch" every property so they are all tracked as
    // dependencies for deep watching
    if (this.deep) {
      traverse(value)
    }
    popTarget()

    /**
     * 清除依赖
     */
    this.cleanupDeps()
    return value
  }

  /**
   * Add a dependency to this directive.
   */
  addDep (dep: Dep) {
    const id = dep.id
    //问题newDepIds
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      //去重，如果已经有了这个id的Dep，就不加入到sub中了
      if (!this.depIds.has(id)) {
        dep.addSub(this)
      }
    }
  }

  /**
   * Clean up for dependency collection.
   * 清理依赖
   */
  cleanupDeps () {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      //如果这个watcher不依赖与某个数据就要把这个依赖给删除
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }

    // this.deps = []
    // this.newDeps = []
    // this.depIds = new Set()
    // this.newDepIds = new Set()

    let tmp = this.depIds
    //更新depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    //清空newDepIds
    this.newDepIds.clear()
    tmp = this.deps
    //这里赋值了this.deps
    //更新deps
    this.deps = this.newDeps
    this.newDeps = tmp
    //清空newDeps
    this.newDeps.length = 0
  }

  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  update () {
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true
    } else if (this.sync) {
      this.run()
    } else {
      queueWatcher(this)
    }
  }

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  run () {
    if (this.active) {
      const value = this.get()
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) ||
        this.deep
      ) {
        // set new value
        const oldValue = this.value
        this.value = value
        if (this.user) {
          try {
            this.cb.call(this.vm, value, oldValue)
          } catch (e) {
            /* istanbul ignore else */
            if (config.errorHandler) {
              config.errorHandler.call(null, e, this.vm)
            } else {
              process.env.NODE_ENV !== 'production' && warn(
                `Error in watcher "${this.expression}"`,
                this.vm
              )
              throw e
            }
          }
        } else {
          this.cb.call(this.vm, value, oldValue)
        }
      }
    }
  }

  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   */
  evaluate () {
    this.value = this.get()
    this.dirty = false
  }

  /**
   * Depend on all deps collected by this watcher.
   */
  depend () {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }

  /**
   * Remove self from all dependencies' subscriber list.
   */
  teardown () {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this)
      }
      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }
      this.active = false
    }
  }
}

/**
 * Recursively traverse an object to evoke all converted
 * getters, so that every nested property inside the object
 * is collected as a "deep" dependency.
 */
const seenObjects = new Set()
function traverse (val: any) {
  seenObjects.clear()
  _traverse(val, seenObjects)
}

function _traverse (val: any, seen: Set) {
  let i, keys
  const isA = Array.isArray(val)
  if ((!isA && !isObject(val)) || !Object.isExtensible(val)) {
    return
  }
  if (val.__ob__) {
    const depId = val.__ob__.dep.id
    if (seen.has(depId)) {
      return
    }
    seen.add(depId)
  }
  if (isA) {
    i = val.length
    while (i--) _traverse(val[i], seen)
  } else {
    keys = Object.keys(val)
    i = keys.length
    while (i--) _traverse(val[keys[i]], seen)
  }
}
