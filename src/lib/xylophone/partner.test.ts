import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { partnerTag, slugTagInput } from "./partner";

describe("slugTagInput", () => {
  it("strips accents and turns spaces into dashes", () => {
    assert.equal(slugTagInput("Napsugár Óvoda"), "napsugar-ovoda");
    assert.equal(slugTagInput("Kőrösi Tündérkert"), "korosi-tunderkert");
    assert.equal(partnerTag(slugTagInput("Napsugár Óvoda")), "napsugar-ovoda");
  });
  it("caps length at 32", () => {
    assert.equal(slugTagInput("a".repeat(40)).length, 32);
  });
});
