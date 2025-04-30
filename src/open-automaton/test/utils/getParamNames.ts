import { expect } from "chai";
import { getParamNames } from "../../src/utils/index.ts";

describe("Get param names", () => {
  it("Should get param names", () => {
    const func = ({ x, y }) => true
    expect(getParamNames(func)).to.deep.equal(['x', 'y']);
  })
})