import { FaArrowUp, FaArrowDown, FaSync } from "react-icons/fa";

interface Transaction {
  digest: string;
  timestamp: string | null;
  type: "incoming" | "outgoing";
  status: string;
}

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export default function TransactionHistory({ transactions, isLoading }: TransactionHistoryProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-statBorderGrey overflow-hidden">
        <div className="px-6 py-4 border-b border-statBorderGrey">
          <h3 className="text-sm font-semibold text-lorryDarkBlack">Recent Activity</h3>
        </div>
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 bg-offWhiteBackground rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-offWhiteBackground rounded w-1/3" />
                <div className="h-3 bg-offWhiteBackground rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-statBorderGrey overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-statBorderGrey flex justify-between items-center">
        <h3 className="text-sm font-semibold text-lorryDarkBlack">Recent Activity</h3>
        <button className="text-xs font-medium text-lorryBlue hover:underline">View All</button>
      </div>

      <div className="divide-y divide-statBorderGrey">
        {transactions.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-12 h-12 bg-offWhiteBackground rounded-full flex items-center justify-center mx-auto mb-3">
              <FaSync className="text-inputGrey w-5 h-5 opacity-20" />
            </div>
            <p className="text-sm text-inputGrey">No transactions yet.</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div key={tx.digest} className="px-6 py-4 flex items-center justify-between hover:bg-pageWhite transition-colors cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  tx.type === "incoming" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                }`}>
                  {tx.type === "incoming" ? <FaArrowDown className="w-3.5 h-3.5" /> : <FaArrowUp className="w-3.5 h-3.5" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-lorryDarkBlack capitalize">
                    {tx.type === "incoming" ? "Received USDC" : "Sent USDC"}
                  </p>
                  <p className="text-xs text-inputGrey">
                    {tx.timestamp ? new Date(parseInt(tx.timestamp)).toLocaleString(undefined, {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                    }) : "Pending..."}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${tx.status === "success" ? "text-lorryDarkBlack" : "text-inputGrey"}`}>
                  {tx.status === "success" ? "Confirmed" : "Processing"}
                </p>
                <p className="text-[10px] text-inputGrey font-mono group-hover:text-lorryBlue transition-colors">
                  {tx.digest.slice(0, 6)}...{tx.digest.slice(-4)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
