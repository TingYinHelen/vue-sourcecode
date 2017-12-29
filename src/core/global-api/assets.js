/* @flow */

import config from '../config'
import { warn, isPlainObject } from '../util/index'

export function initAssetRegisters (Vue: GlobalAPI) {
  /**
   * Create asset registration methods.
   * config._assetTypes = ['component','directive', 'filter']
   * 分别挂载'component','directive', 'filter'
   * 平时的用法: Vue.component(name, {})
   */
  config._assetTypes.forEach(type => {
    Vue[type] = function (
      id: string,
      definition: Function | Object
    ): Function | Object | void {
      if (!definition) {
        return this.options[type + 's'][id]
      } else {
        /* istanbul ignore if */
        if (process.env.NODE_ENV !== 'production') {
          if (type === 'component' && config.isReservedTag(id)) {
            warn(
              'Do not use built-in or reserved HTML elements as component ' +
              'id: ' + id
            )
          }
        }
        //挂载component
        if (type === 'component' && isPlainObject(definition)) {
          //Vue.component(name, {})给组件起个名字
          definition.name = definition.name || id
          //Vue.options._base = Vue
          //可以看出vue.component其实就是调用了vue.extend
          //definition就是Vue.component(name, options)的第二个参数
          //也可以看出Vue.extend没有id这个参数Vue.component将第一个id
          //参数放到了definition.name下
          definition = this.options._base.extend(definition)
        }
        if (type === 'directive' && typeof definition === 'function') {
          definition = { bind: definition, update: definition }
        }

        this.options[type + 's'][id] = definition
        return definition
      }
    }
  })
}


// 简化：
// config._assetTypes.forEach(type => {
//   Vue[type] = function(id, definition){
//     definition.name = definition.name || id
//     if(type === 'component'){
//       definition = Vue.extend(definition) //definition就是配置项
//     }
//     return definition
//   }
// })
// Vue.component(id, definition) <=> Vue.extend(definition)
// 这样的话可以推断，下面这句才创建了一个组件实例
// {/* <my-component></my-component> */}