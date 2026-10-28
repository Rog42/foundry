import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  blankState,
  demoState,
  dimensions,
  stages,
  roles,
  uid,
  today,
  makeOpportunity,
  parseState,
  portfolio,
  rank,
  netCash,
  researchPacket,
} from "./domain.mjs";
import {
  loadLocal,
  saveLocal,
  download,
  readFile,
  cloudConfigured,
  signIn,
  cloudLoad,
  cloudSave,
} from "./storage.mjs";
import "./style.css";
const money = (n) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(n);
const label = (s) =>
  s.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
function Field({
  name,
  kind = "text",
  options,
  required = false,
  defaultValue,
  ...rest
}) {
  return (
    <label className="field">
      {label(name)}
      {options ? (
        <select
          aria-label={label(name)}
          name={name}
          defaultValue={defaultValue}
          {...rest}
        >
          {options.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      ) : kind === "textarea" ? (
        <textarea
          aria-label={label(name)}
          name={name}
          required={required}
          defaultValue={defaultValue}
          {...rest}
        />
      ) : (
        <input
          aria-label={label(name)}
          name={name}
          type={kind}
          required={required}
          defaultValue={defaultValue}
          {...rest}
        />
      )}
    </label>
  );
}
function Form({ children, onSave, button = "Save record" }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        try {
          const d = Object.fromEntries(new FormData(e.currentTarget));
          onSave(d);
          e.currentTarget.reset();
        } catch (err) {
          alert(err.message);
        }
      }}
    >
      <div className="form-grid">{children}</div>
      <button className="primary">{button}</button>
    </form>
  );
}
function App() {
  const [initial] = useState(() => {
    try {
      return { data: loadLocal() ?? blankState(), error: "" };
    } catch (e) {
      return {
        data: blankState(),
        error:
          "Stored workspace could not be read. Original storage is preserved. Use the recovery download before importing or loading demo data. " +
          e.message,
      };
    }
  });
  const [error, setError] = useState(initial.error);
  const [storageHealthy, setStorageHealthy] = useState(!initial.error);
  const [state, setState] = useState(initial.data);
  const [tab, setTab] = useState("Portfolio");
  const [selected, setSelected] = useState("");
  const [filter, setFilter] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [session, setSession] = useState(null);
  const [revision, setRevision] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!storageHealthy) return;
    try {
      saveLocal(state);
    } catch (e) {
      setError("Local save failed. Export your workspace now. " + e.message);
    }
  }, [state, storageHealthy]);
  const update = (fn) => {
    if (!storageHealthy)
      throw Error(
        "Recover original storage, then explicitly import a workspace before editing.",
      );
    setState(parseState(fn(structuredClone(state))));
    setNotice("Saved in this browser. Cloud sync is manual.");
  };
  const add = (key, row) =>
    update((s) => {
      s[key].push({ id: uid(), ...row });
      return s;
    });
  const active =
    state.opportunities.find((o) => o.id === selected) ??
    state.opportunities[0];
  const stats = portfolio(state);
  const targetId = active?.id;
  const related = (key) =>
    state[key].filter((r) => r.opportunityId === targetId);
  const choose = (e) => {
    setSelected(e.target.value);
    setRevealed(false);
  };
  const cloudAction = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  function saveDecision(d) {
    const linked = related("evidence").map((e) => e.id);
    if (["Launch", "Scale"].includes(d.action) && !linked.length)
      throw Error("Record evidence before a launch or scale decision.");
    update((s) => {
      s.decisions.push({
        id: uid(),
        opportunityId: targetId,
        ...d,
        evidenceIds: linked,
        decidedOn: today(),
      });
      s.opportunities.find((o) => o.id === targetId).stage = d.action;
      return s;
    });
  }
  return (
    <div className="shell">
      <aside>
        <a className="brand" href="#" onClick={() => setTab("Portfolio")}>
          <span className="brand-icon">
            N<span>↗</span>
          </span>
          NO KILL SWITCH<small>OPPORTUNITY FOUNDRY</small>
        </a>
        <div className="sidebar-label">PROJECT 60</div>
        <nav>
          {[
            "Portfolio",
            "Opportunities",
            "Evidence",
            "Agent reports",
            "Experiments",
            "Decisions",
            "Cash ledger",
            "Workspace",
          ].map((t, i) => (
            <button
              key={t}
              aria-label={t}
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
            >
              <span>{["◫", "◇", "≡", "◎", "↗", "✓", "$", "⚙"][i]}</span>
              {t}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="live-dot" /> LOCAL WORKSPACE
          <p>
            Private research.
            <br />
            Measurable outcomes.
          </p>
          <small>
            Vice Versa Reality Pty Ltd
            <br />
            trading as No Kill Switch
          </small>
        </div>
      </aside>
      <main>
        <header>
          <div className="crumb">
            FOUNDRY <span>/ {tab.toUpperCase()}</span>
          </div>
          <div className="header-right">
            <span className="pill">29 SEP 2027</span>
            <button
              onClick={() => download("foundry-workspace.private.json", state)}
            >
              Export workspace ↗
            </button>
          </div>
        </header>
        <div className="page">
          <div className="heading">
            <div>
              <p className="eyebrow">DIVERGE. TEST. COMPOUND.</p>
              <h1>
                {tab === "Portfolio"
                  ? "Build possibilities. Prove value."
                  : tab}
              </h1>
              <p className="subtitle">
                {tab === "Portfolio"
                  ? "A portfolio of experiments, measured in accessible after-tax cash."
                  : "Evidence, assumptions and decisions stay connected to the opportunity."}
              </p>
            </div>
            <span className="counter">
              {stats.days}
              <small>DAYS TO DEADLINE</small>
            </span>
          </div>
          {!storageHealthy && (
            <button
              onClick={() =>
                download("foundry-recovery.private.json", {
                  raw: localStorage.getItem("nks-foundry-v1"),
                })
              }
            >
              Download original storage for recovery
            </button>
          )}
          {error && (
            <div className="alert" role="alert">
              {error}
              <button onClick={() => setError("")}>Dismiss</button>
            </div>
          )}
          {notice && (
            <div className="notice" role="status">
              {notice}
            </div>
          )}
          {tab === "Portfolio" && (
            <>
              <section className="metrics">
                <article>
                  <span>ACCESSIBLE AFTER-TAX CASH</span>
                  <strong>{money(stats.total)}</strong>
                  <small>Baseline + realised accessible ledger entries</small>
                </article>
                <article>
                  <span>REMAINING TO TARGET</span>
                  <strong>{money(stats.gap)}</strong>
                  <small>
                    Target {money(state.settings.target)} · no paper valuations
                  </small>
                </article>
                <article>
                  <span>MONTHLY PACE REQUIRED</span>
                  <strong>
                    {stats.requiredMonthly === null
                      ? "Deadline reached"
                      : money(stats.requiredMonthly)}
                  </strong>
                  <small>
                    Arithmetic gap / remaining months; not a forecast
                  </small>
                </article>
                <article>
                  <span>ACTIVE EXPERIMENTS</span>
                  <strong>
                    {state.experiments
                      .filter((e) => e.status === "Running")
                      .length.toString()
                      .padStart(2, "0")}
                  </strong>
                  <small>
                    {
                      state.experiments.filter((e) => e.status === "Failed")
                        .length
                    }{" "}
                    failed · learning retained
                  </small>
                </article>
              </section>
              <div className="two-col">
                <section className="panel">
                  <div className="section-title">
                    <div>
                      <p className="eyebrow">THE TWO ENGINES</p>
                      <h2>Explore widely. Allocate deliberately.</h2>
                    </div>
                    <span className="pill mint">IN MOTION</span>
                  </div>
                  <div className="engines">
                    <article>
                      <b>01 / DISCOVERY</b>
                      <h3>Find the overlooked</h3>
                      <p>
                        Unmet demand, emerging capabilities, convergence, local
                        gaps and short windows. Speculative ideas remain
                        eligible for learning tests.
                      </p>
                      <button onClick={() => setTab("Agent reports")}>
                        Create research packets →
                      </button>
                    </article>
                    <article>
                      <b>02 / CONVERGENCE</b>
                      <h3>Earn the next commitment</h3>
                      <p>
                        Falsify the thesis, test willingness to pay, retain
                        dissent and compare the portfolio’s cash potential
                        before committing attention or capital.
                      </p>
                      <button onClick={() => setTab("Decisions")}>
                        Review decisions →
                      </button>
                    </article>
                  </div>
                </section>
                <section className="panel dark">
                  <p className="eyebrow">OPERATING CONSTRAINTS</p>
                  <h2>
                    Attention is finite.
                    <br />
                    Possibility isn’t.
                  </h2>
                  <p>
                    No arbitrary project count, lifetime or repeatability limit.
                    One-week offers, seasonal launches and geographic
                    replication belong here.
                  </p>
                  <dl>
                    <dt>Deployable capital</dt>
                    <dd>{money(state.settings.deployableCapital)}</dd>
                    <dt>Weekly attention budget</dt>
                    <dd>{state.settings.weeklyHours} hours</dd>
                  </dl>
                  <button onClick={() => setTab("Workspace")}>
                    Review private assumptions →
                  </button>
                </section>
              </div>
              <section className="panel">
                <div className="section-title">
                  <div>
                    <p className="eyebrow">OPPORTUNITY PIPELINE</p>
                    <h2>The next commercial proof</h2>
                  </div>
                  <button onClick={() => setTab("Opportunities")}>
                    Open register →
                  </button>
                </div>
                {!state.opportunities.length ? (
                  <div className="empty">
                    <h3>Your private portfolio starts here.</h3>
                    <p>
                      Import the private seed file or add your first
                      opportunity. No personal information ships with this app.
                    </p>
                    <button onClick={() => setTab("Workspace")}>
                      Set up workspace
                    </button>
                  </div>
                ) : (
                  <div className="pipeline">
                    {state.opportunities.slice(0, 6).map((o) => (
                      <article key={o.id}>
                        <span className="stage">{o.stage}</span>
                        <h3>{o.name}</h3>
                        <p>{o.nextTest}</p>
                        <button
                          onClick={() => {
                            setSelected(o.id);
                            setTab("Opportunities");
                          }}
                        >
                          Inspect opportunity ↗
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
          {tab === "Opportunities" && (
            <>
              <section className="panel">
                <div className="section-title">
                  <h2>Opportunity register</h2>
                  <input
                    aria-label="Search opportunities"
                    placeholder="Search opportunities…"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Opportunity</th>
                        <th>Stage</th>
                        <th>Mode</th>
                        <th>Score / 5</th>
                        <th>Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.opportunities
                        .filter((o) =>
                          (o.name + " " + o.thesis)
                            .toLowerCase()
                            .includes(filter.toLowerCase()),
                        )
                        .map((o) => (
                          <tr key={o.id} onClick={() => setSelected(o.id)}>
                            <td>
                              <button
                                className="text-button"
                                onClick={() => setSelected(o.id)}
                              >
                                {o.name}
                              </button>
                              <small>{o.nextTest}</small>
                            </td>
                            <td>
                              <span className="stage">{o.stage}</span>
                            </td>
                            <td>
                              {o.speculative ? "Speculative" : "Demand-led"}
                            </td>
                            <td>
                              {rank(o) === null
                                ? "Unscored"
                                : rank(o).toFixed(1)}
                            </td>
                            <td>{o.confidence}%</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <details className="panel">
                <summary>Add an opportunity</summary>
                <Form
                  onSave={(d) => {
                    const o = makeOpportunity(d.name, d.thesis, {
                      speculative: d.speculative === "yes",
                      geography: d.geography,
                      window: d.window,
                      nextTest: d.nextTest,
                    });
                    add("opportunities", o);
                    setSelected(o.id);
                  }}
                >
                  <Field name="name" required />
                  <Field name="thesis" kind="textarea" required />
                  <Field name="geography" />
                  <Field name="window" />
                  <Field name="speculative" options={["no", "yes"]} />
                  <Field name="nextTest" kind="textarea" required />
                </Form>
              </details>
              {active && (
                <section className="panel" key={active.id}>
                  <h2>Edit: {active.name}</h2>
                  <p>
                    Scores express judgments. Missing scores remain unknown. A
                    low demand score does not automatically close a speculative
                    thesis.
                  </p>
                  <Form
                    onSave={(d) =>
                      update((s) => {
                        const o = s.opportunities.find(
                          (x) => x.id === targetId,
                        );
                        Object.assign(o, {
                          name: d.name,
                          thesis: d.thesis,
                          geography: d.geography,
                          window: d.window,
                          nextTest: d.nextTest,
                          speculative: d.speculative === "yes",
                          confidence: Number(d.confidence),
                          scores: Object.fromEntries(
                            dimensions.map((k) => [
                              k,
                              d[k] === "" ? "" : Number(d[k]),
                            ]),
                          ),
                        });
                        return s;
                      })
                    }
                  >
                    <Field name="name" required defaultValue={active.name} />
                    <Field
                      name="thesis"
                      kind="textarea"
                      defaultValue={active.thesis}
                    />
                    <Field name="geography" defaultValue={active.geography} />
                    <Field name="window" defaultValue={active.window} />
                    <Field
                      name="speculative"
                      options={["no", "yes"]}
                      defaultValue={active.speculative ? "yes" : "no"}
                    />
                    <Field
                      name="confidence"
                      kind="number"
                      min="0"
                      max="100"
                      required
                      defaultValue={active.confidence}
                    />
                    {dimensions.map((k) => (
                      <Field
                        key={k}
                        name={k}
                        options={["", 0, 1, 2, 3, 4, 5]}
                        defaultValue={active.scores[k]}
                      />
                    ))}
                    <Field
                      name="nextTest"
                      kind="textarea"
                      required
                      defaultValue={active.nextTest}
                    />
                  </Form>
                </section>
              )}
            </>
          )}
          {[
            "Evidence",
            "Agent reports",
            "Experiments",
            "Decisions",
            "Cash ledger",
          ].includes(tab) && (
            <>
              <section className="selector panel">
                <label>
                  Opportunity{" "}
                  <select value={targetId ?? ""} onChange={choose}>
                    {state.opportunities.map((o) => (
                      <option value={o.id} key={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </label>
                {!active && <p>Add an opportunity first.</p>}
              </section>
              {active && (
                <React.Fragment key={active.id + "-" + tab}>
                  {tab === "Evidence" && (
                    <>
                      <section className="panel">
                        <h2>Record what supports or challenges the thesis</h2>
                        <Form
                          onSave={(d) =>
                            add("evidence", {
                              ...d,
                              opportunityId: targetId,
                              confidence: Number(d.confidence),
                            })
                          }
                        >
                          <Field name="claim" kind="textarea" required />
                          <Field
                            name="type"
                            options={[
                              "Observation",
                              "Market test",
                              "Opinion",
                              "Assumption",
                              "Counterevidence",
                            ]}
                          />
                          <Field
                            name="source"
                            placeholder="URL, document reference or test ID"
                          />
                          <Field
                            name="observedOn"
                            kind="date"
                            defaultValue={today()}
                            required
                          />
                          <Field
                            name="confidence"
                            kind="number"
                            defaultValue="0"
                            min="0"
                            max="100"
                            required
                          />
                          <Field name="implication" kind="textarea" />
                        </Form>
                      </section>
                      <Cards rows={related("evidence")} title="claim" />
                    </>
                  )}
                  {tab === "Agent reports" && (
                    <>
                      <section className="panel">
                        <h2>Independent research packets</h2>
                        <p>
                          Give each packet to a fresh researcher or model
                          session before sharing any other report. A role is not
                          an independent model. Record provider/model and prior
                          exposure honestly. Packets contain private opportunity
                          text: review before sending anywhere.
                        </p>
                        <div className="role-grid">
                          {roles.map((role) => (
                            <button
                              key={role}
                              onClick={() =>
                                download(
                                  "research-packet.private.json",
                                  researchPacket(active, role),
                                )
                              }
                            >
                              {role} ↗
                            </button>
                          ))}
                        </div>
                      </section>
                      <section className="panel">
                        <h2>Submit an initial report</h2>
                        <p>
                          Reports are append-only in this interface. Submit
                          corrections as new reports. Existing reports are
                          hidden until you choose to reveal them; this is a
                          review aid, not a security boundary.
                        </p>
                        <Form
                          onSave={(d) =>
                            add("reports", {
                              ...d,
                              opportunityId: targetId,
                              submittedOn: today(),
                            })
                          }
                        >
                          <Field name="role" options={roles} />
                          <Field name="researcher" required />
                          <Field
                            name="model"
                            required
                            placeholder="Provider, model/version or human"
                          />
                          <Field
                            name="isolation"
                            kind="textarea"
                            required
                            placeholder="Fresh context? Prior exposure? Shared sources?"
                          />
                          <Field name="thesis" kind="textarea" required />
                          <Field name="sources" kind="textarea" />
                          <Field name="assumptions" kind="textarea" />
                          <Field name="uncertainty" kind="textarea" />
                          <Field name="dissent" kind="textarea" />
                          <Field name="falsifier" kind="textarea" required />
                        </Form>
                      </section>
                      <section className="panel">
                        <h2>{related("reports").length} reports submitted</h2>
                        <p>
                          {
                            new Set(
                              related("reports").map((r) =>
                                r.model.trim().toLowerCase(),
                              ),
                            ).size
                          }{" "}
                          self-reported model identities. This does not prove
                          independence or consensus.
                        </p>
                        <button onClick={() => setRevealed(!revealed)}>
                          {revealed ? "Hide reports" : "Reveal for synthesis"}
                        </button>
                      </section>
                      {revealed && (
                        <Cards rows={related("reports")} title="role" />
                      )}
                    </>
                  )}
                  {tab === "Experiments" && (
                    <>
                      <section className="panel">
                        <h2>A falsifiable test, a bounded commitment</h2>
                        <p>
                          Recording a test does not execute it or approve
                          spending, outreach or publication. Preserve negative
                          results.
                        </p>
                        <Form
                          onSave={(d) => {
                            if (d.status === "Running" && !d.approval.trim())
                              throw Error(
                                "Record the owner approval reference before marking a test Running.",
                              );
                            add("experiments", {
                              ...d,
                              opportunityId: targetId,
                              budget: Number(d.budget),
                            });
                          }}
                        >
                          <Field name="hypothesis" kind="textarea" required />
                          <Field name="method" kind="textarea" required />
                          <Field name="metric" required />
                          <Field name="threshold" required />
                          <Field name="deadline" kind="date" required />
                          <Field
                            name="budget"
                            kind="number"
                            min="0"
                            step="0.01"
                            defaultValue="0"
                            required
                          />
                          <Field
                            name="status"
                            options={[
                              "Proposed",
                              "Running",
                              "Passed",
                              "Failed",
                              "Stopped",
                            ]}
                          />
                          <Field
                            name="approval"
                            placeholder="Owner approval/date/scope"
                          />
                          <Field name="result" kind="textarea" />
                        </Form>
                      </section>
                      {related("experiments").map((r) => (
                        <section className="panel" key={r.id}>
                          <h3>{r.hypothesis}</h3>
                          <p>
                            {r.method} · {r.metric} · Pass: {r.threshold} ·
                            Budget: {money(r.budget)} · Due: {r.deadline}
                          </p>
                          <Form
                            button="Record outcome"
                            onSave={(d) => {
                              if (d.status === "Running" && !d.approval.trim())
                                throw Error("Approval reference required.");
                              update((s) => {
                                Object.assign(
                                  s.experiments.find((x) => x.id === r.id),
                                  d,
                                );
                                return s;
                              });
                            }}
                          >
                            <Field
                              name="status"
                              options={[
                                "Proposed",
                                "Running",
                                "Passed",
                                "Failed",
                                "Stopped",
                              ]}
                              defaultValue={r.status}
                            />
                            <Field name="approval" defaultValue={r.approval} />
                            <Field
                              name="result"
                              kind="textarea"
                              defaultValue={r.result}
                            />
                          </Form>
                        </section>
                      ))}
                    </>
                  )}
                  {tab === "Decisions" && (
                    <>
                      <section className="panel">
                        <h2>Make the commitment explicit</h2>
                        <p>
                          Review desirability, feasibility, viability,
                          scalability and deadline fit together. Scores advise;
                          humans decide. Launch/Scale needs evidence. This
                          records an internal decision and performs no external
                          action.
                        </p>
                        <p>
                          {related("evidence").length} evidence records will be
                          linked as the decision’s review snapshot. Read them
                          before deciding.
                        </p>
                        <Form onSave={saveDecision}>
                          <Field name="action" options={stages} />
                          <Field name="reviewer" required />
                          <Field name="rationale" kind="textarea" required />
                          <Field name="dissent" kind="textarea" />
                        </Form>
                      </section>
                      <Cards rows={related("decisions")} title="action" />
                    </>
                  )}
                  {tab === "Cash ledger" && (
                    <>
                      <section className="panel">
                        <h2>Track realised cash and explicit reserves</h2>
                        <p>
                          Enter actual receipts and costs. Tax entries are
                          manual reserves, not tax advice or a PSI assessment.
                          Only personally accessible rows dated by today and the
                          target deadline count. Mark company-retained, super
                          and paper equity inaccessible. Use negative cash
                          through costs, including failed launches.
                        </p>
                        <Form
                          onSave={(d) =>
                            add("cash", {
                              ...d,
                              opportunityId: targetId,
                              ...Object.fromEntries(
                                [
                                  "receipts",
                                  "costs",
                                  "gstReserve",
                                  "companyTaxReserve",
                                  "personalTaxReserve",
                                  "extractionCosts",
                                ].map((k) => [k, Number(d[k])]),
                              ),
                              accessible: d.accessible === "yes",
                            })
                          }
                        >
                          <Field name="description" required />
                          <Field
                            name="date"
                            kind="date"
                            required
                            defaultValue={today()}
                          />
                          {[
                            "receipts",
                            "costs",
                            "gstReserve",
                            "companyTaxReserve",
                            "personalTaxReserve",
                            "extractionCosts",
                          ].map((k) => (
                            <Field
                              key={k}
                              name={k}
                              kind="number"
                              min="0"
                              step="0.01"
                              required
                              defaultValue="0"
                            />
                          ))}
                          <Field name="accessible" options={["no", "yes"]} />
                        </Form>
                      </section>
                      <Cards
                        rows={related("cash").map((r) => ({
                          ...r,
                          netAfterReserves: money(netCash(r)),
                        }))}
                        title="description"
                      />
                    </>
                  )}
                </React.Fragment>
              )}
            </>
          )}
          {tab === "Workspace" && (
            <>
              <section className="panel">
                <h2>Private working assumptions</h2>
                <p>
                  Keep baseline accessible funds separate from future receipts
                  to avoid double counting. The monthly gap is a forcing
                  function, not a return forecast. Purchasing power can support
                  a rational alternative accommodation/investment decision;
                  illiquid valuations do not count.
                </p>
                <Form
                  onSave={(d) =>
                    update((s) => {
                      s.settings = {
                        ...d,
                        ...Object.fromEntries(
                          [
                            "target",
                            "baselineAccessible",
                            "deployableCapital",
                            "weeklyHours",
                          ].map((k) => [k, Number(d[k])]),
                        ),
                      };
                      return s;
                    })
                  }
                >
                  {[
                    "target",
                    "baselineAccessible",
                    "deployableCapital",
                    "weeklyHours",
                  ].map((k) => (
                    <Field
                      key={k}
                      name={k}
                      kind="number"
                      min={k === "target" ? "1" : "0"}
                      step="0.01"
                      required
                      defaultValue={state.settings[k]}
                    />
                  ))}
                  <Field
                    name="deadline"
                    kind="date"
                    defaultValue={state.settings.deadline}
                    required
                    readOnly
                  />
                  <Field
                    name="notes"
                    kind="textarea"
                    defaultValue={state.settings.notes}
                  />
                </Form>
              </section>
              <section className="panel">
                <h2>Local workspace & backups</h2>
                <p>
                  Saved in this browser on this device, without encryption.
                  Export before clearing browser data or changing devices.
                  Exported files contain private research and finances. Cloud
                  saves are explicit and never automatic.
                </p>
                <div className="actions">
                  <button
                    onClick={() =>
                      download("foundry-workspace.private.json", state)
                    }
                  >
                    Export private backup
                  </button>
                  <label className="file-button">
                    Import private workspace
                    <input
                      type="file"
                      accept=".json"
                      onChange={async (e) => {
                        try {
                          const next = await readFile(e.target.files[0]);
                          if (
                            confirm(
                              "Replace this browser workspace? Export a backup first.",
                            )
                          ) {
                            setStorageHealthy(true);
                            setState(next);
                            setSelected("");
                            setRevision(undefined);
                            setNotice(
                              "Imported locally. Load cloud before saving online.",
                            );
                          }
                        } catch (err) {
                          setError(err.message);
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "Replace the local workspace with generic demo data? Export first.",
                        )
                      ) {
                        setStorageHealthy(true);
                        setState(demoState());
                        setSelected("");
                        setRevision(undefined);
                      }
                    }}
                  >
                    Load generic demo
                  </button>
                </div>
              </section>
              <section className="panel">
                <h2>Optional private Supabase sync</h2>
                <p>
                  {cloudConfigured
                    ? "Configured"
                    : "Not configured — local mode works without credentials."}{" "}
                  · Uses authenticated users explicitly added to the foundry
                  allowlist. Sessions are held in memory; sign in again after
                  refreshing. No service key is used.
                </p>
                {!session ? (
                  <Form
                    button="Sign in"
                    onSave={(d) =>
                      cloudAction(async () => {
                        setSession(await signIn(d.email, d.password));
                        setRevision(undefined);
                        setNotice("Signed in. Load cloud before saving.");
                      })
                    }
                  >
                    <Field name="email" kind="email" required />
                    <Field
                      name="password"
                      kind="password"
                      required
                      autoComplete="current-password"
                    />
                  </Form>
                ) : (
                  <div className="actions">
                    <button
                      disabled={busy}
                      onClick={() =>
                        cloudAction(async () => {
                          const cloud = await cloudLoad(session);
                          if (cloud) {
                            if (
                              !confirm(
                                "Replace local workspace with cloud data? Export first.",
                              )
                            )
                              return;
                            setState(cloud.state);
                            setRevision(cloud.revision);
                          } else setRevision(null);
                          setNotice(
                            cloud
                              ? "Cloud loaded."
                              : "No cloud workspace yet. You can now save this local workspace.",
                          );
                        })
                      }
                    >
                      Load cloud
                    </button>
                    <button
                      disabled={busy || revision === undefined}
                      onClick={() =>
                        cloudAction(async () => {
                          setRevision(
                            await cloudSave(session, state, revision),
                          );
                          setNotice("Cloud saved.");
                        })
                      }
                    >
                      Save cloud
                    </button>
                    <button
                      onClick={() => {
                        setSession(null);
                        setRevision(undefined);
                        setNotice(
                          "Signed out of cloud. Private data remains in this browser; export then clear site data if needed.",
                        );
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </section>
              <section className="panel">
                <h2>First validation cycle</h2>
                <ol>
                  <li>
                    Days 1–2: confirm constraints, import opportunities, define
                    discovery briefs.
                  </li>
                  <li>
                    Days 3–5: independently research demand, technology,
                    convergence and arbitrage; retain dissent.
                  </li>
                  <li>
                    Days 6–7: synthesise, falsify and shortlist external tests
                    with costs and pass/fail thresholds.
                  </li>
                  <li>
                    Days 8–12: seek owner approval, then run real commercial
                    tests. Record willingness to pay and outcomes.
                  </li>
                  <li>
                    Days 13–14: decide launch, repeat, pivot, hold or close;
                    reconcile costs and personally accessible cash.
                  </li>
                </ol>
                <p>
                  No live agents, customer outreach, payment collection or
                  scheduled discovery jobs are activated in this foundation.
                </p>
              </section>
            </>
          )}
          <footer>
            NO KILL SWITCH{" "}
            <span>Evidence over enthusiasm. Cash over paper value.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
function Cards({ rows, title }) {
  return (
    <div className="records">
      {!rows.length && (
        <p className="empty">
          No records yet. Unknown is a valid starting point.
        </p>
      )}
      {rows.map((r) => (
        <article className="panel" key={r.id}>
          <h3>{r[title]}</h3>
          <dl className="record">
            {Object.entries(r)
              .filter(([k]) => !["id", "opportunityId", title].includes(k))
              .map(([k, v]) => (
                <React.Fragment key={k}>
                  <dt>{label(k)}</dt>
                  <dd>
                    {Array.isArray(v)
                      ? v.join(", ")
                      : typeof v === "boolean"
                        ? v
                          ? "Yes"
                          : "No"
                        : String(v) || "Not recorded"}
                  </dd>
                </React.Fragment>
              ))}
          </dl>
        </article>
      ))}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
