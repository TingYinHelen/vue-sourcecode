/* @flow */

import { genHandlers } from './events'
import { baseWarn, pluckModuleFunction } from '../helpers'
import baseDirectives from '../directives/index'
import { camelize, no } from 'shared/util'

type TransformFunction = (el: ASTElement, code: string) => string;
type DataGenFunction = (el: ASTElement) => string;
type DirctiveFunction = (el: ASTElement, dir: ASTDirective, warn: Function) => boolean;

// configurable state
let warn
let transforms: Array<TransformFunction>
let dataGenFns: Array<DataGenFunction>
let platformDirectives
let isPlatformReservedTag
let staticRenderFns //存放静态节点
let onceCount
let currentOptions


/**
 *直接看这个版本的吧

 function generate ( ast, options ) {
  var state = new CodegenState(options);
  var code = ast ? genElement(ast, state) : '_c("div")';
  return {
    render: ("with(this){return " + code + "}"),
    staticRenderFns: state.staticRenderFns
  }
  //
  state打印出来看到的属性有：dataGenFns, directives(这里面是各种指令方法),
  maybeComponent,options,staticRenderFns:[], transforms: [],warn:function
  我暂时还不知道这个state使用感干啥的。。。先去看genElement函数




  这里code打印出来是下面这个
  _c('div',{attrs:{"id":"app"}},[_v("\n    "+_s(message)+"\n    "),_c('div',[_v("\n      这里是一个静态子节点\n      "),_c('span',[_v("\n        哈哈哈\n      ")]),_v(" "),_c('test'),_v(" "),_c('ul',_l((list),function(item){return _c('li',{attrs:{"title":item}})}))],1)])
vue.js:9415 _c('div',[_v("这是一个自定义的component")])
  来看genElement
}
 *
 *
 * function pluckModuleFunction<F: Function> (
    modules: ?Array<Object>,
    key: string
  ): Array<F> {
    return modules ? modules.map(m => m[key]).filter(_ => _) : []
  }
 *
 *
 *
 *
 */

export function generate (
  ast: ASTElement | void,
  options: CompilerOptions
): {
  render: string,
  staticRenderFns: Array<string>
} {
  // save previous staticRenderFns so generate calls can be nested

  const prevStaticRenderFns: Array<string> = staticRenderFns

  const currentStaticRenderFns: Array<string> = staticRenderFns = []

  const prevOnceCount = onceCount
  //这个就是上面state打印出来的
  onceCount = 0
  currentOptions = options
  warn = options.warn || baseWarn
  transforms = pluckModuleFunction(options.modules, 'transformCode')
  dataGenFns = pluckModuleFunction(options.modules, 'genData')
  platformDirectives = options.directives || {}
  isPlatformReservedTag = options.isReservedTag || no
  const code = ast ? genElement(ast) : '_c("div")'
  /**
   * genElement()函数其实就是将ast对象转成下面code的字符串的样子
   * code的返回值（genElement的返回值）
   * _c('div',{attrs:{"id":"app"}},[_v("\n    "+_s(message)+"\n    "),_c('div',[_v("\n      这里是一个静态子节点\n      "),_c('span',[_v("\n        哈哈哈\n      ")]),_v(" "),_c('test'),_v(" "),_c('ul',_l((list),function(item){return _c('li',{attrs:{"title":item}})}))],1)])
vue.js:9415 _c('div',[_v("这是一个自定义的component")])

    //_c()用于创建标签，component
    //_v()用于创建文本标签
    //_l()我发现使用了v-for指令的节点都是用_l()来表示
    //_e()
   *
   *
   */
  staticRenderFns = prevStaticRenderFns
  onceCount = prevOnceCount

  return {
    render: `with(this){return ${code}}`, //函数体
    staticRenderFns: currentStaticRenderFns //数组字符串的显示还是_c, _v这种形式和动态节点相同
  }
}
/**
 *
 *
 *
 *
 *
 *
 *
 *先简单看一下genElement返回值，然后在继续查看每一个函数是怎么处理的
 *
 *genElement就是将ast转成render函数的字符串的样子
 */
