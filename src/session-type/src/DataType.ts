import { inspect } from "util"

export class DataType<T = any> {
  name: string
  data: T
  constructor({ data, name }: { data: T, name?: string }) {
    this.name = name
    this.data = data
  }

  toString(options?: any) {
    return this.name ?? JSON.stringify(this.data)
  }

  [inspect.custom](): string {
    return this.toString();
  }
}

export const int = new DataType({ data: 'int' })