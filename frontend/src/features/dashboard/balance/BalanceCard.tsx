import { FaArrowUp, FaArrowDown, FaSync } from "react-icons/fa";

interface BalanceCardProps {
  balance: string;
  symbol: string;
  decimals: number;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function BalanceCard({ balance, symbol, decimals, isLoading, onRefresh }: BalanceCardProps) {
  const formattedBalance = (parseInt(balance) / Math.pow(10, decimals)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <div className="bg-white rounded-2xl p-6 border border-statBorderGrey shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xs font-semibold text-inputGrey uppercase tracking-wider mb-1">Available Balance</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-lorryDarkBlack">
              {isLoading ? "..." : formattedBalance}
            </span>
            <span className="text-sm font-medium text-inputGrey">{symbol}</span>
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 text-inputGrey hover:text-lorryBlue hover:bg-pageWhite rounded-full transition-all disabled:opacity-50"
        >
          <FaSync className={`w-4 h-4 ${isLoading ? "animate-spin text-lorryBlue" : ""}`} />
        </button>
      </div>

      <div className="flex gap-3 mt-6">
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-lorryBlue text-white rounded-xl text-sm font-semibold hover:bg-lorryDarkBlue transition-all shadow-sm">
          <FaArrowDown className="w-3 h-3" />
          Deposit
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-pageWhite border border-inputBorderGrey text-lorryDarkBlack rounded-xl text-sm font-semibold hover:bg-offWhiteBackground transition-all">
          <FaArrowUp className="w-3 h-3" />
          Withdraw
        </button>
      </div>
    </div>
  );
}
