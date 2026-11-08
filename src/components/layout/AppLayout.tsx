
import { useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  MessageCircle,
  Menu,
  X,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { logoutUser } from "../../services/auth/authService";

const navigation = [
  {
    label: "WORKSPACE",
    items: [
      {
        name: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
        end: true,
      },
      {
        name: "My Groups",
        path: "/groups",
        icon: Users,
      },
      {
        name: "Messages",
        path: "/chats",
        icon: MessageCircle,
      },
    ],
  },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/groups": "My Groups",
  "/chats": "Messages",
};

const AppLayout = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const currentPath = location.pathname;

  const getPageTitle = () => {
    if (currentPath.startsWith("/groups/")) {
      return "Group Workspace";
    }

    if (currentPath.startsWith("/chats/")) {
      return "Private Conversation";
    }

    return pageTitles[currentPath] || "Workspace";
  };

  const getInitials = () => {
    const name = user?.displayName || user?.email || "User";

    return name
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("");
  };

  const handleLogout = async () => {
    if (loggingOut) return;

    try {
      setLoggingOut(true);
      await logoutUser();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to log out. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const renderNavigation = () => (
    <nav className="app-sidebar-navigation">
      {navigation.map((section) => (
        <div
          key={section.label}
          className="app-nav-section"
        >
          <p className="app-nav-section-label">
            {section.label}
          </p>

          {section.items.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.path === "/dashboard"
                ? currentPath === "/dashboard"
                : item.path === "/groups"
                  ? currentPath.startsWith("/groups")
                  : currentPath.startsWith("/chats");

            return (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.end}
                onClick={closeMobileMenu}
                title={collapsed ? item.name : undefined}
                className={() =>
                  `app-nav-link ${isActive ? "active" : ""} ${
                    collapsed ? "collapsed" : ""
                  }`
                }
              >
                <Icon size={19} strokeWidth={1.9} />

                {!collapsed && (
                  <span>{item.name}</span>
                )}

                {!collapsed && isActive && (
                  <ChevronRight
                    size={15}
                    className="app-nav-chevron"
                  />
                )}
              </NavLink>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <div className="app-layout">
      {mobileMenuOpen && (
        <button
          type="button"
          className="app-mobile-overlay"
          onClick={closeMobileMenu}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`app-sidebar ${
          collapsed ? "is-collapsed" : ""
        } ${mobileMenuOpen ? "mobile-open" : ""}`}
      >
        {/* SIDEBAR BRAND */}

        <div className="app-sidebar-brand">
          <button
            type="button"
            className="app-brand"
            onClick={() => navigate("/dashboard")}
          >
            <span>chapri</span>
            <span className="app-brand-dot">.</span>
          </button>

          <button
            type="button"
            className="app-sidebar-collapse"
            onClick={() =>
              setCollapsed((value) => !value)
            }
            aria-label={
              collapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>

          <button
            type="button"
            className="app-mobile-close"
            onClick={closeMobileMenu}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION */}

        {renderNavigation()}

        {/* SIDEBAR BOTTOM */}

        <div className="app-sidebar-bottom">
          <div className="app-user-card">
            <div className="app-user-avatar">
              {getInitials()}
            </div>

            {!collapsed && (
              <div className="app-user-info">
                <span className="app-user-name">
                  {user?.displayName || "User"}
                </span>

                <span className="app-user-email">
                  {user?.email || ""}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            className="app-logout-button"
            onClick={handleLogout}
            disabled={loggingOut}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut size={18} />

            {!collapsed && (
              <span>
                {loggingOut
                  ? "Logging out..."
                  : "Log out"}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-topbar-left">
            <button
              type="button"
              className="app-mobile-menu-button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>

            <div className="app-breadcrumb">
              <span>Workspace</span>
              <ChevronRight size={14} />
              <strong>{getPageTitle()}</strong>
            </div>
          </div>

          <div className="app-topbar-right">
            <div className="app-topbar-user">
              <div className="app-user-avatar small">
                {getInitials()}
              </div>

              <span>
                {user?.displayName || "User"}
              </span>
            </div>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
