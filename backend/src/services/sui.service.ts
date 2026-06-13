import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const client = new SuiJsonRpcClient({ url: env.SUI_FULLNODE_URL });

export const SuiService = {
  /**
   * Fetch USDC balance for a given address
   */
  async getUsdcBalance(address: string): Promise<{ totalBalance: string; symbol: string; decimals: number }> {
    try {
      const balance = await client.getBalance({
        owner: address,
        coinType: env.USDC_TYPE,
      });

      // Fetch metadata for decimals and symbol
      const metadata = await client.getCoinMetadata({ coinType: env.USDC_TYPE });

      return {
        totalBalance: balance.totalBalance,
        symbol: metadata?.symbol || "USDC",
        decimals: metadata?.decimals || 6,
      };
    } catch (err) {
      logger.error(`Failed to fetch Sui balance for ${address}:`, err);
      throw new Error("Could not retrieve blockchain balance");
    }
  },

  /**
   * Fetch recent transactions for a given address
   * This is a simplified version for hackathon/demo purposes.
   * In production, you'd use an indexer.
   */
  async getRecentTransactions(address: string, limit: number = 10) {
    try {
      const txs = await client.queryTransactionBlocks({
        filter: { FromOrToAddress: { addr: address } },
        limit,
        options: {
          showInput: true,
          showEffects: true,
          showEvents: true,
        },
      });

      return txs.data.map((tx) => {
        const isSender = tx.transaction?.data.sender === address;
        // Simplified logic to determine "amount" - in reality, you'd parse balance changes
        return {
          digest: tx.digest,
          timestamp: tx.timestampMs,
          type: isSender ? "outgoing" : "incoming",
          status: tx.effects?.status.status || "unknown",
        };
      });
    } catch (err) {
      logger.error(`Failed to fetch transactions for ${address}:`, err);
      return [];
    }
  }
};
