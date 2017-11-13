/* @flow */

import { parse } from './parser/index'
import { optimize } from './optimizer'
import { generate } from './codegen/index'

/**
 * Compile a template.
 */
export function compile (
  template: string,
  options: CompilerOptions
): CompiledResult {
  //这里的AST打印出来看是一个对象
  //这里是将非结构化的字符串处理成结构化的JSON数据
  //这个JSON里有，attr,children, parent, plain, static, staticRoot, tag, type
  const ast = parse(template.trim(), options)
  //优化AST,这一步区分AST中哪些是动态的，哪些是静态的。
  //其实就是判断该节点以及其子节点有没有关联指令就可以判断

  optimize(ast, options)
  const code = generate(ast, options)
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