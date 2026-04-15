import { Spinner } from 'react-bootstrap'

export default function LoadingSpinner({ 
  size = 'lg', 
  text = 'Loading...', 
  fullScreen = true,
  variant = 'primary'
}) {
  const content = (
    <div className="d-flex flex-column align-items-center">
      <Spinner animation="border" variant={variant} size={size} />
      {text && <div className="mt-3 text-muted">{text}</div>}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="loading-spinner-fullscreen">
        <div className="loading-spinner-content">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="text-center py-5">
      {content}
    </div>
  )
}