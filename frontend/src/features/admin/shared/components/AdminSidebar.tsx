import { NavLink, Link } from "react-router-dom";
import { 
  FaChartPie, 
  FaUsers, 
  FaShoppingCart, 
  FaWallet, 
  FaBoxes, 
  FaWrench, 
  FaShieldAlt,
  FaCog,
  FaSignOutAlt,
  FaArrowLeft
} from "react-icons/fa";
import { clearAuthData } from "../../../../network/auth";
import { useNavigate } from "react-router-dom";

interface SidebarItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
}

function SidebarItem({ to, icon: Icon, label }: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
          isActive
            ? "bg-lorryBlue text-white shadow-lg shadow-lorryBlue/20"
            : "text-gray-400 hover:bg-gray-800 hover:text-white"
        }`
      }
    >
      <Icon className="text-lg group-hover:scale-110 transition-transform" />
      <span className="font-medium">{label}</span>
    </NavLink>
  );
}

export default function AdminSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuthData();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-gray-900 border-r border-gray-800 z-50 transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6">
            <Link to="/dashboard" className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-white transition-colors mb-6 group">
              <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
              Back to User App
            </Link>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-lorryBlue rounded-xl flex items-center justify-center shadow-lg shadow-lorryBlue/20">
                <FaShieldAlt className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg leading-none">Tek247</h1>
                <span className="text-lorryBlue text-[10px] font-bold uppercase tracking-wider">Operations</span>
              </div>
            </div>

            {/* Nav Groups */}
            <nav className="space-y-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-2">Main</p>
              <SidebarItem to="/admin" icon={FaChartPie} label="Overview" />
              <SidebarItem to="/admin/finances" icon={FaWallet} label="Finances" />
              
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-2 mt-6">Management</p>
              <SidebarItem to="/admin/orders" icon={FaShoppingCart} label="Orders" />
              <SidebarItem to="/admin/users" icon={FaUsers} label="Users" />
              <SidebarItem to="/admin/inventory" icon={FaBoxes} label="Inventory" />
              <SidebarItem to="/admin/repairs" icon={FaWrench} label="Repairs" />
              
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-4 mb-2 mt-6">System</p>
              <SidebarItem to="/admin/audit-logs" icon={FaShieldAlt} label="Audit Logs" />
              <SidebarItem to="/admin/settings" icon={FaCog} label="Settings" />
            </nav>
          </div>

          {/* Footer */}
          <div className="mt-auto p-6 border-t border-gray-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all duration-200"
            >
              <FaSignOutAlt />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
