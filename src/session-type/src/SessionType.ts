import { DataType } from "./DataType.ts";

export type Primitive = Tag | Goto | Send | Receive | Select | Offer | End
type StringOptions = {
  indent?: number
  level?: number
  next?: boolean
}

type Recursion = Tag | Goto
type Sequential = Tag | Send | Receive
type Branching = Select | Offer


export default class SessionType {
  sequence: (Recursion | Primitive)[]
  tagDict: { [label: string]: Tag }

  private buildGraph: boolean

  constructor(sequence?: (Recursion | Primitive)[], tagDict?: { [label: string]: Tag }, buildGraph?: boolean);

  constructor(sequence: (Recursion | Primitive)[] = [],
    tagDict: { [label: string]: Tag } = {},
    buildGraph: boolean = false
  ) {
    this.tagDict = tagDict
    this.sequence = []
    this.buildGraph = buildGraph

    if (!Array.isArray(sequence)) {
      throw new Error('Sequence must be an array');
    }

    for (const type of sequence) {
      switch (type.name) {
        case 'Tag':
          const tag = new Tag((type as Tag).key)
          if (buildGraph) this.tagDict[tag.key] = tag
          this.pushType(tag)
          continue
        case 'Goto':
          const goto = new Goto((type as Goto).key)
          if (buildGraph && this.tagDict[goto.key] === undefined)
            throw Error(`Tag ${goto.key} does not exist to go`)
          if (buildGraph) goto.next = this.tagDict[goto.key]
          this.pushType(goto)
          continue
        case 'Send':
          const send = new Send((type as Send).type)
          this.pushType(send)
          continue
        case 'Receive':
          const receive = new Receive((type as Receive).type)
          this.pushType(receive)
          continue
        case 'Select':
          const select = new Select((type as Select).branches, this.tagDict, buildGraph)

          const selectMergedDict = Object.values(select.branches).reduce((acc, branch) => {
            return Object.assign(acc, branch.tagDict);
          }, {});

          Object.assign(this.tagDict, selectMergedDict);

          this.pushType(select)
          continue
        case 'Offer':
          const offer = new Offer((type as Offer).branches, this.tagDict, buildGraph)

          const offerMergedDict = Object.values(offer.branches).reduce((acc, branch) => {
            return Object.assign(acc, branch.tagDict);
          }, {});

          Object.assign(this.tagDict, offerMergedDict);

          this.pushType(offer)
          continue
        case 'End':
          const end = new End()
          this.pushType(end)
          continue
        default:
          throw new Error(`Unknown type: ${type.name}`);
      }
    }
  }

  private pushType(type: Primitive) {
    if (this.sequence.length === 0) {
      this.sequence.push(type)
      return
    }

    const last = this.sequence[this.sequence.length - 1]
    if (!('next' in last))
      throw Error(`Cannot push to sequence ended by ${last}`)
    if (this.buildGraph) last.next = type
    this.sequence.push(type);
  }

  end() {
    const end = new End();
    this.pushType(end)
    return this
  }

  tag(key: string) {
    const tag = new Tag(key);
    this.pushType(tag)
    return this
  }

  goto(key: string) {
    const goto = new Goto(key);
    this.pushType(goto)
    return this
  }

  send(type: DataType) {
    const send = new Send(type);
    this.pushType(send)
    return this
  }

  receive(type: DataType) {
    const receive = new Receive(type);
    this.pushType(receive)
    return this
  }

  select(branches: { [label: string]: SessionType }) {
    const select = new Select(branches);
    this.pushType(select)
    return this
  }

  offer(branches: { [label: string]: SessionType }) {
    const offer = new Offer(branches);
    this.pushType(offer)
    return this
  }

  dual() {
    return new SessionType(this.sequence
      .map(type => type.dual()), this.tagDict)
  }

  toString(opts: StringOptions = {}) {
    const { indent = 0, level = 0, next = false } = opts;
    return this.sequence.map(type => type.toString({ indent, level: level + 1, next })).join('.');
  }
}

export class Tag {
  name = 'Tag'
  key: string
  next: Primitive | null = null

  constructor(key: string) {
    this.key = key
  }

  toString(opts: StringOptions = {}) {
    const { next = false } = opts
    return `μ${this.key}` + ((next && this.next) ? `:${this.next.name}` : '')
  }

