import { protocol, startConfig } from "../src/examples/protocol/index.ts";
import * as fs from "fs"

fs.writeFileSync("logs/protocol.log", protocol.summary(), "utf-8");

const { configs, steps } = protocol.run({ startConfig, maxStep: 10, excludes: ['process1', 'process2'] });

let log = configs[0].toString() + "\n\n"

steps.forEach((step, i) => {
  log += step.toString() + "\n\n\n"
  log += configs[i + 1].toString() + "\n\n"
})

fs.writeFileSync("logs/protocol-run.log", log, "utf-8");

console.log("Results written");
