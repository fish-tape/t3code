import { NativeSessionPreparationReceipt } from "@t3tools/contracts";
import * as Schema from "effect/Schema";

export const ACP_SESSION_PREPARATION = "t3code.sessionPreparation";

export type SessionPreparationRequest = {
  readonly requestId: string;
  readonly expectedGeneration?: string;
};

export const supportsSessionPreparation = Schema.is(
  Schema.Struct({ [ACP_SESSION_PREPARATION]: Schema.Literal(1) }),
);

export const decodeSessionPreparation = Schema.decodeUnknownOption(
  Schema.Struct({ [ACP_SESSION_PREPARATION]: NativeSessionPreparationReceipt }),
);

const isRejectedPrompt = Schema.is(
  Schema.Struct({
    code: Schema.Literal(-32097),
    data: Schema.Struct({
      kind: Schema.Literal("session_preparation"),
      dispatch: Schema.Literal("rejected"),
    }),
  }),
);

/** A controller-certified pre-dispatch rejection; generic errors remain uncertain. */
export function sessionPreparationRejected(error: unknown): boolean {
  if (isRejectedPrompt(error)) return true;
  return (
    typeof error === "object" &&
    error !== null &&
    "cause" in error &&
    error.cause !== error &&
    sessionPreparationRejected(error.cause)
  );
}
