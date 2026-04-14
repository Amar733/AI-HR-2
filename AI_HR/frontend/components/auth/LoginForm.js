import { Card, Form, Button, Alert } from "react-bootstrap";
import { Formik } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import { APP_NAME } from "../../utils/constants";

const validationSchema = Yup.object({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function LoginForm({
  onSuccess,
  onSwitchToSignup,
  onShowToast,
}) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError("");
      setIsLoading(true);
      await login(values);
      onShowToast("Welcome back! Login successful.", "success");
      onSuccess();
    } catch (err) {
      setError(err.message || "Invalid email or password");
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
          <h1 className="h3 mb-2 gradient-text">Welcome Back</h1>
          <p className="text-muted">{`Sign in to your ${APP_NAME} account`}</p>
        </div>

        {error && (
          <Alert variant="danger" className="alert-custom">
            <i className="bi bi-exclamation-circle me-2"></i>
            {error}
          </Alert>
        )}

        <Formik
          initialValues={{ email: "", password: "", rememberMe: false }}
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

              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <div className="input-group-custom">
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={values.password}
                    onChange={handleChange}
                    isInvalid={touched.password && errors.password}
                    placeholder="Enter your password"
                    className="form-control-custom"
                  />
                  {/* Left lock icon */}
                  <div className="input-icon">
                    <i className="bi bi-lock"></i>
                  </div>
                  {/* Right eye toggle */}
                  <div
                    className="input-icon end-icon"
                    style={{ cursor: "pointer" }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i
                      className={`bi ${
                        showPassword ? "bi-eye-slash" : "bi-eye"
                      }`}
                    ></i>
                  </div>
                </div>
                <Form.Control.Feedback type="invalid">
                  {errors.password}
                </Form.Control.Feedback>
              </Form.Group>

              <div className="d-flex justify-content-between align-items-center mb-4">
                <Form.Group className="mb-0">
                  <Form.Check
                    type="checkbox"
                    name="rememberMe"
                    label="Remember me"
                    checked={values.rememberMe}
                    onChange={handleChange}
                  />
                </Form.Group>
                <Link
                  variant="link"
                  className="p-0 text-decoration-none text-primary"
                  href="/forget-password"
                >
                  Forgot password?
                </Link>
              </div>

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
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Sign In
                  </>
                )}
              </Button>
            </Form>
          )}
        </Formik>

        <div className="text-center mt-4">
          <p className="mb-0 text-muted">
            Don't have an account?{" "}
            <Button
              variant="link"
              className="p-0 gradient-text fw-semibold text-decoration-none"
              onClick={onSwitchToSignup}
            >
              Sign up here
            </Button>
          </p>
        </div>
      </Card.Body>
    </Card>
  );
}
