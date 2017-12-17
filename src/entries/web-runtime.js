/* @flow */
 //从这里看出Vue是从'core/index'引入
import Vue from 'core/index'
import config from 'core/config'
import { extend, noop } from 'shared/util'
import { devtools, inBrowser, isEdge } from 'core/util/index'
import { patch } from 'web/runtime/patch'
import platformDirectives from 'web/runtime/directives/index'
import platformComponents from 'web/runtime/components/index'
import {
  query,
  isUnknownElement,
  isReservedTag,
  getTagNamespace,
  mustUseProp
} from 'web/util/index'

// install platform specific utils
// 安装平台特有的一些方法
Vue.config.isUnknownElement = isUnknownElement
Vue.config.isReservedTag = isReservedTag
Vue.config.getTagNamespace = getTagNamespace
Vue.config.mustUseProp = mustUseProp

// install platform runtime directives & components
// 安装平台特有的指令和组件
extend(Vue.options.directives, platformDirectives)
extend(Vue.options.components, platformComponents)

// install platform patch function
Vue.prototype.__patch__ = inBrowser ? patch : noop

// wrap mount
/**
 *
 *
 * @param {*} hydrating 我查了一下这个单词，是水合反应的意思
 */
Vue.prototwype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  /**
   * query => 检查el是否在页面中可以找到，
   * 如果找不到就create一个div,
   * 如果找到了，就返回document.querySelector(el)
   */
  el = el && inBrowser ? query(el) : undefined
  //lifecycle.js
  return this._mount(el, hydrating)
}

if (process.env.NODE_ENV !== 'production' &&
    inBrowser && typeof console !== 'undefined') {
  console[console.info ? 'info' : 'log'](
    `You are running Vue in development mode.\n` +
    `Make sure to turn on production mode when deploying for production.\n` +
    `See more tips at https://vuejs.org/guide/deployment.html`
  )
}

// devtools global hook
/* istanbul ignore next */
setTimeout(() => {
  if (config.devtools) {
    if (devtools) {
      devtools.emit('init', Vue)
    } else if (
      process.env.NODE_ENV !== 'production' &&
      inBrowser && !isEdge && /Chrome\/\d+/.test(window.navigator.userAgent)
    ) {
      console[console.info ? 'info' : 'log'](
        'Download the Vue Devtools extension for a better development experience:\n' +
        'https://github.com/vuejs/vue-devtools'
      )
    }
  }
}, 0)

export default Vue