function genElement (el: ASTElement): string {
  //问题staticProcessed是用来做什么的
  if (el.staticRoot && !el.staticProcessed) {

    //genStatic：生成静态节点，并把它存在staticRenderFns这个数组中
    //作为render函数静态节点的返回
    return genStatic(el)

  } else if (el.once && !el.onceProcessed) {

    //
    return genOnce(el)

  } else if (el.for && !el.forProcessed) {

    //这个for返回的是_l()这个函数
    return genFor(el)

  } else if (el.if && !el.ifProcessed) {

    //genIf()返回的是这样的(show)?_c('div',[_v("这里改成有if指令")]):_e()
    //show就是我控制显示和隐藏的变量
    //如果show是true就返回后面的_c(),如果show是false则返回_e()
    return genIf(el)

  } else if (el.tag === 'template' && !el.slotTarget) {

    //genChildren()返回的是，如果是template就直接返回子节点的genElement()
    return genChildren(el) || 'void 0'
    //基础知识补充
    /**
     *这里为什么使用void 0而不使用undefined
     *这里直接贴我的简书:http://www.jianshu.com/p/51e5eaf438e7
     */


  } else if (el.tag === 'slot') {

    //genSlot()返回的是，_t()，如果是标签切是具名slot函数的参数是footer，
    //如果是文本，参数是default
    return genSlot(el)

  } else {
    //静态节点但是又不是静态根节点走这一步
    // component or element
    let code
    //其实下面几个属性我还不知道是什么东西:el.plain,el.inlineTemplate
    //我这里测试静态节点data是undefined
    //先看看genChildren()
    if (el.component) {
      code = genComponent(el.component, el)
    } else {
      // data这里返回的是元素的属性，staticStyle:{"border":"1px solid red"}，attrs:{"id":"app"}
      const data = el.plain ? undefined : genData(el)


      const children = el.inlineTemplate ? null : genChildren(el, true)

      code = `_c('${el.tag}'${
        data ? `,${data}` : '' // data
      }${
        children ? `,${children}` : '' // children
      })`
    }
    // module transforms
    //问题这里的transforms是什么
    for (let i = 0; i < transforms.length; i++) {
      code = transforms[i](el, code)
    }
    return code
  }
}

// hoist static sub-trees out
function genStatic (el: ASTElement): string {
  el.staticProcessed = true
  staticRenderFns.push(`with(this){return ${genElement(el)}}`)
  return `_m(${staticRenderFns.length - 1}${el.staticInFor ? ',true' : ''})`
}

// v-once
function genOnce (el: ASTElement): string {
  el.onceProcessed = true
  if (el.if && !el.ifProcessed) {
    return genIf(el)
  } else if (el.staticInFor) {
    let key = ''
    let parent = el.parent
    while (parent) {
      if (parent.for) {
        key = parent.key
        break
      }
      parent = parent.parent
    }
    if (!key) {
      process.env.NODE_ENV !== 'production' && warn(
        `v-once can only be used inside v-for that is keyed. `
      )
      return genElement(el)
    }
    return `_o(${genElement(el)},${onceCount++}${key ? `,${key}` : ``})`
  } else {
    return genStatic(el)
  }
}

function genIf (el: any): string {
  el.ifProcessed = true // avoid recursion
  return genIfConditions(el.ifConditions.slice())
}

function genIfConditions (conditions: ASTIfConditions): string {
  if (!conditions.length) {
    return '_e()'
  }

  const condition = conditions.shift()
  if (condition.exp) {
    return `(${condition.exp})?${genTernaryExp(condition.block)}:${genIfConditions(conditions)}`
  } else {
    return `${genTernaryExp(condition.block)}`
  }

  // v-if with v-once should generate code like (a)?_m(0):_m(1)
  function genTernaryExp (el) {
    return el.once ? genOnce(el) : genElement(el)
  }
}

function genFor (el: any): string {
  const exp = el.for
  const alias = el.alias
  const iterator1 = el.iterator1 ? `,${el.iterator1}` : ''
  const iterator2 = el.iterator2 ? `,${el.iterator2}` : ''

  if (
    process.env.NODE_ENV !== 'production' &&
    maybeComponent(el) && el.tag !== 'slot' && el.tag !== 'template' && !el.key
  ) {
    warn(
      `<${el.tag} v-for="${alias} in ${exp}">: component lists rendered with ` +
      `v-for should have explicit keys. ` +
      `See https://vuejs.org/guide/list.html#key for more info.`
    )
  }

  el.forProcessed = true // avoid recursion
  return `_l((${exp}),` +
    `function(${alias}${iterator1}${iterator2}){` +
      `return ${genElement(el)}` +
    '})'
}

