import { assert, it } from "@effect/vitest";
import {
  CommandId,
  ProviderInstanceId,
  ProviderSessionId,
  ProviderThreadId,
  RunId,
  ThreadId,
} from "@t3tools/contracts";
import { retainedDispatchRecoveryRun } from "./RetainedDispatchRecovery.ts";

const sourceId = RunId.make("held-original");
const threadId = ThreadId.make("held-thread");
const providerThreadId = ProviderThreadId.make("held-provider-thread");
const providerSessionId = ProviderSessionId.make("held-session");
const instanceId = ProviderInstanceId.make("held-acp");

const projection = () =>
  ({
    thread: {
      id: threadId,
      activeProviderThreadId: providerThreadId,
      providerInstanceId: instanceId,
      archivedAt: null,
      deletedAt: null,
      sessionPreparation: {
        threadId,
        requestId: CommandId.make("held-request"),
        completedRunId: RunId.make("completed-before-dispatch"),
        providerThreadId,
        providerSessionId,
        nativeId: "held-native",
        dispatchingRunId: sourceId,
      },
    },
    runs: [
      {
        id: sourceId,
        ordinal: 1,
        status: "failed",
        providerThreadId,
        providerInstanceId: instanceId,
      },
    ],
    providerThreads: [
      {
        id: providerThreadId,
        appThreadId: threadId,
        ownerNodeId: null,
        providerInstanceId: instanceId,
        providerSessionId,
        driver: "acpRegistry",
        nativeThreadRef: { driver: "acpRegistry", nativeId: "held-native", strength: "strong" },
        status: "idle",
      },
    ],
    runtimeRequests: [],
  }) as unknown as Parameters<typeof retainedDispatchRecoveryRun>[0];

it.each(["failed", "cancelled", "completed"] as const)(
  "retained dispatch recovery admits only the recorded %s operation without a live provider turn",
  (status) => {
    const base = projection();
    const state = { ...base, runs: [{ ...base.runs[0]!, status }] };
    assert.equal(retainedDispatchRecoveryRun(state, sourceId)?.id, sourceId);
  },
);

it("retained dispatch recovery tolerates later messages rejected by the same hold", () => {
  const base = projection();
  const state = {
    ...base,
    runs: [...base.runs, { ...base.runs[0]!, id: RunId.make("rejected-new-message"), ordinal: 2 }],
  };
  assert.equal(retainedDispatchRecoveryRun(state, sourceId)?.id, sourceId);
});

it.each(["running", "starting", "queued", "waiting", "completed"] as const)(
  "retained dispatch recovery refuses competing newer %s work",
  (status) => {
    const base = projection();
    const state = {
      ...base,
      runs: [...base.runs, { ...base.runs[0]!, id: RunId.make("other-work"), ordinal: 2, status }],
    };
    assert.isUndefined(retainedDispatchRecoveryRun(state, sourceId));
  },
);

it("retained dispatch recovery rejects a changed native binding", () => {
  const base = projection();
  const state = {
    ...base,
    providerThreads: [
      {
        ...base.providerThreads[0]!,
        nativeThreadRef: {
          driver: base.providerThreads[0]!.driver,
          nativeId: "replacement",
          strength: "strong" as const,
        },
      },
    ],
  };
  assert.isUndefined(retainedDispatchRecoveryRun(state, sourceId));
});

it("retained dispatch recovery rejects another operation identity", () => {
  assert.isUndefined(retainedDispatchRecoveryRun(projection(), RunId.make("other-operation")));
});

it("retained dispatch recovery preserves pending permission ownership", () => {
  const base = projection();
  const state = {
    ...base,
    runtimeRequests: [{ status: "pending" } as (typeof base.runtimeRequests)[number]],
  };
  assert.isUndefined(retainedDispatchRecoveryRun(state, sourceId));
});
