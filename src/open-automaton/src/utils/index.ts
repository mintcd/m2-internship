import { deepStrictEqual } from 'assert';
import * as acorn from "acorn";
import type { Dict } from '../../@types/index.ts';

export function getParamNames(func: Function): string[] {
  const ast = acorn.parse(`(${func.toString()})`, { ecmaVersion: 2020 }) as any;
  const expressionStatement = ast.body[0];

  if (expressionStatement.type !== 'ExpressionStatement') {
    throw new Error('Expected an expression.');
  }

  const expr = expressionStatement.expression;

  const params = expr.params;

  return params.flatMap((param: any) => {
    if (param.type === 'ObjectPattern') {
      return param.properties.map((p: any) => p.key.name);
    } else if (param.type === 'Identifier') {
      return param.name;
    } else {
      return null;
    }
  }).filter(Boolean);
}

// export function getParamNames(func: Function): string[] {
//   const fnStr = func.toString().replace(/[/][/].*$/mg, '') // remove single-line comments
//     .replace(/\s+/g, '')        // remove spaces
//     .replace(/[/][*][^/*]*[*][/]/g, ''); // remove multi-line comments
//   const result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).split(',');
//   return result.length === 1 && result[0] === '' ? [] : result;
// }

export function getBody(func: Function): string {
  const funcStr = func.toString();
  let body: string;

  if (funcStr.includes('=>')) {
    // Arrow function
    body = funcStr.split('=>')[1].trim();
    // Remove enclosing braces `{}` if present
    if (body.startsWith('{') && body.endsWith('}')) {
      body = body.slice(1, -1).trim();
    }
  } else {
    // Normal function (function keyword)
    const match = funcStr.match(/{([\s\S]*)}/);
    body = match ? match[1].trim() : '';
  }

  // Replace all forms of whitespace (spaces, tabs, newlines) with a single space
  body = body.replace(/\s+/g, ' ').trim();

  return `${body}`;
}


export function isDeepEqual(a: any, b: any): boolean {
  try {
    deepStrictEqual(a, b);
    return true;
  } catch {
    return false;
  }
}

export function randomElement<T>(arr: T[]): T {
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
}

export function copy(obj: any): any {
  return JSON.parse(JSON.stringify(obj));
}

export function remove<T>(arr: T[], item: T): T[] {
  const index = arr.indexOf(item);
  if (index === -1) return [...arr]; // If not found, return a shallow copy

  const newData = [...arr];  // Copy the array first
  newData.splice(index, 1);        // Then mutate the copy
  return newData;
}


export function validDict(obj: Dict) {
  return Object.values(obj).every(obj => obj !== undefined)
}