function genData (el: ASTElement): string {
  // 遍历AST的每一个属性，如果有该属性，就把它加入对象中，最后返回的是一个对象样子的字符串
  let data = '{'

  // directives first.
  // directives may mutate the el's other properties before they are generated.
  //先查看有指令的元素，因为指令有可能会在他生成之前改变其他的属性
  const dirs = genDirectives(el)
  if (dirs) data += dirs + ','

  // key
  if (el.key) {
    data += `key:${el.key},`
  }
  // ref
  if (el.ref) {
    data += `ref:${el.ref},`
  }
  //如果有ref使用v-for指定的el.refInfor就是refInFor
  if (el.refInFor) {
    data += `refInFor:true,`
  }
  // pre
  if (el.pre) {
    data += `pre:true,`
  }
  // record original tag name for components using "is" attribute
  if (el.component) {
    data += `tag:"${el.tag}",`
  }
  // module data generation functions
  //staticClass 和staticStyle
  for (let i = 0; i < dataGenFns.length; i++) {
    data += dataGenFns[i](el)
  }
  // attributes
  //元素的attrs
  if (el.attrs) {
    data += `attrs:{${genProps(el.attrs)}},`
  }
  // DOM props
  if (el.props) {
    data += `domProps:{${genProps(el.props)}},`
  }
  // event handlers
  if (el.events) {
    data += `${genHandlers(el.events)},`
  }
  if (el.nativeEvents) {
    data += `${genHandlers(el.nativeEvents, true)},`
  }
  // slot target
  if (el.slotTarget) {
    data += `slot:${el.slotTarget},`
  }
  // scoped slots
  if (el.scopedSlots) {
    data += `${genScopedSlots(el.scopedSlots)},`
  }
  // component v-model
  if (el.model) {
    data += `model:{value:${el.model.value},callback:${el.model.callback}},`
  }
  // inline-template(内联模板)
  if (el.inlineTemplate) {
    const inlineTemplate = genInlineTemplate(el)
    if (inlineTemplate) {
      data += `${inlineTemplate},`
    }
  }
  data = data.replace(/,$/, '') + '}'
  // v-bind data wrap
  if (el.wrapData) {
    data = el.wrapData(data)
  }
  return data
}

function genDirectives (el: ASTElement): string | void {
  const dirs = el.directives
  if (!dirs) return
  let res = 'directives:['
  let hasRuntime = false
  let i, l, dir, needRuntime
  for (i = 0, l = dirs.length; i < l; i++) {
    dir = dirs[i]
    needRuntime = true
    const gen: DirctiveFunction = platformDirectives[dir.name] || baseDirectives[dir.name]
    if (gen) {
      // compile-time directive that manipulates AST.
      // returns true if it also needs a runtime counterpart.
      needRuntime = !!gen(el, dir, warn)
    }
    if (needRuntime) {
      hasRuntime = true
      res += `{name:"${dir.name}",rawName:"${dir.rawName}"${
        dir.value ? `,value:(${dir.value}),expression:${JSON.stringify(dir.value)}` : ''
      }${
        dir.arg ? `,arg:"${dir.arg}"` : ''
      }${
        dir.modifiers ? `,modifiers:${JSON.stringify(dir.modifiers)}` : ''
      }},`
    }
  }
  if (hasRuntime) {
    return res.slice(0, -1) + ']'
  }
}

function genInlineTemplate (el: ASTElement): ?string {
  const ast = el.children[0]
  if (process.env.NODE_ENV !== 'production' && (
    el.children.length > 1 || ast.type !== 1
  )) {
    warn('Inline-template components must have exactly one child element.')
  }
  if (ast.type === 1) {
    const inlineRenderFns = generate(ast, currentOptions)
    return `inlineTemplate:{render:function(){${
      inlineRenderFns.render
    }},staticRenderFns:[${
      inlineRenderFns.staticRenderFns.map(code => `function(){${code}}`).join(',')
    }]}`
  }
}

