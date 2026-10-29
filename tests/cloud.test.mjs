import test from "node:test";
import assert from "node:assert/strict";
import { createCloudClient } from "../src/cloud.mjs";
import { blankState } from "../src/domain.mjs";
const session = { token: "test-session", userId: "owner-id" };
const base = { url: "https://example.supabase.co", key: "sb_publishable_test" };
const reply = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
test("rejects secret keys and insecure URLs before making requests", async () => {
  let calls = 0;
  const request = async () => {
    calls++;
    return reply([]);
  };
  for (const config of [
    { ...base, key: "sb_secret_test" },
    { ...base, url: "http://example.supabase.co" },
    { ...base, key: "eyJ.test.invalid" },
  ])
    await assert.rejects(
      createCloudClient({ ...config, request }).load(session),
    );
  const encoded = btoa(JSON.stringify({ role: "service_role" }));
  await assert.rejects(
    createCloudClient({ ...base, key: `eyJ.${encoded}.test`, request }).load(
      session,
    ),
    /service-role/,
  );
  assert.equal(calls, 0);
});
test("authenticated reads select foundry with an owner filter and validate cloud data", async () => {
  const client = createCloudClient({
    ...base,
    request: async (url, init) => {
      assert.match(url, /owner_id=eq.owner-id/);
      assert.equal(init.headers["Accept-Profile"], "foundry");
      assert.equal(init.headers.Authorization, "Bearer test-session");
      return reply([{ state: blankState(), revision: 2 }]);
    },
  });
  assert.equal((await client.load(session)).revision, 2);
  await assert.rejects(
    createCloudClient({
      ...base,
      request: async () => reply([{ state: {}, revision: 1 }]),
    }).load(session),
  );
});
test("zero-row conflict is an error; save never silently overwrites a stale revision", async () => {
  const client = createCloudClient({
    ...base,
    request: async (url, init) => {
      assert.match(url, /revision=eq.2/);
      assert.equal(init.method, "PATCH");
      assert.equal(JSON.parse(init.body).revision, 3);
      return reply([]);
    },
  });
  await assert.rejects(
    client.save(session, blankState(), 2),
    /another session/,
  );
  await assert.rejects(
    client.save(session, blankState(), undefined),
    /Load cloud/,
  );
});
test("initial save is an INSERT and first revision; missing cloud is not replacement data", async () => {
  const client = createCloudClient({
    ...base,
    request: async (url, init) => {
      if (init.method === "POST") {
        assert.equal(JSON.parse(init.body).owner_id, session.userId);
        assert.equal(JSON.parse(init.body).revision, 1);
        return reply([{ revision: 1 }]);
      }
      return reply([]);
    },
  });
  assert.equal(await client.load(session), null);
  assert.equal(await client.save(session, blankState(), null), 1);
});
test("schema and permission failures are actionable without leaking raw responses", async () => {
  for (const [code, status, expected] of [
    ["PGRST106", 406, /not exposed/],
    ["42501", 403, /access denied/],
    ["PGRST301", 401, /Sign in again/],
  ]) {
    const client = createCloudClient({
      ...base,
      request: async () =>
        reply({ code, message: "private server data" }, status),
    });
    await assert.rejects(client.load(session), expected);
  }
});
