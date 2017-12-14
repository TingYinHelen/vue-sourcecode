/* @flow */

import type Watcher from './watcher'
import { remove } from '../util/index'

let uid = 0

/**
 * A dep is an observable that can have multiple
 * directives subscribing to it.
 */
export default class Dep {
  //target是一个watcher对象
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor () {
    this.id = uid++
    this.subs = []
  }

  addSub (sub: Watcher) {
    this.subs.push(sub)
  }

  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }

  depend () {
    if (Dep.target) {
      /**
       * 把当前的dep对象放在Dep.target中
       * 这里addDep方法是在watcher.target中定义的
       * 如果依赖队列中没有这个Dep的id，就将这个Dep存入this.subs中
       * 并且把id也存入
       * 如果id相同是不会加入到队列中的
       * addDep (dep: Dep) {
          const id = dep.id
          if (!this.newDepIds.has(id)) {
            this.newDepIds.add(id)
            this.newDeps.push(dep)
            if (!this.depIds.has(id)) {
              dep.addSub(this)
            }
          }
        }

        addSub (sub: Watcher) {
          this.subs.push(sub)
        }
      */
      Dep.target.addDep(this)
    }
  }

  notify () {
    // stablize the subscriber list first
    const subs = this.subs.slice()
    /**
     * 每一个都依赖都执行update
     */
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

// the current target watcher being evaluated.
// this is globally unique because there could be only one
// watcher being evaluated at any time.
Dep.target = null
const targetStack = []

export function pushTarget (_target: Watcher) {
  if (Dep.target) targetStack.push(Dep.target)
  /**
   * 把Dep.target设置成当前的watcher
   */
  Dep.target = _target
}

export function popTarget () {
  Dep.target = targetStack.pop()
}
