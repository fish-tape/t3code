import type { OrchestrationV2ProviderThreadNativeMetadata } from "@t3tools/contracts";

export const ACP_DURABLE_PROMPT = "io.t3code/durable-prompt";

export function supportsAcpDurablePrompt(meta: Record<string, unknown> | null | undefined) {
  const value = meta?.[ACP_DURABLE_PROMPT];
  return typeof value === "object" && value !== null && "version" in value && value.version === 1;
}

export function acpDurableDelivery(meta: Record<string, unknown> | null | undefined) {
  const value = meta?.[ACP_DURABLE_PROMPT];
  if (
    typeof value !== "object" ||
    value === null ||
    !("turnId" in value) ||
    typeof value.turnId !== "string" ||
    !("sequence" in value) ||
    typeof value.sequence !== "number" ||
    !Number.isSafeInteger(value.sequence) ||
    value.sequence < 1
  )
    return;
  return { turnId: value.turnId, sequence: value.sequence };
}

export function acpDurableTurn(input: {
  sessionId: string;
  runId: string;
  restartContinuationOfRunId?: string;
  metadata?: OrchestrationV2ProviderThreadNativeMetadata | null | undefined;
}) {
  const previous = input.metadata?.acpDurablePrompt;
  const attach = input.restartContinuationOfRunId !== undefined;
  const sameChain =
    attach &&
    (previous?.runId === input.restartContinuationOfRunId ||
      previous?.turnId === input.restartContinuationOfRunId);
  const turnId = attach
    ? sameChain
      ? previous!.turnId
      : input.restartContinuationOfRunId!
    : input.runId;
  return {
    turnId,
    nativeTurnId: `${input.sessionId}:durable:${turnId}`,
    sequence: sameChain ? previous!.sequence : 0,
    attach,
  };
}

/** Durable agents must never fall back to creating and re-prompting a fresh session. */
export function acpDurableSessionUnavailable(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && error.code === -32097) return true;
  return "cause" in error && error.cause !== error && acpDurableSessionUnavailable(error.cause);
}
