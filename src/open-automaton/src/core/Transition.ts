import type { Dict, Function } from "../../@types/index.js";
import { inspect } from 'util';

import Predicate from "./Predicate.ts";
import Action from "./Action.ts";
import { getBody, getParamNames, copy } from "../utils/index.ts";


export default class Transition {
  src: string
  dst: string
  action: Action
  holeActions: Dict<Action>
  guard: Predicate
  reassign: (values: Dict) => Dict

  reassignment: Dict<Function<any>>;

  constructor({
    src, dst,
    action = new Action(),
    holeActions = {},
    guard = new Predicate(true),
    reassignment = {}
  }: {
    src: string;
    dst: string,
    action?: Action,
    holeActions?: Dict<Action>,
    guard?: Predicate,
    reassignment?: Dict<((values: Dict) => any)>
  }) {
    this.src = src
    this.dst = dst
    this.action = action
    this.holeActions = holeActions
    this.guard = guard
    this.reassignment = reassignment


    this.reassign = function (values: Dict) {
      const result: Dict = {}
      Object.entries(reassignment).forEach(([name, func]) => {
        result[name] = func(values)
      })
      return result
    }
  }

  toString() {
    const holeActionsString = Object.entries(this.holeActions).map(([hole, action]) => `${hole}: ${action.toString()}`).join(', ')
    const reassignmentString = Object.entries(this.reassignment).map(([name, func]) => `${name}: ${getBody(func)}`).join(', ')
    return `{${holeActionsString}}(${this.guard.toString()}){${reassignmentString}} | ${this.src} --${this.action.toString()}--> ${this.dst}`
  }

  [inspect.custom](): string {
    return this.toString();
  }

  run({ state, values }: { state: string, values: Dict }) {
    if (state !== this.src) {
      console.error(`Source state must be ${this.src} instead of ${state}`)
      return
    }

    return {
      state: this.dst,
      values: this.reassign(values)
    }
  }
}