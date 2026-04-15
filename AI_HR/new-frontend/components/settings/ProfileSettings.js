import { Card, Form, Button, Row, Col } from 'react-bootstrap'
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
    <Card>
      <Card.Header>
        <h5 className="mb-0">Profile Information</h5>
      </Card.Header>
      <Card.Body>
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
                  <Form.Group className="mb-3">
                    <Form.Label>Full Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={values.name}
                      onChange={handleChange}
                      isInvalid={touched.name && errors.name}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.name}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={values.email}
                      disabled
                      className="bg-light"
                    />
                    <Form.Text className="text-muted">
                      Email cannot be changed. Contact support if needed.
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Company</Form.Label>
                    <Form.Control
                      type="text"
                      name="company"
                      value={values.company}
                      onChange={handleChange}
                      isInvalid={touched.company && errors.company}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.company}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Phone Number</Form.Label>
                    <Form.Control
                      type="tel"
                      name="phone"
                      value={values.phone}
                      onChange={handleChange}
                      isInvalid={touched.phone && errors.phone}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.phone}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="gradient-btn"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </Card.Body>
    </Card>
  )
}