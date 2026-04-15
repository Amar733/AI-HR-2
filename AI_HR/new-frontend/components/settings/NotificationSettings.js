import { Card, Form } from 'react-bootstrap'
import { useState, useEffect } from 'react'
import { settingsAPI } from '../../services/api'
import { toast } from 'react-toastify'

export default function NotificationSettings({ settings, onUpdate }) {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false
  })

  useEffect(() => {
    if (settings?.preferences?.notifications) {
      setNotifications(settings.preferences.notifications)
    }
  }, [settings])

  const handleChange = async (type, value) => {
    const updatedNotifications = { ...notifications, [type]: value }
    setNotifications(updatedNotifications)

    try {
      await settingsAPI.updateNotifications({ notifications: updatedNotifications })
      onUpdate({ preferences: { notifications: updatedNotifications } })
      toast.success('Notification preferences updated')
    } catch (error) {
      toast.error('Failed to update notifications')
      // Revert on error
      setNotifications(notifications)
    }
  }

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">Notification Preferences</h5>
      </Card.Header>
      <Card.Body>
        <div className="notification-settings">
          <Form.Check
            type="switch"
            id="email-notifications"
            label="Email Notifications"
            checked={notifications.email}
            onChange={(e) => handleChange('email', e.target.checked)}
            className="mb-3"
          />
          <small className="text-muted d-block mb-4">
            Receive email notifications for interview updates and reminders
          </small>

          <Form.Check
            type="switch"
            id="push-notifications"
            label="Push Notifications"
            checked={notifications.push}
            onChange={(e) => handleChange('push', e.target.checked)}
            className="mb-3"
          />
          <small className="text-muted d-block mb-4">
            Receive browser notifications for important updates
          </small>

          <Form.Check
            type="switch"
            id="sms-notifications"
            label="SMS Notifications"
            checked={notifications.sms}
            onChange={(e) => handleChange('sms', e.target.checked)}
            className="mb-3"
          />
          <small className="text-muted d-block">
            Receive text message notifications (charges may apply)
          </small>
        </div>
      </Card.Body>
    </Card>
  )
}