import { assert, it } from "@effect/vitest";
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
    metadata: { acpDurablePrompt: { ...first, sequence: 42 } },
  });
  const repeated = acpDurableTurn({
    sessionId: "session",
    runId: "recovery-2",
    restartContinuationOfRunId: "recovery-1",
    metadata: { acpDurablePrompt: resumed },
  });
  assert.deepEqual(repeated, resumed);
  assert.equal(repeated.nativeTurnId, first.nativeTurnId);
  assert.equal(
    acpDurableTurn({ sessionId: "session", runId: "next", metadata: { acpDurablePrompt: resumed } })
      .sequence,
    0,
  );
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
