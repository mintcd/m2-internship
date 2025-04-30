import { protocol, startConfig } from "./examples/protocol/index.ts";
import * as fs from "fs";


const { configs, steps } = protocol.run({ startConfig, maxStep: 10, excludes: ['process1', 'process2'] });

let log = configs[0].toString() + "\n\n"

steps.forEach((step, i) => {
  log += step.toString() + "\n\n\n"
  log += configs[i + 1].toString() + "\n\n"
})

fs.writeFileSync("logs/run.log", log, "utf-8");

console.log("Results written");
