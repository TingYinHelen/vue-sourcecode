/* @flow */

import { parse } from './parser/index'
import { optimize } from './optimizer'
import { generate } from './codegen/index'

/**
 * Compile a template.
 */
//将字符串模板转成render函数
export function compile (
  template: string,
  options: CompilerOptions
): CompiledResult {
  //这里的AST打印出来看是一个对象
  //这里是将非结构化的字符串处理成结构化的JSON数据
  //这个JSON里有，attr,children, parent, plain, static, staticRoot, tag, type
  const ast = parse(template.trim(), options)
  //优化AST
  //所谓的优化就是将静态节点加一个属性static,true就是静态节点，false就不是
  //静态根节点添加属性staticRoot， 同上
  optimize(ast, options)




  const code = generate(ast, options)
  /**
   * code返回的是一个
   * {
        render: '',  //render是一个函数，是什么函数呢等我看完了回来再说
        staticRenderFns: ''
     }
     动态节点才在render函数中体现，静态节点在staticRenderFns中体现
   *  静态节点只会在初次显示view的时候被执行，后面的model变化将不会再改变
   *
   *
   *
   */


  return {
    ast,
    render: code.render,
    staticRenderFns: code.staticRenderFns
  }
}
/**
 * AST中的type:
 *type: 1(标签节点)
 *type: 2(表达式，就是动态的)
 *type: 3(静态的文本节点)
 *如果AST中一个node有指令则会有相应的字段作为标注
 *
 *AST中的tag
 *一般的标签节点是什么tag就是什么
 *文本节点没有tag
 *组件的tag就是组件名
 *slot的tag就是slot
 *
 *
 *
 */