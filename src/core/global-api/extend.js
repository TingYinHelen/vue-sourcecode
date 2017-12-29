/* @flow */

import config from '../config'
import { warn, mergeOptions } from '../util/index'
//整体看下来，Vue.extend()就是继承了Vue原型对象，然后将一些静态方法复制了过来
//然后添加了一些附加配置项
export function initExtend (Vue: GlobalAPI) {
  /**
   * Each instance constructor, including Vue, has a unique
   * cid. This enables us to create wrapped "child
   * constructors" for prototypal inheritance and cache them.
   */
  Vue.cid = 0
  let cid = 1

  /**
   * Class inheritance
   *
   * new Vue.extend(options)
   * 在调用new Vue()之前就注册了所有的全局自定义的组件
   */
  Vue.extend = function (extendOptions: Object): Function {
    extendOptions = extendOptions || {}
    //Super就是Vue有_init()方法
    const Super = this

    const SuperId = Super.cid
    const cachedCtors = extendOptions._Ctor || (extendOptions._Ctor = {})
    if (cachedCtors[SuperId]) {
      //如果组件已经缓存在cachedCtors中就直接取出
      return cachedCtors[SuperId]
    }
    const name = extendOptions.name || Super.options.name
    if (process.env.NODE_ENV !== 'production') {
      if (!/^[a-zA-Z][\w-]*$/.test(name)) {
        warn(
          'Invalid component name: "' + name + '". Component names ' +
          'can only contain alphanumeric characters and the hyphen, ' +
          'and must start with a letter.'
        )
      }
    }

    //可以看出Sub是一个构造函数
    //每次构造一个组件的时候，都生成一个新的构造函数VueComponent
    //原因是我们在VueComponent上定义了静态属性，如果只用一个类，那么后面
    // 定义的组件会覆盖前面组件的静态属性
    const Sub = function VueComponent (options) {
      this._init(options)
    }
    //让Sub继承将Vue的原型对象
    Sub.prototype = Object.create(Super.prototype)
    Sub.prototype.constructor = Sub
    Sub.cid = cid++
    //使用Vue的合并策略
    Sub.options = mergeOptions(
      Super.options,  //Vue的option
      extendOptions  //Vue.extend的option
    )
    //缓存父构造器
    Sub['super'] = Super
    // allow further extension/mixin/plugin usage
    //允许扩展extension/mixin/plugin
    //将Vue的一些静态方法给Sub
    Sub.extend = Super.extend
    Sub.mixin = Super.mixin
    Sub.use = Super.use
    // create asset registers, so extended classes
    // can have their private assets too.
    //同样是将Vue的静态方法给Sub
    config._assetTypes.forEach(function (type) {
      Sub[type] = Super[type]
    })
    // enable recursive self-lookup
    if (name) {
      Sub.options.components[name] = Sub
    }
    // keep a reference to the super options at extension time.
    // later at instantiation we can check if Super's options have
    // been updated.
    //将自定义的extendOptions放在Sub.extendOptions中，
    // 将Vue的options放在Sub.superOptions中
    Sub.superOptions = Super.options
    Sub.extendOptions = extendOptions
    // cache constructor
    cachedCtors[SuperId] = Sub
    //可以看出Vue.extend()返回的就是一个构造函数
    // 继承了Vue原型上的方法和属性
    // 然后复制了一些Vue的静态属性
    // 并且把extendOptions复制给自己的extendOptions静态属性
    return Sub
  }
}
