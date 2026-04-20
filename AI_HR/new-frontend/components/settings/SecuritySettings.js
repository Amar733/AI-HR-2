import { Card, Form, Button, Alert } from 'react-bootstrap'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'
import { useState } from 'react'

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
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

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

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }))
  }

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white border-bottom py-3">
        <div className="d-flex align-items-center">
          <i className="bi bi-shield-lock text-dark fs-4 me-2"></i>
          <h5 className="mb-0 fw-bold">Change Password</h5>
        </div>
        <p className="text-muted small mb-0 mt-1">Keep your account secure with a strong password</p>
      </Card.Header>
      <Card.Body className="p-4">
        <Alert variant="light" className="d-flex align-items-start border shadow-sm mb-4" style={{ background: '#f8fafc', borderRadius: '12px' }}>
          <i className="bi bi-info-circle-fill me-2 mt-1"></i>
          <div>
            <strong>Password Requirements:</strong>
            <ul className="mb-0 mt-2 small">
              <li>At least 8 characters long</li>
              <li>Include uppercase and lowercase letters</li>
              <li>Include numbers and special characters</li>
            </ul>
          </div>
        </Alert>

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
            <Form onSubmit={handleSubmit} style={{ maxWidth: '500px' }}>
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">
                  <i className="bi bi-lock me-2 text-muted"></i>
                  Current Password
                </Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type={showPasswords.current ? "text" : "password"}
                    name="currentPassword"
                    value={values.currentPassword}
                    onChange={handleChange}
                    isInvalid={touched.currentPassword && errors.currentPassword}
                    placeholder="Enter your current password"
                    className="py-2 pe-5"
                  />
                  <Button
                    variant="link"
                    className="position-absolute end-0 top-50 translate-middle-y text-muted"
                    onClick={() => togglePasswordVisibility('current')}
                    style={{ border: 'none', background: 'none' }}
                  >
                    <i className={`bi ${showPasswords.current ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </Button>
                  <Form.Control.Feedback type="invalid">
                    {errors.currentPassword}
                  </Form.Control.Feedback>
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">
                  <i className="bi bi-key me-2 text-muted"></i>
                  New Password
                </Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type={showPasswords.new ? "text" : "password"}
                    name="newPassword"
                    value={values.newPassword}
                    onChange={handleChange}
                    isInvalid={touched.newPassword && errors.newPassword}
                    placeholder="Enter your new password"
                    className="py-2 pe-5"
                  />
                  <Button
                    variant="link"
                    className="position-absolute end-0 top-50 translate-middle-y text-muted"
                    onClick={() => togglePasswordVisibility('new')}
                    style={{ border: 'none', background: 'none' }}
                  >
                    <i className={`bi ${showPasswords.new ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </Button>
                  <Form.Control.Feedback type="invalid">
                    {errors.newPassword}
                  </Form.Control.Feedback>
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">
                  <i className="bi bi-check-circle me-2 text-muted"></i>
                  Confirm New Password
                </Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type={showPasswords.confirm ? "text" : "password"}
                    name="confirmPassword"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    isInvalid={touched.confirmPassword && errors.confirmPassword}
                    placeholder="Confirm your new password"
                    className="py-2 pe-5"
                  />
                  <Button
                    variant="link"
                    className="position-absolute end-0 top-50 translate-middle-y text-muted"
                    onClick={() => togglePasswordVisibility('confirm')}
                    style={{ border: 'none', background: 'none' }}
                  >
                    <i className={`bi ${showPasswords.confirm ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </Button>
                  <Form.Control.Feedback type="invalid">
                    {errors.confirmPassword}
                  </Form.Control.Feedback>
                </div>
              </Form.Group>

              <div className="d-flex gap-2 pt-3 border-top">
                <Button
                  type="submit"
                  variant="dark"
                  disabled={isSubmitting}
                  className="px-4 fw-bold"
                  style={{ borderRadius: '8px' }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-shield-lock me-2"></i>
                      Change Password
                    </>
                  )}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </Card.Body>
    </Card>
  )
}