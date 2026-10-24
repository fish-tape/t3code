import { assert, it } from "@effect/vitest";
import { retainedDispatchRejected, sessionPreparationRejected } from "./AcpSessionPreparation.ts";

it("recognizes a controller-certified pre-dispatch rejection through wrapped errors", () => {
  assert.isTrue(
    sessionPreparationRejected({
      cause: {
        code: -32097,
        data: { kind: "session_preparation", dispatch: "rejected" },
      },
    }),
  );
});

it.each([
  { code: -32097 },
  { code: -32097, data: { kind: "durable_attachment", dispatch: "rejected" } },
  { code: -32097, data: { kind: "session_preparation", dispatch: "uncertain" } },
  { code: -32603, data: { kind: "session_preparation", dispatch: "rejected" } },
])("keeps non-certified failure %# uncertain", (error) => {
  assert.isFalse(sessionPreparationRejected(error));
});

it("recognizes a retained rejection only for the exact fenced root turn", () => {
  const certificate = {
    code: -32097,
    data: { kind: "retained_dispatch", dispatch: "rejected", turnId: "root" },
  };
  assert.isTrue(retainedDispatchRejected({ cause: certificate }, "root"));
  assert.isFalse(retainedDispatchRejected(certificate, "another"));
  assert.isFalse(retainedDispatchRejected({ code: -32097 }, "root"));
  assert.isFalse(
    retainedDispatchRejected(
      { code: -32097, data: { kind: "session_preparation", dispatch: "rejected" } },
      "root",
    ),
  );
  const cycle: { cause?: unknown } = {};
  cycle.cause = { cause: cycle };
  assert.isFalse(retainedDispatchRejected(cycle, "root"));
});
