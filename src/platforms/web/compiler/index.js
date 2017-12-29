/* @flow */

import { extend, genStaticKeys, noop } from 'shared/util'
import { warn } from 'core/util/debug'
import { compile as baseCompile } from 'compiler/index'
import { detectErrors } from 'compiler/error-detector'
//modules是有klass,style的数组
import modules from './modules/index'

import directives from './directives/index'
import { isReservedTag, mustUseProp, getTagNamespace, isPreTag } from '../util/index'
import { isUnaryTag } from './util'

const cache: { [key: string]: CompiledFunctionResult } = Object.create(null)

// compile中的option是扩展的这里的option
// 这里就设置了option的默认值
// 保存了一些与平台相关的配置，在编译模板的时候会用到
export const baseOptions: CompilerOptions = {
  expectHTML: true, //不知道
  modules, //包括klass和style，对模板中类和样式的解析
  staticKeys: genStaticKeys(modules), //静态关键词，包括staticClass,staticStyle
  directives, //这里包括model（v-model）、html（v-html）、text(v-text)三个指令
  isReservedTag, //是否是保留标签，html标签和SVG标签
  isUnaryTag, //是否是单标签，比如img、input、iframe等
  mustUseProp, //需要使用props绑定的属性，比如value、selected等
  getTagNamespace, //获取命名空间，svg和math
  isPreTag //是否是pre标签
}
/**
 * 这里可以看出，weex和web使用的compile都是同一个
 * import { compile as baseCompile } from 'compiler/index'
 * 只是options的参数配置不同
 * compile()的用法就是直接传template进去
 */
export function compile (
  template: string,
  options?: CompilerOptions
): CompiledResult {

  //如果有option将它exptend到baseOptions上，如果没有，就直接给baseOptions

  options = options
    ? extend(extend({}, baseOptions), options)
    : baseOptions

    // function compile(template, options){
    //   const ast = parse(template.trim(), options)
    //   optimize(ast, options)
    //   const code = generate(ast, options)
    //   return {
    //     ast,
    //     render: code.render,
    //     staticRenderFns: code.staticRenderFns
    //   }
    // }

  return baseCompile(template, options)
}
//将template进行编译
export function compileToFunctions (
  template: string,
  options?: CompilerOptions,
  vm?: Component
): CompiledFunctionResult {
  const _warn = (options && options.warn) || warn
  // detect possible CSP restriction
  /* istanbul ignore if */
  if (process.env.NODE_ENV !== 'production') {
    try {
      new Function('return 1')
    } catch (e) {
      if (e.toString().match(/unsafe-eval|CSP/)) {
        _warn(
          'It seems you are using the standalone build of Vue.js in an ' +
          'environment with Content Security Policy that prohibits unsafe-eval. ' +
          'The template compiler cannot work in this environment. Consider ' +
          'relaxing the policy to allow unsafe-eval or pre-compiling your ' +
          'templates into render functions.'
        )
      }
    }
  }
  const key = options && options.delimiters
    ? String(options.delimiters) + template
    : template
  if (cache[key]) {
    return cache[key]
  }
  const res = {}
  //compiled执行之后返回的是一个对象
  // {
  //   ast: ....,
  //   render: with(this){return _c('div',{attrs:{"id":"app"}},[_c('my-component')],1)},
  //   staticRenderFns: ....,
  //   errors: ....,
  //   tips: []
  // }

  const compiled = compile(template, options)

  res.render = makeFunction(compiled.render)

  const l = compiled.staticRenderFns.length
  res.staticRenderFns = new Array(l)
  for (let i = 0; i < l; i++) {
    res.staticRenderFns[i] = makeFunction(compiled.staticRenderFns[i])
  }
  if (process.env.NODE_ENV !== 'production') {
    if (res.render === noop || res.staticRenderFns.some(fn => fn === noop)) {
      _warn(
        `failed to compile template:\n\n${template}\n\n` +
        detectErrors(compiled.ast).join('\n') +
        '\n\n',
        vm
      )
    }
  }

  return (cache[key] = res)
}

function makeFunction (code) {
  try {
    return new Function(code)
  } catch (e) {
    return noop
  }
}
