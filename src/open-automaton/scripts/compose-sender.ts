import { protocol, startConfig } from "../src/examples/protocol/index.ts";
import { sender } from "../src/examples/protocol/stop-and-wait.ts";
import * as fs from "fs"
import Config from "../src/core/Config.ts";

const composed = protocol.compose(sender, 'Sender')

fs.writeFileSync("logs/protocol[Sender_sender].log", composed.summary(), "utf-8");
console.log("Results written");

const { configs, steps } = composed.run({
  startConfig: new Config('q0-s0', {
    ...startConfig.values,
    s_seq: 0,
    s_ack: 1,
  }),
  maxStep: 10,
  log: false
})

let log = configs[0].toString() + "\n\n"

steps.forEach((step, i) => {
  log += step.toString() + "\n\n\n"
  log += configs[i + 1].toString() + "\n\n"
})

fs.writeFileSync("logs/protocol[Sender_sender]-run.log", log, "utf-8");

console.log("Results written");