  dual() {
    return this
  }
}

export class Goto {
  name = 'Goto'
  key: string
  next: Primitive | null = null

  constructor(key: string) {
    this.key = key
  }

  toString(opts: StringOptions = {}) {
    const { next = false } = opts
    return `${this.key}` + ((next && this.next) ? `:${this.next.name}` : '')
  }

  dual() {
    return this
  }
}

export class Send {
  name = 'Send'
  type: DataType
  next: Primitive | null = null

  constructor(type: DataType) {
    this.type = type.constructor.name === 'DataType' ? type : new DataType(type)
  }
  dual() {
    return new Receive(this.type)
  }

  toString(opts: StringOptions = {}) {
    const { next = false } = opts
    return `!${this.type.toString()}` + ((next && this.next) ? `:${this.next.name}` : '')
  }
}

export class Receive {
  name = 'Receive'
  type: DataType
  next: Primitive | null = null

  constructor(type: DataType) {
    this.type = type.constructor.name === 'DataType' ? type : new DataType(type)
  }
  dual() {
    return new Send(this.type)
  }

  toString(opts: StringOptions = {}) {
    const { next = false } = opts
    if (!this.next) console.log(225, this.name, this.type.toString())
    return `?${this.type.toString()}` + ((next && this.next) ? `:${this.next.name}` : '')
  }
}

export class Select {
  name = 'Select'
  branches: { [label: string]: SessionType }

  constructor(branches: { [label: string]: SessionType }, tagDict: { [label: string]: Tag } = {}, buildGraph: boolean = false) {
    this.branches = {}
    for (const [key, type] of Object.entries(branches)) {
      this.branches[key] = type.constructor.name === 'SessionType'
        ? type
        : new SessionType(type.sequence, tagDict, buildGraph)
    }
  }

  dual() {
    return new Offer(
      Object.fromEntries(
        Object.entries(this.branches).map(
          ([label, session]) => [label, session.dual()]
        )
      )
    )
  }

  toString(opts: StringOptions = {}) {
    const { indent = 0, level = 0, next = false } = opts;
    return indent === 0
      ? `⊕{${Object.entries(this.branches).map(([key, type]) => `${key}:${type.toString({ indent, level, next })}`).join(', ')}}`
      : `⊕{\n${Object.entries(this.branches).map(([key, type]) => "  ".repeat(indent * level) + `${key}:${type.toString({ indent, level: level + 1, next })}`).join(',\n')}\n}`
  }
}

export class Offer {
  name = 'Offer'
  branches: { [label: string]: SessionType }

  constructor(branches: { [label: string]: SessionType }, tagDict: { [label: string]: Tag } = {}, buildGraph: boolean = false) {
    this.branches = {}
    for (const [key, type] of Object.entries(branches)) {
      this.branches[key] = type.constructor.name === 'SessionType'
        ? type
        : new SessionType(type.sequence, tagDict, buildGraph)
    }
  }

  dual() {
    return new Select(
      Object.fromEntries(
        Object.entries(this.branches).map(
          ([label, session]) => [label, session.dual()]
        )
      )
    )
  }

  toString(opts: StringOptions = {}) {
    const { indent = 0, level = 0, next = false } = opts;
    return indent === 0
      ? `&{${Object.entries(this.branches).map(([key, type]) => `${key}:${type.toString({ indent, level, next })}`).join(', ')}}`
      : `&{\n${Object.entries(this.branches).map(([key, type]) => "  ".repeat(indent * level) + `${key}:${type.toString({ indent, level: level + 1, next })}`).join(',\n')}\n}`
  }
}

export class End {
  name = 'End'

  dual() {
    return this
  }

  toString(opts: StringOptions = {}) {
    return 'end'
  }
}

export function end() {
  return new SessionType([new End()])
}

export function tag(key: string) {
  const tag = new Tag(key);
  return new SessionType([tag], { [key]: tag })
}

export function goto(key: string) {
  return new SessionType([new Goto(key)])
}

export function send(type: DataType) {
  return new SessionType([new Send(type)])
}

export function receive(type: DataType) {
  return new SessionType([new Receive(type)])
}

export function select(branches: { [label: string]: SessionType }) {
  return new SessionType([new Select(branches)])
}

export function offer(branches: { [label: string]: SessionType }) {
  return new SessionType([new Offer(branches)])
}