import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Container, Row, Col, Button } from "react-bootstrap";
import ForgetPassword from "../components/auth/ForgetPassword";
import { useAuth } from "../contexts/AuthContext";
import { useLoading } from "../contexts/LoadingContext";
import Toast from "../components/ui/Toast";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Head from "next/head";
import { APP_NAME } from "../utils/constants";

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const { user, loading } = useAuth();
  const { isLoading } = useLoading();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  if (loading || isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Head>
        <title>{`${isLogin ? "Sign In" : "Sign Up"} | ${APP_NAME}`}</title>
        <meta
          name="description"
          content={`Sign in to your ${APP_NAME} account to manage interviews and candidates`}
        />
      </Head>

      <div className="auth-page">
        <Container fluid className="min-vh-100">
          <Row className="min-vh-100 align-items-center">
            <Col lg={3} xs={12}></Col>
            <Col
              lg={6}
              xs={12}
              className="d-flex align-items-center justify-content-center p-4 p-lg-5"
            >
              <div className="w-100 auth-form-container">
                <div className="auth-form-wrapper">
                  <ForgetPassword
                    onSuccess={() => router.push("/reset-password")}
                    onShowToast={showToast}
                  />
                </div>
              </div>
            </Col>
            <Col lg={3} xs={12}></Col>
          </Row>
        </Container>

        <Toast
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      </div>
    </>
  );
}
