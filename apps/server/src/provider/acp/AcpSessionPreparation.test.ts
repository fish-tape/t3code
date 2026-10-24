import { assert, it } from "@effect/vitest";
import { sessionPreparationRejected } from "./AcpSessionPreparation.ts";

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
