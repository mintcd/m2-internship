import { isDeepEqual } from "../../utils/index.ts";
import { Predicate, OpenAutomaton, Transition, Action } from "../../core/index.ts";

export const sender = new OpenAutomaton({
  states: ['s0', 's1'],
  variables: ['s_seq', 's_ack', 'sent'],
  transitions: {
    send: new Transition({
      src: 's0',
      dst: 's1',
      action: new Action(function send(dataToSend, data, opts) { }),
      guard: new Predicate({
        compute: ({ dataToSend, data }) => isDeepEqual(dataToSend[0], data),
        validValues: ({ dataToSend, s_seq, s_ack }) => ({ data: dataToSend[0], opts: { seq: s_seq, ack: s_ack } })
      }),
      reassignment: {
        sent: ({ data }) => data
      }
    }),
    receiveValid: new Transition({
      src: 's1',
      dst: 's0',
      action: new Action(function receiveValid(data) { }),
      guard: new Predicate({
        compute: ({ data, s_seq, s_ack }) => data.seq === s_seq && data.ack === s_ack,
      }),
      reassignment: {
        s_seq: ({ s_seq }) => 1 - s_seq,
        s_ack: ({ s_ack }) => 1 - s_ack
      }
    }),
    receiveInvalid: new Transition({
      src: 's1',
      dst: 's0',
      action: new Action(function receiveInvalid(data) { }),
      guard: new Predicate({
        compute: ({ data, s_seq, s_ack }) => !data.seq === s_seq || !data.ack === s_ack,
      })
    })
  }
})

export const receiver = new OpenAutomaton({
  states: ['r0'],
  variables: ['r_seq', 'r_ack', 'received'],
  transitions: {
    receive: new Transition({
      src: 'r0',
      dst: 'r0',
      action: new Action(function receive(data) { }),
      reassignment: {
        received: ({ data }) => data
      }
    }),
    send: new Transition({
      src: 'r0',
      dst: 'r0',
      action: new Action(function send(data) { }),
      guard: new Predicate({
        compute: ({ data, r_seq, r_ack, received }) => isDeepEqual(data, received) && data.seq === r_seq && data.ack === r_ack,
        validValues: ({ received, r_seq, r_ack }) => ({ data: received, opts: { seq: r_seq, ack: r_ack } })
      }),
      reassignment: {
        r_seq: ({ r_seq }) => 1 - r_seq,
        r_ack: ({ r_ack }) => 1 - r_ack
      }
    })
  }
})
