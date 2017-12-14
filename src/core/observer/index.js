/* @flow */

import Dep from './dep'
import { arrayMethods } from './array'
import {
  def,
  isObject,
  isPlainObject,
  hasProto,
  hasOwn,
  warn,
  isServerRendering
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * By default, when a reactive property is set, the new value is
 * also converted to become reactive. However when passing down props,
 * we don't want to force conversion because the value may be a nested value
 * under a frozen data structure. Converting it would defeat the optimization.
 */
export const observerState = {
  shouldConvert: true,
  isSettingProps: false
}

/**
 * Observer class that are attached to each observed
 * object. Once attached, the observer converts target
 * object's property keys into getter/setters that
 * collect dependencies and dispatches updates.
 */
/**
 * Observer会依附在每一个观察对象。
 * observer会将对象的属性key转入到getter/setter
 * 来搜集依赖和dispatche 更新
 *
 * Observer的作用就是就是遍历对象的所有属性进行双向绑定
 */
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that has this object as root $data

  constructor (value: any) {
    this.value = value
    //这里暂时不看
    this.dep = new Dep()
    this.vmCount = 0
    //
    def(value, '__ob__', this)
    if (Array.isArray(value)) {
      const augment = hasProto
        ? protoAugment
        : copyAugment
      augment(value, arrayMethods, arrayKeys)
      this.observeArray(value)
    } else {
      /**
       * 只有对象才走这一步
       * 因为在constructor里面所以在new Observer的时候执行
       */
      this.walk(value)
    }
  }

  /**
   * Walk through each property and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  //walk就是遍历data的所有属性，obj目前就是data
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      //将data的每一个属性都执行defineReactive这个函数
      //使用Object.defineProperty来绑定监听
      defineReactive(obj, keys[i], obj[keys[i]])
    }
  }

  /**
   * Observe a list of Array items.
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}

// helpers

/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src: Object) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment an target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 */
/**
 * 没懂这句话是啥意思。。
 *
 * 尝试创建一个observer的实例
 * 如果成功观察到，就返回一个新的observer
 * 否则的话，如果已经存在一个值就使用先有的observer
 * value 目前是data
 */
export function observe (value: any, asRootData: ?boolean): Observer | void {
  //判断是否是对象
  if (!isObject(value)) {
    return
  }
  /**
   * value就是data
   * 如果data有__ob__，并且value.__ob__是Observer的一个实例(说明已经存在一个Observer)
   * ob = value.__ob__
   * 否则的话生成一个Observer实例
   *
   */

  let ob: Observer | void
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    observerState.shouldConvert &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    //生成Observer
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 * defineReactive(obj, keys[i], obj[keys[i]])
 */
/**
 * 定义一个响应式的属性在对象上
 */

export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: Function
) {
  //又来了在get()中执行dep.depend()，在set()中执行dep.notify()
  //观察者模式
  //dep.depend()是绑定依赖，dep.notify()是触发通知
  //这也说明只有被get()过的属性才会绑定依赖，未被get()就忽略不管

  const dep = new Dep()
  //返回属性描述符

  const property = Object.getOwnPropertyDescriptor(obj, key)
  //如果该属性不能被删除或修改则不继续执行
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  /**
   * 直接将对象描述符的get和set封装成getter和setter函数
   * 当没有手动设置get和set的时候，getter和setter是undefined
   */
  const getter =  property && property.get
  const setter = property && property.set
  //进行递归绑定
  let childOb = observe(val)

  //core，使用defineProperty来绑定数据
  /**
   * 简化一下:
   * Object.defineProperty(data, key, {
   *  enumerable: true,
   *  configurable: true,
   *  get(){
   *    return value
   *  },
   *  set(newVal){
   *    if(val == newVal){
   *      return
   *    }
   *    //对新的值进行观察
   *    observe(newVal)
   *  }
   * })
   * 可以看出当我们获取或者设置data属性的时候就可以通过get和set就可以得到通知
   *
   */
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      /**
       *
       */
      const value = getter ? getter.call(obj) : val

      if (Dep.target) {
        /**
         * 收集依赖
         * 然后递归手机依赖
         * 如果是数组，将使用dependArray
         * 对象的每一个属性都要dep.depend()
         */
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
        }
        if (Array.isArray(value)) {
          dependArray(value)
        }
      }

      return value
    },
    set: function reactiveSetter (newVal) {
      /**
       * 在set之前先调用一次getter,将原来本来有的值取到
       */
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      /**
       *
       *
       */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /**
       *
       *
       */
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }

      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }

      childOb = observe(newVal)

      dep.notify()
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
export function set (obj: Array<any> | Object, key: any, val: any) {
  if (Array.isArray(obj)) {
    obj.length = Math.max(obj.length, key)
    obj.splice(key, 1, val)
    return val
  }
  if (hasOwn(obj, key)) {
    obj[key] = val
    return
  }
  const ob = obj.__ob__
  if (obj._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return
  }
  if (!ob) {
    obj[key] = val
    return
  }
  defineReactive(ob.value, key, val)
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del (obj: Array<any> | Object, key: any) {
  if (Array.isArray(obj)) {
    obj.splice(key, 1)
    return
  }
  const ob = obj.__ob__
  if (obj._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  if (!hasOwn(obj, key)) {
    return
  }
  delete obj[key]
  if (!ob) {
    return
  }
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
