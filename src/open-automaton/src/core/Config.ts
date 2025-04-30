import type { Dict } from "../../@types/index.ts"
import { inspect } from 'util';

export default class Config {
  state: string
  values: Dict

  constructor(state: string, values: Dict) {
    this.state = state
    this.values = values
  }

  toString() {
    const valuesString = Object.entries(this.values)
      .map(([key, value]) => `\t${key}: ${JSON.stringify(value)}`)
      .join('\n');

    return `(${this.state}, {\n${valuesString} \n})`;
  }

  [inspect.custom](): string {
    return this.toString();
  }
}