import { inspect } from 'util';

export default class Term {
  name: string;
  vars: string[];

  constructor();
  constructor(init: { name: string; vars: string[] });
  constructor(init: ((...vars: any[]) => void));
  constructor(init?: { name: string; vars: string[] } | ((...vars: any[]) => void)); // implementation

  constructor(init?: { name: string; vars: string[] } | ((...vars: any[]) => void)) {
    if (typeof init === 'undefined') {
      this.name = 'tau';
      this.vars = [];
      return;
    }

    if (typeof init === 'function') {
      this.name = init.name;
      this.vars = [];
      getParamNames(init).forEach(param => {
        this.vars[param] = null;
      });
      return;
    }

    const { name, vars } = init;

    this.name = name;
    this.vars = []
  }

  toString() {
    return `${this.name}(${Object.keys(this.vars).join(', ')})`
  }

  [inspect.custom](): string {
    return this.toString();
  }
}



export function getParamNames(func: Function): string[] {
  const fnStr = func.toString().replace(/[/][/].*$/mg, '') // remove single-line comments
    .replace(/\s+/g, '')        // remove spaces
    .replace(/[/][*][^/*]*[*][/]/g, ''); // remove multi-line comments
  const result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).split(',');
  return result.length === 1 && result[0] === '' ? [] : result;
}