import SessionType from "./SessionType.ts"
import type { Goto, Offer, Primitive, Receive, Select, Send, Tag } from "./SessionType.ts"
import { MessagePort } from "worker_threads"

export default class Channel {
  types: Primitive[]
  port: MessagePort

  current: Primitive

  private access(indices: (number | string)[]) {
    let current = this.types[indices[0]]
    for (let i = 1; i < indices.length; i++) {
      current = current[indices[i]]
    }
    return current
  }

  constructor(st: SessionType, port: MessagePort) {
    this.types = st.sequence
    this.port = port
    this.current = this.types[0]
    while (this.current.name === 'Tag' || this.current.name === 'Goto')
      this.current = (this.current as Tag | Goto).next
  }

  async send(data: unknown): Promise<void> {
    if (this.current.name !== 'Send')
      throw Error(`Cannot Send(${data}), current method is ${this.current.name} `)

    return new Promise<void>((resolve) => {
      this.port.postMessage(data)
      this.current = (this.current as Send).next
      while (this.current.name === 'Tag' || this.current.name === 'Goto')
        this.current = (this.current as Tag | Goto).next
      resolve()
    });
  }

  async receive(): Promise<unknown> {
    if (this.current.name !== 'Receive')
      throw Error(`Cannot Receive, current method is ${this.current.name} `)

    return new Promise((resolve) => {
      this.port.once('message', (message) => {
        this.current = (this.current as Receive).next
        while (this.current.name === 'Tag' || this.current.name === 'Goto')
          this.current = (this.current as Tag | Goto).next
        resolve(message);
      });
    });
  }

  async select(branch: string) {
    if (this.current.name !== 'Select')
      throw Error(`Cannot Select(${branch}), current method is ${this.current.name} `)

    if ((this.current as Select).branches[branch] === undefined) {
      throw Error(`Branch ${branch} does not exist`)
    }

    return new Promise<void>((resolve) => {
      this.port.postMessage(branch)
      this.current = (this.current as Select).branches[branch].sequence[0]
      while (this.current.name === 'Tag' || this.current.name === 'Goto')
        this.current = (this.current as Tag | Goto).next
      resolve();
    });
  }

  async offer(): Promise<string> {
    if (this.current.name !== 'Offer')
      throw Error(`Cannot Offer, current method is ${this.current.name} `)

    return new Promise((resolve) => {
      this.port.once('message', (branch) => {
        this.current = (this.current as Offer).branches[branch].sequence[0]
        while (this.current.name === 'Tag' || this.current.name === 'Goto')
          this.current = (this.current as Tag | Goto).next
        resolve(branch);
      });
    });
  }

  async end() {
    if (this.current.name !== 'End')
      throw Error(`Cannot End, current method is ${this.current.name} `)
  }

}