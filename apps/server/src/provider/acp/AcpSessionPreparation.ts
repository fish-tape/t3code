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
export function sessionPreparationRejected(error: unknown, depth = 0): boolean {
  if (isRejectedPrompt(error)) return true;
  return (
    typeof error === "object" &&
    error !== null &&
    "cause" in error &&
    error.cause !== error &&
    depth < 8 &&
    sessionPreparationRejected(error.cause, depth + 1)
  );
}

const isRejectedRetainedDispatch = Schema.is(
  Schema.Struct({
    code: Schema.Literal(-32097),
    data: Schema.Struct({
      kind: Schema.Literal("retained_dispatch"),
      dispatch: Schema.Literal("rejected"),
      turnId: Schema.String,
    }),
  }),
);

/** Only an authenticated, durable fence for this exact original turn releases its hold. */
export function retainedDispatchRejected(error: unknown, turnId: string, depth = 0): boolean {
  if (isRejectedRetainedDispatch(error)) return error.data.turnId === turnId;
  return (
    typeof error === "object" &&
    error !== null &&
    "cause" in error &&
    error.cause !== error &&
    depth < 8 &&
    retainedDispatchRejected(error.cause, turnId, depth + 1)
  );
}
