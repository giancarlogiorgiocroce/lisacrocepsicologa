import assert from "node:assert/strict";
import { test } from "node:test";
import { contractFor, SECTION_PRESETS } from "../src/contracts.mjs";

const expectedContracts = [
  "home.hero",
  "home.about",
  "home.approach_steps",
  "home.services",
  "home.audiences",
  "home.contact"
];

test("tutti i blocchi della one-page hanno un contratto", () => {
  for (const id of expectedContracts) {
    const contract = contractFor(id);
    assert.ok(contract, `contratto mancante: ${id}`);
    assert.ok(contract.editableFields.length > 0);
  }
});

test("i preset iniziali sono sicuri e non aggiungibili", () => {
  assert.equal(SECTION_PRESETS.length, expectedContracts.length);
  for (const preset of SECTION_PRESETS) {
    assert.equal(preset.addable, false);
    assert.equal(preset.allowsHtml, false);
  }
});
