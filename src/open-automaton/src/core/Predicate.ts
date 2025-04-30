import { getParamNames, getBody } from "../utils/index.ts";
import { inspect } from 'util';
import type { Dict } from "../../@types/index.ts";

export default class Predicate {
  name: string;
  vars: string[];
  internalVars: string[];
  externalVars: string[];
  validValues: (externalVars: Dict) => (Dict | null);
  compute: (values: Dict) => boolean;

  constructor(params: {
    compute: (vars: Dict) => boolean,
    validValues?: (vars: Dict) => (Dict | null),
    vars?: string[],
    externalVars?: string[]
  })

  constructor(params: true);
  constructor(params: false);

  constructor(params: {
    compute: (vars: Dict) => boolean,
    validValues?: (vars: Dict) => (Dict | null),
    vars?: string[],
    externalVars?: string[]
  } | true | false) {
    if (params === true) {
      this.name = 'True'
      this.vars = []
      this.compute = (values: Dict) => true;
      this.validValues = () => ({});
      this.internalVars = [];
      this.externalVars = [];
      return;
    }

    if (params === false) {
      this.name = 'False'
      this.vars = []
      this.compute = (values: Dict) => true;
      this.validValues = () => null;
      this.internalVars = [];
      this.externalVars = [];
      return;
    }

    const { compute, validValues = (vars: Dict) => ({}), vars, externalVars } = params;

    this.name = params.compute.name || ''
    this.vars = vars ?? getParamNames(compute)
    this.compute = params.compute;
    this.validValues = validValues

    this.externalVars = externalVars ?? getParamNames(params.validValues ?? (() => { }));
    this.internalVars = this.vars.filter((varName) => !this.externalVars.includes(varName));
  }

  toString(): string {
    if (this.name === 'True') return 'True';
    if (this.name === 'False') return 'False';

    return `${getBody(this.compute)}`

  }


  static and(p1: Predicate, p2: Predicate): Predicate {
    const vars = Array.from(new Set([...p1.vars, ...p2.vars]));
    const externalVars = Array.from(new Set([...p1.externalVars, ...p2.externalVars]));

    const compute = (values: Dict) => {
      for (const varName of vars) {
        if (!(varName in values)) {
          throw new Error(`Variable ${varName} not found in values`);
        }
      }
      return p1.compute(values) && p2.compute(values);
    };

    const validValues = (values: Dict): Dict => {
      const valid1 = p1.validValues(values);
      const valid2 = p2.validValues(values);
      if (valid1 === null || valid2 === null) return null
      const merged = { ...valid1, ...valid2 };
      return merged;
    };

    const andPredicate = new Predicate({ compute, validValues, vars, externalVars });
    andPredicate.toString = () => `(${p1.toString()}) && (${p2.toString()})`;
    return andPredicate;
  }

}
