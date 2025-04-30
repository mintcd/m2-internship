import { protocol, startConfig } from "../../src/examples/protocol/index.ts";

describe('Run', () => {
  const validStep = protocol.getValidStep(startConfig)

  it('Should return configs and steps', () => {
    const { configs, steps } = protocol.run({ startConfig, maxStep: 10, log: false })
  });
});