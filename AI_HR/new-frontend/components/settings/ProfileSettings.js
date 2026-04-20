import { Card, Form, Button, Row, Col, InputGroup } from 'react-bootstrap'
import { Formik } from 'formik'
import * as Yup from 'yup'
import { useAuth } from '../../contexts/AuthContext'
import { toast } from 'react-toastify'

const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  company: Yup.string().required('Company is required'),
  phone: Yup.string()
})

export default function ProfileSettings({ settings, onUpdate }) {
  const { user, updateProfile } = useAuth()

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await updateProfile(values)
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-white border-bottom py-3">
        <div className="d-flex align-items-center">
          <i className="bi bi-person-circle text-primary fs-4 me-2"></i>
          <h5 className="mb-0 fw-semibold">Profile Information</h5>
        </div>
        <p className="text-muted small mb-0 mt-1">Update your personal details and contact information</p>
      </Card.Header>
      <Card.Body className="p-4">
        <Formik
          initialValues={{
            name: user?.name || '',
            company: user?.company || '',
            phone: user?.phone || '',
            email: user?.email || ''
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleSubmit, isSubmitting }) => (
            <Form onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">
                      <i className="bi bi-person me-2 text-muted"></i>
                      Full Name
                    </Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        name="name"
                        value={values.name}
                        onChange={handleChange}
                        isInvalid={touched.name && errors.name}
                        placeholder="Enter your full name"
                        className="py-2"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.name}
                      </Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">
                      <i className="bi bi-envelope me-2 text-muted"></i>
                      Email Address
                    </Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="email"
                        name="email"
                        value={values.email}
                        disabled
                        className="bg-light py-2"
                      />
                      <InputGroup.Text className="bg-light">
                        <i className="bi bi-lock-fill text-muted"></i>
                      </InputGroup.Text>
                    </InputGroup>
                    <Form.Text className="text-muted d-flex align-items-center mt-2">
                      <i className="bi bi-info-circle me-1"></i>
                      Email cannot be changed. Contact support if needed.
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">
                      <i className="bi bi-building me-2 text-muted"></i>
                      Company
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="company"
                      value={values.company}
                      onChange={handleChange}
                      isInvalid={touched.company && errors.company}
                      placeholder="Enter your company name"
                      className="py-2"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.company}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">
                      <i className="bi bi-telephone me-2 text-muted"></i>
                      Phone Number
                    </Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={values.phone}
                      onChange={handleChange}
                      isInvalid={touched.phone && errors.phone}
                      placeholder="Enter your phone number"
                      className="py-2"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.phone}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-end gap-2 pt-3 border-top">
                <Button
                  type="button"
                  variant="outline-secondary"
                  disabled={isSubmitting}
                  onClick={() => window.location.reload()}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Reset
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="gradient-btn px-4"
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Save Changes
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