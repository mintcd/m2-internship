import { inspect } from "util";
import type { Dict } from "../../@types/index.ts";
import { getBody } from "../utils/index.ts";
import Transition from "./Transition.ts";

export default class Step {
  transition: Transition
  holeValues: Dict

  constructor(transition: Transition, holeValues: Dict) {
    this.transition = transition
    this.holeValues = holeValues
  }

  toString() {
    const { transition, holeValues } = this
    const { holeActions, action, guard, src, dst } = transition

    const holeActionsString = Object
      .entries(holeActions)
      .map(([hole, action]) => {
        return `${hole}: ${action.name}(${Object.keys(action.vars)
          .map((varName) => holeValues[varName] ? `${varName}:${JSON.stringify(holeValues[varName])}` : '')
          .filter(str => str !== '')
          .join(', ')})`
      })
      .join(', ');

    const reassignmentString = Object.entries(transition.reassignment).map(([name, func]) => `${name}: ${getBody(func)}`).join(', ')

    return `{${holeActionsString}}(${guard.toString()}){${reassignmentString}}\n${src} --------------------------------------- ${action.name}(${Object.keys(action.vars)
      .map((varName) => `${varName}:${JSON.stringify(holeValues[varName])}`)
      .join(', ')}) -------------------------------------------------> ${dst}`

  }

  [inspect.custom](): string {
    return this.toString();
  }
}