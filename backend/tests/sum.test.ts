import { sum } from "./sum.js";

describe("sum module", () => {
  test("adds 1 and 2 to equal 3", () => {
    expect(sum(1, 2)).toBe(3);
  });
});
