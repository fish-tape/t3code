import { assert, it } from "@effect/vitest";
import { RunId } from "@t3tools/contracts";
import {
  acpDurableTurn,
  acpDurableDelivery,
  acpDurableSessionUnavailable,
  supportsAcpDurablePrompt,
} from "./AcpDurablePrompt.ts";

it("retains the original remote turn through repeated restart continuations", () => {
  const first = acpDurableTurn({ sessionId: "session", runId: "original" });
  const resumed = acpDurableTurn({
    sessionId: "session",
    runId: "recovery-1",
    restartContinuationOfRunId: "original",
    metadata: { acpDurablePrompt: { ...first, runId: RunId.make("original"), sequence: 42 } },
  });
  const repeated = acpDurableTurn({
    sessionId: "session",
    runId: "recovery-2",
    restartContinuationOfRunId: "recovery-1",
    metadata: { acpDurablePrompt: { ...resumed, runId: RunId.make("recovery-1") } },
  });
  assert.deepEqual(repeated, resumed);
  assert.equal(repeated.nativeTurnId, first.nativeTurnId);
  assert.equal(
    acpDurableTurn({ sessionId: "session", runId: "next", metadata: { acpDurablePrompt: resumed } })
      .sequence,
    0,
  );
});
it("attaches to the interrupted run when the saved cursor belongs to an older turn", () => {
  const resumed = acpDurableTurn({
    sessionId: "session",
    runId: "recovery",
    restartContinuationOfRunId: "accepted-new-turn",
    metadata: {
      acpDurablePrompt: {
        turnId: "older-completed-turn",
        nativeTurnId: "session:durable:older-completed-turn",
        runId: RunId.make("older-completed-turn"),
        sequence: 42,
      },
    },
  });
  assert.equal(resumed.turnId, "accepted-new-turn");
  assert.equal(resumed.nativeTurnId, "session:durable:accepted-new-turn");
  assert.equal(resumed.sequence, 0);
});
it("negotiates version 1 and rejects malformed delivery cursors", () => {
  const key = "io.t3code/durable-prompt";
  assert.isTrue(supportsAcpDurablePrompt({ [key]: { version: 1 } }));
  assert.isFalse(supportsAcpDurablePrompt({ [key]: { version: 2 } }));
  for (const sequence of [-1, 0, 1.5, NaN, Number.MAX_SAFE_INTEGER + 1])
    assert.isUndefined(acpDurableDelivery({ [key]: { turnId: "turn", sequence } }));
  assert.deepEqual(acpDurableDelivery({ [key]: { turnId: "turn", sequence: 7 } }), {
    turnId: "turn",
    sequence: 7,
  });
  assert.isTrue(acpDurableSessionUnavailable({ cause: { code: -32097 } }));
  assert.isFalse(acpDurableSessionUnavailable({ code: -32603 }));
});
