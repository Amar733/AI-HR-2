import { Card, Form, Button } from 'react-bootstrap'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'

const validationSchema = Yup.object({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
    .required('Confirm password is required')
})

export default function SecuritySettings() {
  const { changePassword } = useAuth()

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      })
      toast.success('Password changed successfully!')
      resetForm()
    } catch (error) {
      toast.error(error.message || 'Failed to change password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">Change Password</h5>
      </Card.Header>
      <Card.Body>
        <Formik
          initialValues={{
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleSubmit, isSubmitting }) => (
            <Form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
              <Form.Group className="mb-3">
                <Form.Label>Current Password</Form.Label>
                <Form.Control
                  type="password"
                  name="currentPassword"
                  value={values.currentPassword}
                  onChange={handleChange}
                  isInvalid={touched.currentPassword && errors.currentPassword}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.currentPassword}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>New Password</Form.Label>
                <Form.Control
                  type="password"
                  name="newPassword"
                  value={values.newPassword}
                  onChange={handleChange}
                  isInvalid={touched.newPassword && errors.newPassword}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.newPassword}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label>Confirm New Password</Form.Label>
                <Form.Control
                  type="password"
                  name="confirmPassword"
                  value={values.confirmPassword}
                  onChange={handleChange}
                  isInvalid={touched.confirmPassword && errors.confirmPassword}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.confirmPassword}
                </Form.Control.Feedback>
              </Form.Group>

              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="gradient-btn"
              >
                {isSubmitting ? 'Changing Password...' : 'Change Password'}
              </Button>
            </Form>
          )}
        </Formik>
      </Card.Body>
    </Card>
  )
}