import { expect } from "chai";
import { protocol, startConfig } from "../../src/examples/protocol/index.ts";

describe('Run random step', () => {
  const validStep = protocol.getValidStep(startConfig)
  const nextConfig = protocol.runStep(startConfig, validStep, { log: true })

  it('Should return next a valid step', () => {
    // console.log(validStep);
    expect(validStep).to.not.be.null;
  });


  it('Should return next configure', () => {
    // console.log(nextConfig)
  })
});

describe('Run defined step', () => {
  it('Should return right config', () => {
    // console.log(startConfig)

    let validStep = protocol.getValidStep(startConfig, { transKey: 'sendData' })
    // console.log(validStep)

    let nextConfig = protocol.runStep(startConfig, validStep)
    // console.log(nextConfig)

    validStep = protocol.getValidStep(nextConfig, { transKey: 'receiveData' })
    // console.log(validStep)

    nextConfig = protocol.runStep(nextConfig, validStep)
    // console.log(nextConfig)
  });
});