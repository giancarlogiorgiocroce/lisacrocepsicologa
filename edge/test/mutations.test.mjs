import assert from "node:assert/strict";
import test from "node:test";
import { buildTextMutation } from "../src/mutations.mjs";

const data = {
  title: "Titolo",
  items: [
    { title: "Uno", text: "Primo" },
    { title: "Due", text: "Secondo" }
  ]
};

test("update_text modifica soltanto un path concreto dichiarato dal contratto", () => {
  const result = buildTextMutation(data, "home.audiences", "items[1].text", "Testo aggiornato");
  assert.equal(result.after.items[1].text, "Testo aggiornato");
  assert.equal(result.before.items[1].text, "Secondo");
  assert.equal(data.items[1].text, "Secondo");
});

test("update_text rifiuta campi non contrattualizzati o assegnati ad altri tool", () => {
  assert.throws(
    () => buildTextMutation({ image: { src: "x" } }, "home.hero", "image.src", "javascript:alert(1)"),
    /non è modificabile/
  );
  assert.throws(
    () => buildTextMutation({ channels: [{ value: "x" }] }, "home.contact", "channels[0].value", "y"),
    /update_contact_channel/
  );
});

test("update_text rifiuta HTML, path pericolosi, indici assenti e limiti superati", () => {
  assert.throws(() => buildTextMutation(data, "home.audiences", "title", "<b>Titolo</b>"), /HTML/);
  assert.throws(() => buildTextMutation(data, "home.audiences", "__proto__.polluted", "sì"), /path/i);
  assert.throws(() => buildTextMutation(data, "home.audiences", "items[8].text", "x"), /non esiste/);
  assert.throws(() => buildTextMutation(data, "home.audiences", "items[0].title", "x".repeat(81)), /80/);
});
