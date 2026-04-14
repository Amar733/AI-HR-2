import { useState } from "react";
import { useRouter } from "next/router";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import Link from "next/link";
import {
  Container,
  Card,
  Form as BSForm,
  Button,
  Alert,
} from "react-bootstrap";

export default function ResetPassword({ onSuccess, onShowToast }) {
  const router = useRouter();
  const { token } = router.query;
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // State for show/hide password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validationSchema = Yup.object({
    password: Yup.string()
      .min(8, "Password must be at least 8 characters")
      .required("New password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password"), null], "Passwords must match")
      .required("Confirm password is required"),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (!token) {
        return onShowToast("Token not provided", "error");
      }
      setError("");
      setSubmitting(true);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password/${token}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      );

      const data = await response.json();

      if (response.ok) {
        onShowToast("Your password has been updated", "success");
        onSuccess(); // e.g., navigate to next step
      } else {
        setError(data.message || "Something went wrong");
        onShowToast(data.message || "Failed to send OTP", "error");
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
      onShowToast(err.message || "Failed to send OTP", "error");
    } finally {
      setSubmitting(false);
      setIsLoading(false);
    }
  };

  return (
    <Container className="min-vh-100 d-flex align-items-center justify-content-center">
      <Card
        className="p-4 p-md-5 shadow-lg w-100"
        style={{ maxWidth: "500px" }}
      >
        <Card.Body>
          <h3 className="mb-3 text-center gradient-text">Reset Password</h3>
          <p className="text-muted text-center mb-4">
            Enter your new password below
          </p>

          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          <Formik
            initialValues={{ password: "", confirmPassword: "" }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, handleChange, touched, errors, isSubmitting }) => (
              <Form>
                {/* New Password */}
                <BSForm.Group className="mb-3">
                  <BSForm.Label>New Password</BSForm.Label>
                  <div className="input-group-custom">
                    <BSForm.Control
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={values.password}
                      onChange={handleChange}
                      isInvalid={touched.password && errors.password}
                      placeholder="Enter new password"
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
                  <BSForm.Control.Feedback type="invalid">
                    {errors.password}
                  </BSForm.Control.Feedback>
                </BSForm.Group>

                {/* Confirm Password */}
                <BSForm.Group className="mb-4">
                  <BSForm.Label>Confirm New Password</BSForm.Label>
                  <div className="input-group-custom">
                    <BSForm.Control
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={values.confirmPassword}
                      onChange={handleChange}
                      isInvalid={
                        touched.confirmPassword && errors.confirmPassword
                      }
                      placeholder="Confirm new password"
                      className="form-control-custom"
                    />
                    {/* Left lock icon */}
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
                  <BSForm.Control.Feedback type="invalid">
                    {errors.confirmPassword}
                  </BSForm.Control.Feedback>
                </BSForm.Group>

                <Button
                  type="submit"
                  className="w-100 gradient-btn py-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Resetting..." : "Reset Password"}
                </Button>
              </Form>
            )}
          </Formik>

          <div className="text-center mt-4">
            <p className="mb-0 text-muted">
              Already have an account?{" "}
              <Link
                href="/"
                className="p-0 gradient-text fw-semibold text-decoration-none"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </Card.Body>
      </Card>

      {/* CSS for input icons */}
      <style jsx>{`
        .input-group-custom {
          position: relative;
        }
        .input-icon {
          position: absolute;
          top: 50%;
          left: 10px;
          transform: translateY(-50%);
          color: #6c757d;
        }
        .input-icon.end-icon {
          left: auto;
          right: 10px;
        }
        .form-control-custom {
          padding-left: 40px;
          padding-right: 40px;
        }
      `}</style>
    </Container>
  );
}
