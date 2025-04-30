import Transition from "./Transition.ts";
import Action from "./Action.ts";
import Config from "./Config.ts";
import { isDeepEqual, randomElement, validDict } from "../utils/index.ts";
import Step from "./Step.ts";
import type { Dict } from "../../@types/index.ts";
import Predicate from "./Predicate.ts";

type RunOptions = {
  startConfig: Config,
  endConfig?: Config,
  maxStep?: number,
  excludes?: string[],
  log?: boolean
}

export default class OpenAutomaton {
  transitions: Dict<Transition>;
  states: Array<string>
  variables: string[]
  holes: Dict<Action[]>

  constructor({ states, variables, transitions = {} }: {
    states: string[],
    variables: string[],
    transitions?: Dict<Transition>
  }) {
    this.states = states
    this.variables = variables
    this.transitions = transitions

    this.holes = {}
    Object.values(transitions).forEach(transition => {
      Object.entries(transition.holeActions).forEach(([hole, action]) => {
        if (!this.holes[hole]) this.holes[hole] = [action]
        else this.holes[hole].push(action)
      })
    })
  }

  summary() {
    const statesString = "States: " + this.states.join(", ")
    const variablesString = "Variables: " + this.variables.join(", ")
    const transitionsString = "Transitions:\n\n" + Object.entries(this.transitions).map(([key, value]) => {
      return `\t${key}: ${value.toString()}`
    }).join("\n\n")
    return `${statesString}\n${variablesString}\n${transitionsString}`
  }

  run({ startConfig, endConfig = null, excludes = [], log = false, maxStep = -1 }: RunOptions): { configs: Config[], steps: Step[] } {
    const configs: Config[] = [startConfig]
    const steps: Step[] = []

    let step = 0
    let config: Config = startConfig


    while (step !== maxStep && !configsEqual(configs[configs.length - 1], endConfig)) {
      const validStep = this.getValidStep(config, { excludes })

      if (validStep === null) {
        console.log("No valid step found")
        break
      }

      config = this.runStep(config, validStep, { log: log })
      if (log) console.log("\n")
      configs.push(config)
      steps.push(validStep)

      step++
    }

    log && console.log(config)

    return { configs, steps }
  }

  getValidStep(config: Config,
    options: { transKey?: string, excludes?: string[] } = { transKey: null, excludes: [] }): Step | null {
    const { transKey, excludes } = options

    if (transKey) {
      const transition = this.transitions[transKey]
      const holeValues = transition.guard.validValues(config.values)
      return holeValues === null ? null : new Step(transition, holeValues)
    }

    const validTransitionKeys = Object.keys(this.transitions).filter(key => {
      const transition = this.transitions[key]

      const srcMatched = transition.src === config.state
      if (!srcMatched) return false

      const notExcluded = !excludes.includes(key)
      if (!notExcluded) return false

      const valuesValid = transition.guard.validValues(config.values)

      if (valuesValid === null) return false

      return true
    })

    if (validTransitionKeys.length === 0) return null

    const transition = this.transitions[randomElement(validTransitionKeys)]
    const holeValues = transition.guard.validValues(config.values)

    return new Step(transition, holeValues)
  }

  runStep(
    config: Config,
    step: Step,
    options: { log?: boolean } = { log: false }): Config {

    const { transition, holeValues } = step
    const { values } = config
    const newState = step.transition.dst

    if (options.log) {
      console.log(config)
      console.log(step)
    }

    const newValues = { ...values, ...transition.reassign({ ...values, ...holeValues }) }

    const nextConfig = new Config(newState, newValues)
    return nextConfig
  }

  compose(other: OpenAutomaton, holeName: string): OpenAutomaton {

    if (this.holes[holeName] === undefined) throw new Error(`Hole ${holeName} not found`)

    const states = cartesian(this.states, other.states)
    const variables = Array.from(new Set([...this.variables, ...other.variables]))
    const transitions: Dict<Transition> = {}

    for (const [key, transition] of Object.entries(this.transitions)) {
      const holeAction = transition.holeActions[holeName]
      if (holeAction) {
        const { [holeName]: _, ...rest } = transition.holeActions
        for (const [otherKey, otherTransition] of Object.entries(other.transitions)) {
          // console.log(146, otherTransition.action.name, holeAction.name)
          if (otherTransition.action.name === holeAction.name) {
            const holeActions = { ...rest, ...otherTransition.holeActions }
            const guard = Predicate.and(transition.guard, otherTransition.guard)
            const reassignment = { ...transition.reassignment, ...otherTransition.reassignment }
            const src = mergeName(transition.src, otherTransition.src)
            const dst = mergeName(transition.dst, otherTransition.dst)
            const action = transition.action

            const newTransition = new Transition({ src, dst, action, holeActions, guard, reassignment })
            const newKey = mergeName(key, otherKey)
            transitions[newKey] = newTransition
          }
        }
      } else {
        other.states.forEach((otherState, index) => {
          const newKey = `${key}${index}`
          transitions[newKey] = new Transition({
            src: mergeName(transition.src, otherState),
            dst: mergeName(transition.dst, otherState),
            action: transition.action,
            holeActions: transition.holeActions,
            guard: transition.guard,
            reassignment: transition.reassignment,
          })
        })
      }
    }

    return new OpenAutomaton({ states, variables, transitions })
  }
}

function configsEqual(a: Config, b: Config): boolean {
  if (!a || !b) return false
  return a.state === b.state && isDeepEqual(a.values, b.values);
}

export function cartesian(arr1: string[], arr2: string[]) {
  const result = [];
  for (let i = 0; i < arr1.length; i++) {
    for (let j = 0; j < arr2.length; j++) {
      result.push(mergeName(arr1[i], arr2[j]));
    }
  }
  return result;
}

export function mergeName(state1: string, state2: string) {
  return `${state1}-${state2}`
}
