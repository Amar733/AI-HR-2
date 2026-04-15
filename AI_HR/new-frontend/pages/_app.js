import "bootstrap/dist/css/bootstrap.min.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-datepicker/dist/react-datepicker.css";
import "react-toastify/dist/ReactToastify.css";
import "../styles/globals.css";
import { useEffect } from "react";
import { AuthProvider } from "../contexts/AuthContext";
import { LoadingProvider } from "../contexts/LoadingContext";
import { ToastContainer } from "react-toastify";
import Head from "next/head";
import { useRouter } from "next/router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { APP_NAME } from "../utils/constants";

// Configure NProgress
NProgress.configure({ showSpinner: false });

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  useEffect(() => {
    // Import Bootstrap JS
    import("bootstrap/dist/js/bootstrap.bundle.js");

    // Setup router events for loading
    const handleStart = () => NProgress.start();
    const handleStop = () => NProgress.done();

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleStop);
    router.events.on("routeChangeError", handleStop);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleStop);
      router.events.off("routeChangeError", handleStop);
    };
  }, [router]);

  return (
    <>
      <Head>
        <title>{`${APP_NAME} - SaaS Interview Platform`}</title>
        <meta
          name="description"
          content="Complete interview scheduling and management platform"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="theme-color" content="#0f4c81" />
        <link rel="icon" href="/favicon.ico" />
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css"
          rel="stylesheet"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <LoadingProvider>
        <AuthProvider>
          <Component {...pageProps} />
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </AuthProvider>
      </LoadingProvider>
    </>
  );
}

export default MyApp;
