import { expect } from "chai";
import Predicate from "../../src/core/Predicate.ts";

describe('And predicates', () => {
  it('Should return combined variables', () => {
    const pred1 = new Predicate({ compute: ({ x }) => x > 11, validValues: () => ({ x: 12 }) });
    const pred2 = new Predicate({ compute: ({ y }) => y > 10, validValues: () => ({ y: 11 }) });

    const pred = Predicate.and(pred1, pred2)
    expect(pred.vars).to.deep.equal(['x', 'y'])
    expect(pred.validValues({})).to.deep.equal({ x: 12, y: 11 })
  });

  it('Valid values should be null', () => {
    const pred1 = new Predicate(true)
    const pred2 = new Predicate(false)

    const pred = Predicate.and(pred1, pred2)
    expect(pred.validValues({})).to.equal(null)
  })
})
