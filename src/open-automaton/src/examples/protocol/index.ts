import { isDeepEqual } from "../../utils/index.ts"
import { Predicate, Transition, Action, OpenAutomaton } from "../../../src/core/index.ts"
import Config from "../../core/Config.ts"

type DataUnit = { info: number, seq?: number }

const DATA_NUM = 5

export const states = ['q0']

const dataToSend: DataUnit[] = Array.from({ length: DATA_NUM }, (_, i) => ({ info: i }));
const dataOnFly: DataUnit[] = []
const dataReceived: DataUnit[] = []
const dataDone: DataUnit[] = []
const ackOnFly: DataUnit[] = []

export const variables = [
  'dataToSend',
  'dataOnFly',
  'dataReceived',
  'dataDone',
  'ackOnFly'
]

export const startConfig = new Config('q0', {
  dataToSend,
  dataOnFly,
  dataReceived,
  dataDone,
  ackOnFly
})

const sendData = new Transition({
  src: 'q0',
  dst: 'q0',
  action: new Action(function sendData(data) { }),
  holeActions: {
    Sender: new Action(function send(dataToSend, data, opts) { })
  },
  guard: new Predicate({
    compute: ({ dataToSend, data }) => includes(dataToSend, data),
    validValues: ({ dataToSend }) => (dataToSend.length > 0 ? { data: randomElement(dataToSend) } : null)
  }),
  reassignment: {
    dataOnFly: ({ dataOnFly, data, opts }) => [...dataOnFly, { ...data, ...opts }]
  }
})

const receiveAckValid = new Transition({
  src: 'q0',
  dst: 'q0',
  action: new Action(function receiveAck(data) { }),
  holeActions: {
    Sender: new Action(function receiveValid(data) { })
  },
  guard: new Predicate({
    compute: ({ ackOnFly, data }) => includes(ackOnFly, data),
    validValues: ({ ackOnFly }) => (ackOnFly.length > 0 ? { data: randomElement(ackOnFly) } : null)
  }),
  reassignment: {
    ackOnFly: ({ ackOnFly, data }) => remove(ackOnFly, data),
    dataToSend: ({ dataToSend, data }) => remove(dataToSend, data),
    dataDone: ({ dataDone, data }) => [...dataDone, data]
  }
})

const receiveAckInvalid = new Transition({
  src: 'q0',
  dst: 'q0',
  action: new Action(function receiveAck(data) { }),
  holeActions: {
    Sender: new Action(function receiveInvalid(data) { })
  },
  guard: new Predicate({
    compute: ({ ackOnFly, data }) => includes(ackOnFly, data),
    validValues: ({ ackOnFly }) => (ackOnFly.length > 0 ? { data: randomElement(ackOnFly) } : null)
  }),
  reassignment: {
    ackOnFly: ({ ackOnFly, data }) => remove(ackOnFly, data)
  }
})

const process1 = new Transition({
  src: 'q0',
  dst: 'q0',
  action: new Action(),
  holeActions: { Sender: new Action(function process(opts) { }) },
  guard: new Predicate(true),
  reassignment: {}
})

const receiveData = new Transition({
  src: 'q0',
  dst: 'q0',
  action: new Action(function receiveData(data) { }),
  holeActions: {
    Receiver: new Action(function receive(data) { })
  },
  guard: new Predicate({
    compute: ({ data, dataOnFly }) => includes(dataOnFly, data),
    validValues: ({ dataOnFly }) => (dataOnFly.length > 0 ? { data: randomElement(dataOnFly) } : null)
  }),
  reassignment: {
    dataOnFly: ({ dataOnFly, data }) => remove(dataOnFly, data),
    dataReceived: ({ dataReceived, data }) => [...dataReceived, data]
  }
})

const sendAck = new Transition({
  src: 'q0',
  dst: 'q0',
  action: new Action(function sendAck(data) { }),
  holeActions: {
    Receiver: new Action(function send(dataReceived, data, opts) { })
  },
  guard: new Predicate({
    compute: ({ data, dataReceived }) => includes(dataReceived, data),
    validValues: ({ dataReceived }) => (dataReceived.length > 0 ? { data: randomElement(dataReceived) } : null)
  }),
  reassignment: {
    dataReceived: ({ dataReceived, data }) => remove(dataReceived, data),
    ackOnFly: ({ ackOnFly, opts }) => [...ackOnFly, { ...opts }]
  }
})

const process2 = new Transition({
  src: 'q0',
  dst: 'q0',
  action: new Action(),
  holeActions: { Receiver: new Action(function process(opts) { }) },
  guard: new Predicate(true),
  reassignment: {}
}
)
const loseData = new Transition({
  src: 'q0',
  dst: 'q0',
  action: new Action(function loseData(data) { }),
  holeActions: {},
  guard: new Predicate({
    compute: ({ data, dataOnFly }) => dataOnFly.includes(data),
    validValues: ({ dataOnFly }) => (dataOnFly.length > 0 ? { i: randomElement(dataOnFly) } : null)
  }),
  reassignment: {
    dataOnFly: ({ dataOnFly, i }) => remove(dataOnFly, i)
  }
})

const loseAck = new Transition({
  src: 'q0',
  dst: 'q0',
  action: new Action(function loseAck(ack) { }),
  holeActions: {},
  guard: new Predicate({
    compute: ({ ackOnFly, ack }) => includes(ackOnFly, ack),
    validValues: ({ ackOnFly }) => (ackOnFly.length > 0 ? { ack: randomElement(ackOnFly) } : null)
  }),
  reassignment: {
    ackOnFly: ({ ackOnFly, ack }) => remove(ackOnFly, ack)
  }
})

export const transitions = {
  sendData,
  receiveAckValid,
  receiveAckInvalid,

  process1,
  receiveData,
  sendAck,
  process2,
  loseData,
  loseAck
}

export const protocol = new OpenAutomaton({ states, variables, transitions })


function includes(arr: DataUnit[], data: DataUnit) {
  return arr.findIndex(element => isDeepEqual(element, data)) !== -1
}

function remove(arr: DataUnit[], data: DataUnit) {
  const index = arr.findIndex(element => isDeepEqual(element, data))
  if (index === -1) return [...arr];
  return [...arr.slice(0, index), ...arr.slice(index + 1)]
}

function randomElement(arr: DataUnit[]): DataUnit {
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
}