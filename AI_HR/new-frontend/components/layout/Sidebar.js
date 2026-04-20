import { Offcanvas, Nav, Badge } from "react-bootstrap";
import Link from "next/link";
import { useRouter } from "next/router";
import { APP_NAME } from "../../utils/constants";

export default function Sidebar({ show, handleClose, user }) {
  const router = useRouter();

  const navItems = [
    {
      href: "/dashboard",
      icon: "bi-grid",
      label: "Dashboard",
      badge: null,
    },
    {
      href: "/jobs",
      icon: "bi-briefcase",
      label: "Jobs",
      badge: null,
    },

    {
      href: "/wallet",
      icon: "bi-wallet2",
      label: "Wallet",
      //badge: user?.subscription?.status === "trial" ? "Trial" : null,
    },
    {
      href: "/settings",
      icon: "bi-gear",
      label: "Settings",
      badge: null,
    },
  ];

  const isActive = (href) => {
    if (href === "/dashboard") {
      return router.pathname === "/dashboard";
    }
    return router.pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="d-none d-lg-block sidebar-desktop new-sidebar">
        <div className="sidebar-content d-flex flex-column h-100 pb-4">
          
          {/* Navigation */}
          <Nav className="flex-column sidebar-nav-new pt-4">
            {navItems.map((item) => (
              <Nav.Link
                key={item.href}
                as={Link}
                href={item.href}
                className={`sidebar-link ${
                  isActive(item.href) ? "active" : ""
                }`}
              >
                <div className="d-flex align-items-center justify-content-between w-100 px-2">
                  <div className="d-flex align-items-center">
                    <i className={`bi ${isActive(item.href) ? item.icon + '-fill' : item.icon} me-3 fs-5`}></i>
                    <span className="fw-semibold">{item.label}</span>
                  </div>
                  {item.badge && (
                    <Badge
                      bg={item.badge === "Trial" ? "warning" : "primary"}
                      pill
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
              </Nav.Link>
            ))}
            {user?.role == "admin" && (
              <Nav.Link
                href={"/admin-dashboard"}
                className={`sidebar-link ${
                  isActive("/admin-dashboard") ? "active" : ""
                }`}
              >
                <div className="d-flex align-items-center justify-content-between w-100 px-2">
                  <div className="d-flex align-items-center">
                    <i className={`bi ${isActive("/admin-dashboard") ? "bi-speedometer-fill" : "bi-speedometer"} me-3 fs-5`}></i>
                    <span className="fw-semibold">Admin Dashboard</span>
                  </div>
                </div>
              </Nav.Link>
            )}
          </Nav>

          <div className="mt-auto"></div>

          {/* User Info (Bottom) */}
          <div className="sidebar-user-badge">
            <div className="d-flex align-items-center">
              {user?.avatar ? (
                <img src={user.avatar} alt="User Avatar" className="avatar-img shadow-sm" />
              ) : (
                <div className="user-avatar shadow-sm" style={{ width: '45px', height: '45px', fontSize: '18px' }}>
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
              <div className="user-details">
                <p className="user-name-text">{user?.name || "Alex Rivera"}</p>
                <p className="user-role-text">{user?.role || "Senior Partner"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Offcanvas */}
      <Offcanvas
        show={show}
        onHide={handleClose}
        placement="start"
        className="sidebar-offcanvas d-lg-none"
      >
        <Offcanvas.Header closeButton className="border-bottom py-3">
          <Offcanvas.Title>
            <div className="d-flex align-items-center">
              <span className="brand-title fw-bold fs-4">{APP_NAME}</span>
            </div>
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body className="p-0">
          {/* Mobile User Info */}
          <div className="p-4 border-bottom bg-light">
            <div className="d-flex align-items-center">
              <div className="user-avatar me-3 shadow-sm" style={{ width: '50px', height: '50px', fontSize: '20px', background: '#000', color: '#fff' }}>
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-grow-1">
                <div className="fw-bold fs-6">{user?.name || "User"}</div>
                <div className="text-muted small" style={{ letterSpacing: '0.02em' }}>
                  {user?.company || "Company"}
                </div>
              </div>
            </div>
          </div>

          <Nav className="flex-column py-2">
            {navItems.map((item) => (
              <Nav.Link
                key={item.href}
                as={Link}
                href={item.href}
                className={`px-4 py-3 border-0 d-flex align-items-center justify-content-between ${
                  isActive(item.href) ? "bg-light text-dark fw-bold border-start border-4 border-dark" : "text-secondary fw-semibold"
                }`}
                onClick={handleClose}
                style={{ transition: 'all 0.2s' }}
              >
                <div className="d-flex align-items-center">
                  <i className={`bi ${isActive(item.href) ? item.icon + '-fill' : item.icon} me-3 fs-5 ${isActive(item.href) ? 'text-dark' : ''}`}></i>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge
                    bg={item.badge === "Trial" ? "warning" : "dark"}
                    pill
                  >
                    {item.badge}
                  </Badge>
                )}
              </Nav.Link>
            ))}
          </Nav>

          {/* Mobile Upgrade Banner */}
          {user?.subscription?.status === "trial" && (
            <div className="p-1">
              <div className="upgrade-banner text-center p-4 shadow-lg" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '20px' }}>
                <div className="bg-warning text-dark d-inline-flex rounded-circle p-2 mb-3 shadow-sm">
                  <i className="bi bi-stars fs-4"></i>
                </div>
                <h6 className="fw-bold text-white mb-2">Elevate to Premium</h6>
                <p className="text-white-50 small mb-4 px-2">
                  Unlock unlimited AI interviews and advanced candidate insights.
                </p>
                <Link href="/payments" className="btn btn-warning fw-bold text-dark w-100 py-2 shadow-sm" style={{ borderRadius: '12px' }}>
                  Upgrade Now
                </Link>
              </div>
            </div>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}
