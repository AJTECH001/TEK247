import { useQuery } from "@tanstack/react-query";
import API from "../../../network/API";
import { 
  FaWallet, 
  FaShoppingCart, 
  FaUsers, 
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaCircle,
  FaChartPie
} from "react-icons/fa";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface AdminStats {
  financials: {
    totalRevenue: string;
    pendingRevenue: string;
    totalTransactions: number;
    successfulPayments: number;
    failedPayments: number;
    totalRefunds: number;
  };
  orders: {
    total: number;
    pending: number;
  };
  users: {
    total: number;
    active24h: number;
  };
  operations: {
    activeRepairs: number;
    lowStockItems: number;
  };
}

function StatCard({ label, value, subValue, icon: Icon, trend }: any) {
  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-sm hover:border-gray-700 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center text-lorryBlue group-hover:bg-lorryBlue group-hover:text-white transition-all duration-300">
          <Icon className="text-xl" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
            trend > 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
          }`}>
            {trend > 0 ? <FaArrowUp /> : <FaArrowDown />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
        <p className="text-xs text-gray-400">{subValue}</p>
      </div>
    </div>
  );
}

export default function AdminDashboardMain() {
  const { data: analyticsRes, isLoading } = useQuery({
    queryKey: ["admin-analytics-overview"],
    queryFn: () => API.get<any>("admin/analytics/overview"),
  });

  if (isLoading || !analyticsRes?.data) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-gray-900 rounded-2xl border border-gray-800" />)}
        </div>
        <div className="h-96 bg-gray-900 rounded-2xl border border-gray-800" />
      </div>
    );
  }

  const { stats, activity, chartData = [] } = analyticsRes.data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Operations Overview</h1>
        <p className="text-gray-500 mt-1 text-sm">Real-time platform performance and financial monitoring.</p>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Treasury Balance (USDC)" 
          value={`$${Number(stats.financials.treasuryBalance).toLocaleString()}`} 
          subValue="Real-time blockchain balance"
          icon={FaWallet}
        />
        <StatCard 
          label="Total Revenue" 
          value={`$${Number(stats.financials.totalRevenue).toLocaleString()}`} 
          subValue={`${stats.financials.successfulPayments} Successful payments`}
          icon={FaShoppingCart}
        />
        <StatCard 
          label="Platform Users" 
          value={stats.users.total} 
          subValue={`${stats.users.active24h} Active last 24h`}
          icon={FaUsers}
        />
        <StatCard 
          label="System Health" 
          value={stats.operations.lowStockItems + stats.operations.activeRepairs} 
          subValue={`${stats.operations.lowStockItems} Low stock items`}
          icon={FaExclamationTriangle}
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-lg font-bold text-white">Revenue Growth</h3>
            <p className="text-xs text-gray-500">Net platform inflows over the last 7 days</p>
          </div>
          <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-lorryBlue">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
        </div>
        
        <div className="h-80 w-full flex items-center justify-center bg-gray-800/20 rounded-xl border border-dashed border-gray-800">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280" 
                  fontSize={10} 
                  tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { weekday: 'short' })}
                />
                <YAxis stroke="#6b7280" fontSize={10} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center">
              <FaChartPie className="text-gray-700 text-3xl mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No revenue data for this period.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Transactions */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
            <button className="text-xs font-bold text-lorryBlue hover:underline">View All</button>
          </div>
          <div className="divide-y divide-gray-800">
            {activity.payments.length > 0 ? (
              activity.payments.map((p: any) => (
                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      p.status === 'completed' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      <FaWallet className="text-sm" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{p.userName}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{p.method}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">${Number(p.amount).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500">
                      {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-10 text-center text-gray-500 text-sm italic">No recent transactions.</div>
            )}
          </div>
        </div>

        {/* System Audit Trail */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Audit Trail</h3>
            <button className="text-xs font-bold text-lorryBlue hover:underline">Full Log</button>
          </div>
          <div className="divide-y divide-gray-800">
            {activity.auditLogs.map((log: any) => (
              <div key={log.id} className="p-4 flex items-center gap-4 hover:bg-gray-800/50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-lorryBlue shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <div className="flex-1">
                  <p className="text-sm text-gray-200">
                    <span className="font-bold text-white">{log.adminName}</span>
                    <span className="mx-1 text-gray-500">performed</span>
                    <span className="text-lorryBlue font-semibold px-2 py-0.5 bg-lorryBlue/10 rounded text-[10px]">{log.action}</span>
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {new Date(log.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {activity.auditLogs.length === 0 && (
              <div className="p-10 text-center text-gray-500 text-sm italic">No recent system activity.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
