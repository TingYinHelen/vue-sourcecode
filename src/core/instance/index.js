import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

//这里是框架的开始，从这里new一个vue实例
//Vue的构造函数
function Vue (options) {
  //这是一个安全模式的处理，告诉开发者必须以new操作符来调用Vue
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }

  this._init(options)
}
//这里提供的_init()方法，在new Vue()的时候执行this._init()
/**
 * 以下5个函数都是向Vue的prototype上挂载属性和方法
 */
initMixin(Vue)
stateMixin(Vue)
eventsMixin(Vue)
lifecycleMixin(Vue)
renderMixin(Vue)

export default Vue
/**
 * 在执行完以上5个函数后就会继续回到core/index.js
 */
