/* @flow */
//这里可以看到 Vue是从'./web-runtime'引入的
import Vue from './web-runtime'
import { warn, cached } from 'core/util/index'
import { query } from 'web/util/index'
import { shouldDecodeNewlines } from 'web/util/compat'
//编译部分的代码在src/platforms/web/compiler下面
import { compileToFunctions } from 'web/compiler/index'

const idToTemplate = cached(id => {
  const el = query(id)
  return el && el.innerHTML
})

//缓存了'./web-runtime'中的Vue.prototype.$mount
const mount = Vue.prototype.$mount

//然后重新覆盖了Vue.prototype.$mount
//注意搞清楚是哪个对象
Vue.prototype.$mount = function (
  el?: string | Element,
  hydrating?: boolean
): Component {
  el = el && query(el)

  /* istanbul ignore if */
  if (el === document.body || el === document.documentElement) {
    process.env.NODE_ENV !== 'production' && warn(
      `Do not mount Vue to <html> or <body> - mount to normal elements instead.`
    )
    return this
  }

  const options = this.$options
  // resolve template/el and convert to render function
  if (!options.render) {
    let template = options.template
    //如果有template直接
    if (template) {
      if (typeof template === 'string') {
        if (template.charAt(0) === '#') {
          template = idToTemplate(template)
          /* istanbul ignore if */
          if (process.env.NODE_ENV !== 'production' && !template) {
            warn(
              `Template element not found or is empty: ${options.template}`,
              this
            )
          }
        }
      } else if (template.nodeType) {
        template = template.innerHTML
      } else {
        if (process.env.NODE_ENV !== 'production') {
          warn('invalid template option:' + template, this)
        }
        return this
      }
    } else if (el) {
      //直接把el中的整个代码以字符串赋给template
      template = getOuterHTML(el)
    }
    //这里开始编译 template
    if (template) {

      //compileToFunctions将template转成render
      //准备render函数最核心的一步
      //compileToFunctions有两步:
      // 1.生成ast
      // 2.利用generate(ast, options)生成render函数

      const { render, staticRenderFns } = compileToFunctions(template, {
        warn: msg => warn(msg, this),
        shouldDecodeNewlines,
        delimiters: options.delimiters
      }, this)
      //将compileToFunctions生成的render给this.$options
      options.render = render
      options.staticRenderFns = staticRenderFns
    }
  }
  //用缓存了'./web-runtime'中的Vue.prototype.$mount来执行
  //然额'./web-runtime'中的Vue.prototype.$mount'用的是lifecycle.js中的_mount
  return mount.call(this, el, hydrating)
}

/**
 * Get outerHTML of elements, taking care
 * of SVG elements in IE as well.
 */
function getOuterHTML (el: Element): string {
  //outerHTML会返回包括el在内的元素
  //innerHTML会返回el内的元素
  //所以一个是inner一个是outer
  if (el.outerHTML) {
    return el.outerHTML
  } else {
    const container = document.createElement('div')
    container.appendChild(el.cloneNode(true))
    return container.innerHTML
  }
}
//全局的compile函数
Vue.compile = compileToFunctions

export default Vue
