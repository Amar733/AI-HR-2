import { Toast as BsToast, ToastContainer } from "react-bootstrap";
import { useState, useEffect } from "react";

export default function Toast({
  show,
  message,
  type = "success",
  onClose,
  delay = 4000,
}) {
  const [showToast, setShowToast] = useState(show);

  useEffect(() => {
    setShowToast(show);
  }, [show]);

  const handleClose = () => {
    setShowToast(false);
    onClose && onClose();
  };

  const getToastClass = () => {
    switch (type) {
      case "success":
        return "bg-success text-white";
      case "error":
        return "bg-danger text-white";
      case "warning":
        return "bg-warning text-dark";
      case "info":
        return "bg-info text-white";
      default:
        return "bg-success text-white";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return "bi-check-circle-fill";
      case "error":
        return "bi-x-circle-fill";
      case "warning":
        return "bi-exclamation-triangle-fill";
      case "info":
        return "bi-info-circle-fill";
      default:
        return "bi-check-circle-fill";
    }
  };

  const getTitle = () => {
    switch (type) {
      case "success":
        return "Success";
      case "error":
        return "Error";
      case "warning":
        return "Warning";
      case "info":
        return "Info";
      default:
        return "Notification";
    }
  };

  return (
    <ToastContainer
      position="top-center"
      className="p-3 toast-container-custom"
      style={{ zIndex: 9999 }}
    >
      <BsToast
        show={showToast}
        onClose={handleClose}
        delay={delay}
        autohide={delay > 0}
        className={`${getToastClass()} border-0 shadow-lg`}
      >
        <BsToast.Header className="bg-transparent border-0">
          <div className="d-flex align-items-center">
            <i className={`bi ${getIcon()} me-2`}></i>
            <strong className="me-auto">{getTitle()}</strong>
          </div>
        </BsToast.Header>
        <BsToast.Body className="pt-0">{message}</BsToast.Body>
      </BsToast>
    </ToastContainer>
  );
}
