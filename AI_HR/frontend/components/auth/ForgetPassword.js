import { Card, Form, Button, Alert } from "react-bootstrap";
import { Formik } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import axios from "axios";
import Link from "next/link";
const validationSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
});

export default function ForgetPassword({ onSuccess, onShowToast }) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError("");
      setIsLoading(true);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`,
        values,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        onShowToast("We have sent OTP to your registered email", "success");
        onSuccess();
      } else {
        setError("Something went wrong");
      }
    } catch (err) {
      setError(err.message || "Invalid email");
      onShowToast(err.message || "Login failed", "error");
    } finally {
      setSubmitting(false);
      setIsLoading(false);
    }
  };

  return (
    <Card className="auth-card shadow-lg">
      <Card.Body className="p-4 p-md-5">
        <div className="text-center mb-4">
          <h1 className="h3 mb-2 gradient-text">Forgot Your Password?</h1>
          <p className="text-muted">
            Enter your registered email address, and we'll send you a one-time
            password (OTP) to reset it.
          </p>
        </div>

        {error && (
          <Alert variant="danger" className="alert-custom">
            <i className="bi bi-exclamation-circle me-2"></i>
            {error}
          </Alert>
        )}

        <Formik
          initialValues={{ email: "" }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleSubmit,
            isSubmitting,
          }) => (
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Email Address</Form.Label>
                <div className="input-group-custom">
                  <Form.Control
                    type="email"
                    name="email"
                    value={values.email}
                    onChange={handleChange}
                    isInvalid={touched.email && errors.email}
                    placeholder="Enter your email"
                    className="form-control-custom"
                  />
                  <div className="input-icon">
                    <i className="bi bi-envelope"></i>
                  </div>
                </div>
                <Form.Control.Feedback type="invalid">
                  {errors.email}
                </Form.Control.Feedback>
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                className="w-100 gradient-btn py-3"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting || isLoading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    Wait...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Proceeed
                  </>
                )}
              </Button>
            </Form>
          )}
        </Formik>

        <div className="text-center mt-4">
          <p className="mb-0 text-muted">
            Already have an account?{" "}
            <Link
              variant="link"
              className="p-0 gradient-text fw-semibold text-decoration-none"
              href="/"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </Card.Body>
    </Card>
  );
}
