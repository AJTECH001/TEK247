import { createNetworkConfig } from "@mysten/dapp-kit";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";

const { networkConfig, useNetworkVariable, useNetworkVariables } = createNetworkConfig({
	testnet: {
		url: getJsonRpcFullnodeUrl("testnet"),
	},
	mainnet: {
		url: getJsonRpcFullnodeUrl("mainnet"),
	},
});

export { networkConfig, useNetworkVariable, useNetworkVariables };
