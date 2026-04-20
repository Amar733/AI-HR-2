import { Modal as BsModal, Button } from 'react-bootstrap'
import { useEffect } from 'react'

export default function Modal({
  show,
  onHide,
  title,
  children,
  size = 'lg',
  centered = true,
  backdrop = 'static',
  keyboard = true,
  showCloseButton = true,
  footer,
  className = ''
}) {
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [show])

  return (
    <BsModal
      show={show}
      onHide={onHide}
      size={size}
      centered={centered}
      backdrop={backdrop}
      keyboard={keyboard}
      className={`custom-modal ${className}`}
    >
      {title && (
        <BsModal.Header closeButton={showCloseButton} className="border-0 pb-0">
          <BsModal.Title className="modal-title-custom">
            {typeof title === 'string' ? (
              <h5 className="mb-0">{title}</h5>
            ) : (
              title
            )}
          </BsModal.Title>
        </BsModal.Header>
      )}

      <BsModal.Body className="px-4 pb-4">
        {children}
      </BsModal.Body>

      {footer && (
        <BsModal.Footer className="border-0 pt-0">
          {footer}
        </BsModal.Footer>
      )}
    </BsModal>
  )
}