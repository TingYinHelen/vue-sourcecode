/* @flow */

/**
 * Convert a value to a string that is actually rendered.
 */
export function _toString (val: any): string {
  return val == null
    ? ''
    : typeof val === 'object'
      ? JSON.stringify(val, null, 2)
      : String(val)
}

/**
 * Convert a input value to a number for persistence.
 * If the conversion fails, return original string.
 */
export function toNumber (val: string): number | string {
  const n = parseFloat(val)
  return isNaN(n) ? val : n
}

/**
 * Make a map and return a function for checking if a key
 * is in that map.
 */
export function makeMap (
  str: string,
  expectsLowerCase?: boolean
): (key: string) => true | void {
  const map = Object.create(null)
  const list: Array<string> = str.split(',')

  //哦，这里不只是component和slot
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  /**
   *
   *val => map[val] <=>
   function(val){
     //请看这里，这里的map就是用了外层函数的变量
    return map[val]
   }
   返回的是一个函数，传入一个key返回true or false
   *传进来的是tag是component或者是slot就返回true
   *return一个function，这个function中的作用域可以使用这个函数中的变量
   *
   */
  return expectsLowerCase ? val => map[val.toLowerCase()] : val => map[val]
}

/**
 * Check if a tag is a built-in tag.
 */
export const isBuiltInTag = makeMap('slot,component', true)

/**
 * Remove an item from an array
 */
export function remove (arr: Array<any>, item: any): Array<any> | void {
  if (arr.length) {
    const index = arr.indexOf(item)
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}

/**
 * Check whether the object has the property.
 */
const hasOwnProperty = Object.prototype.hasOwnProperty
export function hasOwn (obj: Object, key: string): boolean {
  return hasOwnProperty.call(obj, key)
}

/**
 * Check if value is primitive
 */
export function isPrimitive (value: any): boolean {
  return typeof value === 'string' || typeof value === 'number'
}
/**
 * makeMap的用法是：将出入进去的值写入map中
 * const fun = makeMap('haha,hehe,heihei') => 这里 makeMap将返回一个函数
 * 调用fun(key)就可以检查key是否在makeMap生成的对象中
 * genStaticKeys(keys: string)这个函数先执行一次makeMap
 * 并且return makeMap,  这里genStaticKeys传入了一个keys，也就是和
 * makeMap()中本来的参数拼在一起,返回的就是本来makeMap的那个函数，只是
 * map的那个对象多了genStaticKeys传入的那个key
 * 现在已经比较明了了
 * 现在把genStaticKeys传入了cached函数，来看cached
 * cached反悔了一个函数cachedFn，接受一个字符串
 * cached用来做缓存，
 *
 *
 * cached其实就是传入一个函数，然后返回一个函数，然后向返回函数中传入string，有之前
 * cached的fn参数，来执行string
 * function cached(fn){
 *   const cache = Object.create(null)
 *
 *   return (function cachedFn(str){
 *      const hit = cache[str]
 *      等同于 cache[str] = fn(str), 然后返回fn(str)
 *      return hit || (cache[str] = fn(str))
 *   })
 * }
 * 这里就是将genStaticKeys全部存入cache中
 * const genStaticKeysCached = cached(genStaticKeys)
 *  genStaticKeysCached则是一个函数
 *
 */

/**
 * Create a cached version of a pure function.
 */
/**genStaticKeys()这个函数传入的值就是key: string,看key是否在
 * 'type,tag,attrsList,attrsMap,plain,parent,children,attrs'这里面
 *  function genStaticKeys (keys: string): Function {
      return makeMap(
        'type,tag,attrsList,attrsMap,plain,parent,children,attrs' +
        (keys ? ',' + keys : '')
      )
    }
 *
 *
 * const genStaticKeysCached = cached(genStaticKeys)
 *
 *
 * export function makeMap (
  str: string,
  expectsLowerCase?: boolean
): (key: string) => true | void {
  const map = Object.create(null)
  const list: Array<string> = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  //return expectsLowerCase ? val => map[val.toLowerCase()] : val => map[val]
//}
 *
 *
 *
 *
 *
 *
 */


export function cached<F: Function> (fn: F): F {
  const cache = Object.create(null)
  return (function cachedFn (str: string) {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  }: any)
}

/**
 * Camelize a hyphen-delimited string.
 */
const camelizeRE = /-(\w)/g
export const camelize = cached((str: string): string => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
})

/**
 * Capitalize a string.
 */
export const capitalize = cached((str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
})

/**
 * Hyphenate a camelCase string.
 */
const hyphenateRE = /([^-])([A-Z])/g
export const hyphenate = cached((str: string): string => {
  return str
    .replace(hyphenateRE, '$1-$2')
    .replace(hyphenateRE, '$1-$2')
    .toLowerCase()
})

/**
 * Simple bind, faster than native
 */
export function bind (fn: Function, ctx: Object): Function {
  function boundFn (a) {
    const l: number = arguments.length
    return l
      ? l > 1
        ? fn.apply(ctx, arguments)
        : fn.call(ctx, a)
      : fn.call(ctx)
  }
  // record original fn length
  boundFn._length = fn.length
  return boundFn
}

/**
 * Convert an Array-like object to a real Array.
 */
export function toArray (list: any, start?: number): Array<any> {
  start = start || 0
  let i = list.length - start
  const ret: Array<any> = new Array(i)
  while (i--) {
    ret[i] = list[i + start]
  }
  return ret
}

/**
 * Mix properties into target object.
 */
export function extend (to: Object, _from: ?Object): Object {
  for (const key in _from) {
    to[key] = _from[key]
  }
  return to
}

/**
 * Quick object check - this is primarily used to tell
 * Objects from primitive values when we know the value
 * is a JSON-compliant type.
 */
export function isObject (obj: mixed): boolean {
  return obj !== null && typeof obj === 'object'
}

/**
 * Strict object type check. Only returns true
 * for plain JavaScript objects.
 */
const toString = Object.prototype.toString
const OBJECT_STRING = '[object Object]'
export function isPlainObject (obj: any): boolean {
  return toString.call(obj) === OBJECT_STRING
}

/**
 * Merge an Array of Objects into a single Object.
 */
export function toObject (arr: Array<any>): Object {
  const res = {}
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i])
    }
  }
  return res
}

/**
 * Perform no operation.
 */
export function noop () {}

/**
 * Always return false.
 */
export const no = () => false

/**
 * Return same value
 */
export const identity = (_: any) => _

/**
 * Generate a static keys string from compiler modules.
 */
export function genStaticKeys (modules: Array<ModuleOptions>): string {
  return modules.reduce((keys, m) => {
    return keys.concat(m.staticKeys || [])
  }, []).join(',')
}

/**
 * Check if two values are loosely equal - that is,
 * if they are plain objects, do they have the same shape?
 */
export function looseEqual (a: mixed, b: mixed): boolean {
  const isObjectA = isObject(a)
  const isObjectB = isObject(b)
  if (isObjectA && isObjectB) {
    return JSON.stringify(a) === JSON.stringify(b)
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b)
  } else {
    return false
  }
}

export function looseIndexOf (arr: Array<mixed>, val: mixed): number {
  for (let i = 0; i < arr.length; i++) {
    if (looseEqual(arr[i], val)) return i
  }
  return -1
}

/**
 * Ensure a function is called only once.
 */
export function once (fn: Function): Function {
  let called = false
  return () => {
    if (!called) {
      called = true
      fn()
    }
  }
}
