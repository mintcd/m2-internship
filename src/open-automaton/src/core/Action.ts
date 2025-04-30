import Term from "./Term.ts";

export default class Action extends Term {

  constructor();
  constructor(init: { name: string; vars: string[] });
  constructor(init: (...vars: any[]) => void);


  constructor(init?: { name: string; vars: string[] } | ((...vars: any[]) => void) | null) {
    super(init);
  }
}