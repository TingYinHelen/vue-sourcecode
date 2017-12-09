//这里进入框架的核心代码'./instance/index'
import Vue from './instance/index'

import { initGlobalAPI } from './global-api/index'
import { isServerRendering } from 'core/util/env'

/**
 * initGlobalAPI的作用是在Vue构造函数上挂载静态的属性和方法
 * 现在就比较明了了，initGlobalAPI是只要引入了vue框架就会执行的一个东东
 * 不用创建实例也会执行，这个时候options上已经有了
 * config._assetTypes: [
    'component',
    'directive',
    'filter'
  ],
  这个三个属性
 */
initGlobalAPI(Vue)

Object.defineProperty(Vue.prototype, '$isServer', {
  get: isServerRendering
})

Vue.version = '__VERSION__'

export default Vue


/**
 * 这里导入已经在prototype上挂在了属性和方法的Vue构造函数后
 * 分别将Vue作为参数传给initGlobalAPI
 * 在Vue.prototype上挂载$isServer
 * 然后添加静态属性version
 */
