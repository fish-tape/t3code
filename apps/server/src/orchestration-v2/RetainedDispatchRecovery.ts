import type { OrchestrationV2ThreadProjection, RunId } from "@t3tools/contracts";
import { runRanAfter } from "@t3tools/shared/orchestrationV2ThreadError";

/** An explicit attach may reconcile a terminal app run whose native outcome is still held. */
export function retainedDispatchRecoveryRun(
  projection: Pick<
    OrchestrationV2ThreadProjection,
    "thread" | "runs" | "providerThreads" | "runtimeRequests"
  >,
  sourceRunId: RunId,
) {
  const marker = projection.thread.sessionPreparation;
  if (
    marker?.dispatchingRunId !== sourceRunId ||
    marker.threadId !== projection.thread.id ||
    projection.thread.archivedAt !== null ||
    projection.thread.deletedAt !== null ||
    projection.thread.activeProviderThreadId !== marker.providerThreadId ||
    projection.runtimeRequests.some((request) => request.status === "pending")
  )
    return;
  const source = projection.runs.find((run) => run.id === sourceRunId);
  const bound = projection.providerThreads.find((thread) => thread.id === marker.providerThreadId);
  if (
    source === undefined ||
    !["failed", "cancelled", "completed"].includes(source.status) ||
    source.providerThreadId !== marker.providerThreadId ||
    source.providerInstanceId !== projection.thread.providerInstanceId ||
    bound?.appThreadId !== marker.threadId ||
    bound.ownerNodeId !== null ||
    bound.providerInstanceId !== source.providerInstanceId ||
    bound.providerSessionId !== marker.providerSessionId ||
    bound.nativeThreadRef?.nativeId !== marker.nativeId ||
    bound.nativeThreadRef.strength !== "strong" ||
    bound.nativeThreadRef.driver !== bound.driver ||
    bound.status === "closed" ||
    bound.status === "archived" ||
    projection.runs.some(
      (run) =>
        // New user messages may already have failed against the hold. They did
        // not dispatch: only this recorded original operation can pass admission.
        !["failed", "cancelled", "completed", "rolled_back"].includes(run.status) ||
        (runRanAfter(run, source) && !["failed", "cancelled"].includes(run.status)),
    )
  )
    return;
  return source;
}
