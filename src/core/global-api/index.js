/* @flow */

import config from '../config'
import * as util from '../util/index'
import { initUse } from './use'
import { initMixin } from './mixin'
import { initExtend } from './extend'
import { initAssetRegisters } from './assets'
import { set, del } from '../observer/index'
import builtInComponents from '../components/index'

export function initGlobalAPI (Vue: GlobalAPI) {
  // config
  const configDef = {}
  configDef.get = () => config
  if (process.env.NODE_ENV !== 'production') {
    configDef.set = () => {
      util.warn(
        'Do not replace the Vue.config object, set individual fields instead.'
      )
    }
  }
  Object.defineProperty(Vue, 'config', configDef)
  Vue.util = util
  Vue.set = set
  Vue.delete = del
  Vue.nextTick = util.nextTick

  Vue.options = Object.create(null)
  /**
   *config._assetTypes: [
    'component',
    'directive',
    'filter'
  ],
   */
  config._assetTypes.forEach(type => {
    Vue.options[type + 's'] = Object.create(null)
  })

  // this is used to identify the "base" constructor to extend all plain-object
  // components with in Weex's multi-instance scenarios.
  Vue.options._base = Vue

  util.extend(Vue.options.components, builtInComponents)

  initUse(Vue)
  initMixin(Vue)
  //这里定义Vue.extend
  initExtend(Vue)

  //这里挂载['component','directive', 'filter']


  initAssetRegisters(Vue)
}
