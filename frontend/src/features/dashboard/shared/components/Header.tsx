import { useLocation, Link } from "react-router-dom";
import { getStoredUser } from "../../../../network/auth";
import { FaShieldAlt } from "react-icons/fa";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { pathname } = useLocation();
  const user = getStoredUser();
  const isAdmin = user?.role === "admin";

  let title = "Dashboard";
  if (pathname === "/dashboard")                                title = "Overview";
  else if (pathname === "/dashboard/users")                     title = "Users";
  else if (pathname === "/dashboard/profile")                   title = "Profile";
  else if (pathname === "/dashboard/laptops")                   title = "Laptops";
  else if (pathname === "/dashboard/system-requests")           title = "System Requests";
  else if (pathname.startsWith("/dashboard/system-requests/")) title = "Request Details";
  else if (pathname === "/dashboard/orders")         title = "Orders";
  else if (pathname === "/dashboard/repairs")        title = "Repairs";
  else if (pathname === "/dashboard/notifications")  title = "Notifications";

  return (
    <header className="h-16 bg-white border-b border-inputBorderGrey flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      <div className="flex items-center">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden mr-3 p-1.5 rounded-lg text-lorryDarkBlack hover:bg-offWhiteBackground transition-colors"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <h2 className="text-base font-semibold text-lorryDarkBlack">{title}</h2>
      </div>

      <div className="flex items-center space-x-4">
        {isAdmin && (
          <Link 
            to="/admin" 
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black transition-all shadow-sm"
          >
            <FaShieldAlt className="text-lorryBlue" />
            Admin Ops
          </Link>
        )}
        {user?.fullName && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-lorryDarkBlack">{user.fullName}</span>
              <span className="text-[10px] text-inputGrey uppercase tracking-wider">{user.role}</span>
            </div>
            <div className="w-9 h-9 bg-pageWhite border border-inputBorderGrey rounded-full flex items-center justify-center text-lorryBlue font-bold shadow-sm">
              {user.fullName.charAt(0)}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
