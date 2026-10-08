import { describe, expect, it } from "vite-plus/test";

import {
  createFishTapeProviderPreset,
  FISH_TAPE_PROVIDER_LABELS,
  type FishTapeAgent,
} from "./fishTapeProviderPreset";

describe("Fish Tape provider presets", () => {
  it.each([
    ["codex", "Fish Tape · Codex"],
    ["claude", "Fish Tape · Claude"],
  ] as const)("creates the %s preset with its agent label", (agent: FishTapeAgent, label) => {
    const preset = createFishTapeProviderPreset(agent);

    expect(FISH_TAPE_PROVIDER_LABELS[agent]).toBe(label);
    expect(preset.label).toBe(label);
    expect(preset.config).toEqual({
      source: "local",
      commandPath: "fishtape-acp-controller-bridge",
      commandArgs: [],
    });
    expect(preset.environment).toEqual([
      { name: "FISHTAPE_CONTROLLER_URL", value: "", sensitive: false },
      { name: "FISHTAPE_CONTROLLER_TOKEN", value: "", sensitive: true },
      { name: "FISHTAPE_SESSION_ID", value: "", sensitive: false },
      { name: "FISHTAPE_REMOTE_CWD", value: "", sensitive: false },
    ]);
  });
});
