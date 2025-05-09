import { tag, send, receive, goto, end } from "../../src/SessionType.ts"
import { expect } from "chai"
import { DataType, int } from "../../src/DataType.ts"

const Frame = new DataType({ header: int, data: int }, 'Frame')
const Ack = new DataType({ header: int }, 'Ack')

describe("Create session type", () => {
  const server = tag('S').send(Frame).offer({
    ack: receive(Ack).select({
      continue: goto('S'),
      end: end()
    }),
    unack: goto('S')
  })


  it('Should log correct type', () => {
    console.log(server.toString(1))
    console.log(server.dual().toString(1))
  })
}) 