import type { ProviderInstanceEnvironmentVariable } from "@t3tools/contracts";

/**
 * Fish Tape speaks ACP through the controller bridge. Keep this preset in the
 * client so adding the provider does not require a second server-side driver;
 * T3's existing local ACP driver owns process startup and protocol handling.
 */
export const FISH_TAPE_PROVIDER_LABEL = "Fish Tape Remote Agent";
const FISH_TAPE_ACP_COMMAND = "fishtape-acp-controller-bridge";

interface FishTapeProviderPreset {
  readonly config: {
    readonly source: "local";
    readonly commandPath: string;
    readonly commandArgs: readonly [];
  };
  readonly environment: ReadonlyArray<ProviderInstanceEnvironmentVariable>;
}

/** Return fresh rows so editing one add-provider dialog cannot mutate another. */
export function createFishTapeProviderPreset(): FishTapeProviderPreset {
  return {
    config: {
      source: "local",
      commandPath: FISH_TAPE_ACP_COMMAND,
      commandArgs: [],
    },
    environment: [
      {
        name: "FISHTAPE_CONTROLLER_URL",
        value: "",
        sensitive: false,
      },
      {
        name: "FISHTAPE_CONTROLLER_TOKEN",
        value: "",
        sensitive: true,
      },
      {
        name: "FISHTAPE_SESSION_ID",
        value: "",
        sensitive: false,
      },
      {
        name: "FISHTAPE_REMOTE_CWD",
        value: "",
        sensitive: false,
      },
    ],
  };
}