function genScopedSlots (slots: { [key: string]: ASTElement }): string {
  return `scopedSlots:_u([${
    Object.keys(slots).map(key => genScopedSlot(key, slots[key])).join(',')
  }])`
}

function genScopedSlot (key: string, el: ASTElement) {
  return `[${key},function(${String(el.attrsMap.scope)}){` +
    `return ${el.tag === 'template'
      ? genChildren(el) || 'void 0'
      : genElement(el)
  }}]`
}
/**
 * 如果是静态节点的时候会执行genChildren
 *
 *
 */
function genChildren (el: ASTElement, checkSkip?: boolean): string | void {
  const children = el.children
  //递归
  if (children.length) {

    const el: any = children[0]


    // optimize single v-for
    //有子节点就继续调用genElement
    if (children.length === 1 &&
        el.for &&
        el.tag !== 'template' &&
        el.tag !== 'slot') {
      return genElement(el)
    }

    //还不知道这里是什么，但是静态节点都返回的是0
    const normalizationType = getNormalizationType(children)

    //这里在遍历子节点，有标签的部分就继续调用genElement()，
    //如果是文本节点的就直接调用genText()返回_v(text.text)
    //如果是标签节点就直接调用genElement()然后递归
    return `[${children.map(genNode).join(',')}]${
      checkSkip
        ? normalizationType ? `,${normalizationType}` : ''
        : ''
    }`
  }
}

// determine the normalization needed for the children array.
// 0: no normalization needed
// 1: simple normalization needed (possible 1-level deep nested array)
// 2: full normalization needed
function getNormalizationType (children: Array<ASTNode>): number {
  let res = 0
  for (let i = 0; i < children.length; i++) {
    const el: ASTNode = children[i]
    if (el.type !== 1) {
      continue
    }
    if (needsNormalization(el) ||
        (el.ifConditions && el.ifConditions.some(c => needsNormalization(c.block)))) {
      res = 2
      break
    }
    if (maybeComponent(el) ||
        (el.ifConditions && el.ifConditions.some(c => maybeComponent(c.block)))) {
      res = 1
    }
  }
  return res
}

function needsNormalization (el: ASTElement): boolean {
  return el.for !== undefined || el.tag === 'template' || el.tag === 'slot'
}

function maybeComponent (el: ASTElement): boolean {
  return !isPlatformReservedTag(el.tag)
}

function genNode (node: ASTNode): string {
  if (node.type === 1) {
    return genElement(node)
  } else {
    return genText(node)
  }
}

function genText (text: ASTText | ASTExpression): string {
  //有{{}}这个的就有text.expression
  return `_v(${text.type === 2
    ? text.expression // no need for () because already wrapped in _s()
    : transformSpecialNewlines(JSON.stringify(text.text))
  })`
}

function genSlot (el: ASTElement): string {
  const slotName = el.slotName || '"default"'
  const children = genChildren(el)
  let res = `_t(${slotName}${children ? `,${children}` : ''}`
  const attrs = el.attrs && `{${el.attrs.map(a => `${camelize(a.name)}:${a.value}`).join(',')}}`
  const bind = el.attrsMap['v-bind']
  if ((attrs || bind) && !children) {
    res += `,null`
  }
  if (attrs) {
    res += `,${attrs}`
  }
  if (bind) {
    res += `${attrs ? '' : ',null'},${bind}`
  }
  return res + ')'
}

// componentName is el.component, take it as argument to shun flow's pessimistic refinement
function genComponent (componentName: string, el: ASTElement): string {
  const children = el.inlineTemplate ? null : genChildren(el, true)
  return `_c(${componentName},${genData(el)}${
    children ? `,${children}` : ''
  })`
}

function genProps (props: Array<{ name: string, value: string }>): string {
  let res = ''
  for (let i = 0; i < props.length; i++) {
    const prop = props[i]
    res += `"${prop.name}":${transformSpecialNewlines(prop.value)},`
  }
  return res.slice(0, -1)
}

// #3895, #4268
//将换行符转义（\u2028会编译成换行符。）
function transformSpecialNewlines (text: string): string {
  return text
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
