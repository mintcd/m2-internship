import { expect } from "chai";
import Predicate from "../../src/core/Predicate.ts";

describe('Create predicate', () => {
  it('Should print True', () => {
    const pred = new Predicate(true);
    expect(pred.toString()).to.equal('True');
    expect(pred.compute({})).to.equal(true)
  });
})


describe('Evaluate predicate', () => {
  const pred = new Predicate({ compute: ({ x, y }) => x > 10 && y > 10 })
  it('Should give vars', () => {
    expect(pred.vars).to.deep.equal(['x', 'y']);
  });

  it('Should return true', () => {
    expect(pred.compute({ x: 11, y: 11 })).to.equal(true);
  });
});
