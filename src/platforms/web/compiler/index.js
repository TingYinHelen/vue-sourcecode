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

//compile中的option是扩展的这里的option
// 这里就设置了option的默认值
export const baseOptions: CompilerOptions = {
  expectHTML: true,
  modules,
  staticKeys: genStaticKeys(modules),
  directives,
  isReservedTag,
  isUnaryTag,
  mustUseProp,
  getTagNamespace,
  isPreTag
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
  return baseCompile(template, options)
}

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
