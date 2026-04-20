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
        <Offcanvas.Header closeButton className="border-bottom">
          <Offcanvas.Title>
            <div className="d-flex align-items-center">
              <span className="gradient-text fw-bold fs-5">{APP_NAME}</span>
            </div>
          </Offcanvas.Title>
        </Offcanvas.Header>

        <Offcanvas.Body className="p-0">
          {/* Mobile User Info */}
          <div className="sidebar-user-info p-3 border-bottom">
            <div className="d-flex align-items-center">
              <div className="user-avatar me-3">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-grow-1">
                <div className="fw-semibold">{user?.name || "User"}</div>
                <small className="text-muted">
                  {user?.company || "Company"}
                </small>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <Nav className="flex-column">
            {navItems.map((item) => (
              <Nav.Link
                key={item.href}
                as={Link}
                href={item.href}
                className={`sidebar-nav-link ${
                  isActive(item.href) ? "active" : ""
                }`}
                onClick={handleClose}
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <i className={`bi ${item.icon} me-3`}></i>
                    <span>{item.label}</span>
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
          </Nav>

          {/* Mobile Upgrade Banner */}
          {user?.subscription?.status === "trial" && (
            <div className="p-3">
              <div className="upgrade-banner text-center p-3">
                <i className="bi bi-star text-warning fs-4 mb-2"></i>
                <h6 className="fw-semibold">Upgrade to Pro</h6>
                <p className="small text-muted mb-3">
                  Unlock unlimited interviews
                </p>
                <Link href="/payments" className="btn btn-warning btn-sm w-100">
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
