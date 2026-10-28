import test from "node:test";
import assert from "node:assert/strict";
import {
  blankState,
  makeOpportunity,
  parseState,
  portfolio,
  rank,
  researchPacket,
  netCash,
} from "../src/domain.mjs";
test("unknown scores are not silently zeros; speculation is retained", () => {
  const o = makeOpportunity("Test", "", { speculative: true });
  assert.equal(rank(o), null);
  assert.equal(o.speculative, true);
});
test("personally inaccessible, future and post-deadline cash excluded; losses counted", () => {
  const s = blankState();
  const o = makeOpportunity("Test");
  s.opportunities.push(o);
  s.settings.baselineAccessible = 100;
  s.cash = [
    {
      id: "a",
      opportunityId: o.id,
      date: "2026-10-29",
      description: "Sale",
      receipts: 1000,
      costs: 200,
      gstReserve: 100,
      companyTaxReserve: 100,
      personalTaxReserve: 100,
      extractionCosts: 50,
      accessible: true,
    },
  ];
  assert.equal(netCash(s.cash[0]), 450);
  s.cash.push(
    { ...s.cash[0], id: "b", accessible: false, receipts: 9999999 },
    { ...s.cash[0], id: "c", date: "2028-01-01" },
    { ...s.cash[0], id: "d", date: "2027-01-01" },
    {
      ...s.cash[0],
      id: "e",
      receipts: 0,
      costs: 100,
      gstReserve: 0,
      companyTaxReserve: 0,
      personalTaxReserve: 0,
      extractionCosts: 0,
    },
  );
  assert.equal(portfolio(s, "2026-10-29").total, 450);
  assert.equal(portfolio(s, "2028-01-01").total, 900);
  assert.equal(portfolio(s, "2028-01-01").requiredMonthly, null);
});
test("import rejects orphan records, duplicate ids, invalid scores and nonfinite money", () => {
  const s = blankState();
  const o = makeOpportunity("Test");
  s.opportunities.push(o);
  assert.doesNotThrow(() => parseState(s));
  s.opportunities.push(o);
  assert.throws(() => parseState(s));
  s.opportunities.pop();
  o.scores.viability = 6;
  assert.throws(() => parseState(s));
  o.scores.viability = "";
  s.settings.target = Infinity;
  assert.throws(() => parseState(s));
});
test("initial packets exclude competing reports, scores and financial baseline", () => {
  const s = blankState();
  const o = makeOpportunity("Test");
  const packet = researchPacket(o, "Creative convergence");
  assert.equal(packet.opportunity.scores, undefined);
  assert.equal(packet.reports, undefined);
  assert.equal(packet.settings, undefined);
  assert.match(packet.instructions, /untrusted/);
  assert.notEqual(
    packet.packetId,
    researchPacket(o, "Creative convergence").packetId,
  );
});
test("round-trip retains losses and dissent; script text remains ordinary data", () => {
  const s = blankState();
  const o = makeOpportunity("<script>example</script>");
  s.opportunities.push(o);
  s.reports.push({
    id: "r",
    opportunityId: o.id,
    role: "Adversarial falsification",
    researcher: "Human",
    model: "Human",
    isolation: "Fresh context",
    thesis: "Unproven",
    sources: "",
    assumptions: "Demand unknown",
    uncertainty: "High",
    dissent: "Do not launch yet",
    falsifier: "No paid demand",
    submittedOn: "2026-10-29",
  });
  assert.deepEqual(parseState(JSON.parse(JSON.stringify(s))), s);
});
