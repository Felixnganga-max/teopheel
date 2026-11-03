// frontend/src/components/layout/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  MessageSquare,
  Users,
  MapPin,
  FileText,
  Tag,
  Repeat,
  LogOut,
  Flame,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const baseLinks = [
  { to: "/sales", label: "New Sale", icon: ShoppingCart },
  { to: "/orders", label: "Orders", icon: ClipboardList },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/customers", label: "Customers", icon: Users },
];

const ownerLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ...baseLinks,
  { to: "/products", label: "Gas Brands", icon: Tag },
  { to: "/mix-brands", label: "Mix Brands", icon: Repeat },
  { to: "/locations", label: "Locations", icon: MapPin },
];

const salesLinks = baseLinks;

export default function Sidebar({ onNavigate }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const branchId = user?.location?._id || user?.location;
  const links = user?.role === "owner" ? ownerLinks : branchId ? [...salesLinks, { to: `/branches/${branchId}`, label: "My Branch", icon: MapPin }] : salesLinks;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
    if (onNavigate) onNavigate(); // Close drawer on logout
  };

  const handleNavClick = () => {
    if (onNavigate) onNavigate(); // Close drawer when any link is clicked
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-shell flex flex-col z-40">
      <div className="px-6 py-7 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Flame className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg tracking-tight">
              LPG Ops
            </h1>
            <p className="text-steel-light text-xs">Gas Distribution</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? "text-accent bg-accent/10"
                  : "text-steel-light hover:text-white hover:bg-white/5"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-accent rounded-r-full" />
                )}
                <link.icon className="w-[18px] h-[18px]" />
                {link.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-5 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-sm">
            {user?.name?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.name}
            </p>
            <p className="text-steel-light text-xs">{user?.title}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-steel-light hover:text-white hover:bg-white/5 text-sm transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
