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
