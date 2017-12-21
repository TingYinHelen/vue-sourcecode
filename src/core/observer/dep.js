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
  subs: Array<Watcher>; //subs存的是这个Dep的所有订阅者Watcher

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
     * 遍历这个依赖的所有订阅者watcher
     */
    for (let i = 0, l = subs.length; i < l; i++) {
      //update()的最终目的就是要执行Watcher的get()
      //执行这个Watcher的get()的时候就会触发这个Watcher的依赖们的get()
      //然后重新收集依赖
      subs[i].update()
    }
  }
}

// the current target watcher being evaluated.
// this is globally unique because there could be only one
// watcher being evaluated at any time.
/**
 * 当前的target watcher被就值
 * 这是一个全局的唯一的，因为这在某一时间段只能有
 * 一个watcher在被计算
 */

Dep.target = null
const targetStack = []

export function pushTarget (_target: Watcher) {
  //？？？
  if (Dep.target) targetStack.push(Dep.target)
  /**
   * 把Dep.target设置成当前的watcher
   */
  Dep.target = _target
}

export function popTarget () {
  Dep.target = targetStack.pop()
}
