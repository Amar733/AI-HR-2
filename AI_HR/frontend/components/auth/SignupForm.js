import { Card, Form, Button, Alert, ProgressBar } from "react-bootstrap";
import { Formik } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { APP_NAME } from "../../utils/constants";

const validationSchema = Yup.object({
  name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .required("Name is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  company: Yup.string()
    .min(2, "Company name must be at least 2 characters")
    .required("Company is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/(?=.*[a-z])/, "Password must contain a lowercase letter")
    .matches(/(?=.*[A-Z])/, "Password must contain an uppercase letter")
    .matches(/(?=.*\d)/, "Password must contain a number")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Confirm password is required"),
  terms: Yup.boolean().oneOf(
    [true],
    "You must accept the terms and conditions"
  ),
});

export default function SignupForm({
  onSuccess,
  onSwitchToLogin,
  onShowToast,
}) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // inside SignupForm component
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signup } = useAuth();

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError("");
      setIsLoading(true);
      await signup(values);
      onShowToast("Account created successfully! Please sign in.", "success");
      onSuccess();
    } catch (err) {
      setError(err.message || "Failed to create account. Please try again.");
      onShowToast(err.message || "Signup failed", "error");
    } finally {
      setSubmitting(false);
      setIsLoading(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: "", color: "secondary" };

    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/(?=.*[a-z])/.test(password)) strength += 25;
    if (/(?=.*[A-Z])/.test(password)) strength += 25;
    if (/(?=.*\d)/.test(password)) strength += 25;

    if (strength <= 25) return { strength, label: "Weak", color: "danger" };
    if (strength <= 50) return { strength, label: "Fair", color: "warning" };
    if (strength <= 75) return { strength, label: "Good", color: "info" };
    return { strength, label: "Strong", color: "success" };
  };

  return (
    <Card className="auth-card shadow-lg">
      <Card.Body className="p-4 p-md-5">
        <div className="text-center mb-4">
          <h1 className="h3 mb-2 gradient-text">Create Account</h1>
          <p className="text-muted">
            {`Join ${APP_NAME} and streamline your hiring process`}
          </p>
        </div>

        {error && (
          <Alert variant="danger" className="alert-custom">
            <i className="bi bi-exclamation-circle me-2"></i>
            {error}
          </Alert>
        )}

        <Formik
          initialValues={{
            name: "",
            email: "",
            company: "",
            password: "",
            confirmPassword: "",
            terms: false,
          }}
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
          }) => {
            const passwordStrength = getPasswordStrength(values.password);

            return (
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Full Name</Form.Label>
                  <div className="input-group-custom">
                    <Form.Control
                      type="text"
                      name="name"
                      value={values.name}
                      onChange={handleChange}
                      isInvalid={touched.name && errors.name}
                      placeholder="Enter your full name"
                      className="form-control-custom"
                    />
                    <div className="input-icon">
                      <i className="bi bi-person"></i>
                    </div>
                  </div>
                  <Form.Control.Feedback type="invalid">
                    {errors.name}
                  </Form.Control.Feedback>
                </Form.Group>

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
                  <Form.Label>Company Name</Form.Label>
                  <div className="input-group-custom">
                    <Form.Control
                      type="text"
                      name="company"
                      value={values.company}
                      onChange={handleChange}
                      isInvalid={touched.company && errors.company}
                      placeholder="Enter your company name"
                      className="form-control-custom"
                    />
                    <div className="input-icon">
                      <i className="bi bi-building"></i>
                    </div>
                  </div>
                  <Form.Control.Feedback type="invalid">
                    {errors.company}
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
                      placeholder="Create a password"
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
                  {values.password && (
                    <div className="password-strength mt-2">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <small>Password strength:</small>
                        <small className={`text-${passwordStrength.color}`}>
                          {passwordStrength.label}
                        </small>
                      </div>
                      <ProgressBar
                        now={passwordStrength.strength}
                        variant={passwordStrength.color}
                        style={{ height: "4px" }}
                      />
                    </div>
                  )}
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password</Form.Label>
                  <div className="input-group-custom">
                    <Form.Control
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={values.confirmPassword}
                      onChange={handleChange}
                      isInvalid={
                        touched.confirmPassword && errors.confirmPassword
                      }
                      placeholder="Confirm your password"
                      className="form-control-custom"
                    />
                    {/* Left lock-fill icon */}
                    <div className="input-icon">
                      <i className="bi bi-lock-fill"></i>
                    </div>
                    {/* Right eye toggle */}
                    <div
                      className="input-icon end-icon"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      <i
                        className={`bi ${
                          showConfirmPassword ? "bi-eye-slash" : "bi-eye"
                        }`}
                      ></i>
                    </div>
                  </div>
                  <Form.Control.Feedback type="invalid">
                    {errors.confirmPassword}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Check
                    type="checkbox"
                    name="terms"
                    checked={values.terms}
                    onChange={handleChange}
                    isInvalid={touched.terms && errors.terms}
                    label={
                      <span>
                        I agree to the{" "}
                        <Button
                          variant="link"
                          className="p-0 text-decoration-none"
                        >
                          Terms of Service
                        </Button>{" "}
                        and{" "}
                        <Button
                          variant="link"
                          className="p-0 text-decoration-none"
                        >
                          Privacy Policy
                        </Button>
                      </span>
                    }
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.terms}
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
                      Creating account...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-plus me-2"></i>
                      Create Account
                    </>
                  )}
                </Button>
              </Form>
            );
          }}
        </Formik>

        <div className="text-center mt-4">
          <p className="mb-0 text-muted">
            Already have an account?{" "}
            <Button
              variant="link"
              className="p-0 gradient-text fw-semibold text-decoration-none"
              onClick={onSwitchToLogin}
            >
              Sign in here
            </Button>
          </p>
        </div>
      </Card.Body>
    </Card>
  );
}
