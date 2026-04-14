const nodemailer = require("nodemailer");
const APP_NAME = process.env.APP_NAME || process.env.NEXT_PUBLIC_APP_NAME || "AI Interview";

// Create reusable transporter
let transporter;

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function linkifyAndEncodeUrls(text) {
  // regex matches http(s) urls (basic)
  const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/gi;

  return text.replace(urlRegex, (url) => {
    // Keep a readable display, but use encoded href
    // If the URL already contains encoded characters, encodeURI will preserve them safely
    const href = encodeURI(url);
    const display = escapeHtml(url);
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${display}</a>`;
  });
}

function convertTextToHtml(text = "") {
  if (!text) return "";

  // 1) sanitize entire text
  const safe = escapeHtml(text);

  // 2) convert sanitized text back to html with paragraphs while preserving URLs
  // We'll split by two or more newlines into paragraphs
  const paragraphs = safe.split(/\n{2,}/g).map((para) => {
    // within a paragraph, convert single newlines to <br>
    const withBreaks = para.replace(/\n/g, "<br>");
    // then linkify & return wrapped <p>
    return `<p>${linkifyAndEncodeUrls(withBreaks)}</p>`;
  });

  return paragraphs.join("\n");
}

const createTransporter = () => {
  if (process.env.NODE_ENV === "production") {
    // Production email configuration
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  } else {
    // Development - use Ethereal Email for testing
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }
};

const sendEmail = async (options) => {
  try {
    if (!transporter) {
      transporter = createTransporter();
    }

    const mailOptions = {
      from: `${process.env.FROM_NAME || APP_NAME} <${
        process.env.FROM_EMAIL || process.env.SMTP_EMAIL
      }>`,
      to: options.email,
      subject: options.subject,
      // always supply text version
      text: options.message,
      // prefer explicit html if passed; otherwise convert text safely
      html: options.html || convertTextToHtml(options.message),
    };

    const info = await transporter.sendMail(mailOptions);

    if (process.env.NODE_ENV === "development") {
      console.log("📧 Email sent successfully");
      console.log("Message ID:", info.messageId);
      console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
    } else {
      console.log("📧 Production email sent:", info.messageId);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl:
        process.env.NODE_ENV === "development"
          ? nodemailer.getTestMessageUrl(info)
          : null,
    };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw new Error(`Email sending failed: ${error.message}`);
  }
};

// Send welcome email
const sendWelcomeEmail = async (user) => {
  const message = `
    Welcome to ${APP_NAME}, ${user.name}!

    Thank you for signing up. Your account has been created successfully.

    Here's what you can do next:
    • Complete your profile setup
    • Schedule your first interview
    • Explore our features and integrations

    Your current plan: ${
      user.subscription.plan.charAt(0).toUpperCase() +
      user.subscription.plan.slice(1)
    }
    Trial ends: ${user.subscription.trialEndDate.toLocaleDateString()}

    If you have any questions, our support team is here to help.

    Best regards,
    The ${APP_NAME} Team
  `;

  return await sendEmail({
    email: user.email,
    subject: `Welcome to ${APP_NAME}!`,
    message,
  });
};

// Send interview reminder
const sendInterviewReminder = async (interview, user, type = "candidate") => {
  const recipientEmail =
    type === "candidate"
      ? interview.candidateEmail
      : interview.interviewerEmail;
  const recipientName =
    type === "candidate" ? interview.candidateName : interview.interviewer;

  const timeUntil = Math.round(
    (new Date(interview.datetime) - new Date()) / (1000 * 60 * 60)
  ); // hours

  const message = `
    Hi ${recipientName},

    This is a reminder that you have an interview scheduled:

    📅 Date: ${new Date(interview.datetime).toLocaleDateString()}
    ⏰ Time: ${new Date(interview.datetime).toLocaleTimeString()}
    📍 ${
      interview.type === "video"
        ? "Video Call"
        : interview.type === "phone"
        ? "Phone Call"
        : "In Person"
    }

    ${
      interview.type === "video" && interview.meetingLink
        ? `🔗 Meeting Link: ${interview.meetingLink}`
        : ""
    }

    ${
      type === "candidate"
        ? `Position: ${interview.position}
       Interviewer: ${interview.interviewer}`
        : `Candidate: ${interview.candidateName}
       Position: ${interview.position}`
    }

    The interview is in ${timeUntil} hours. Please be prepared and join on time.

    Best regards,
    ${user.company}
  `;

  return await sendEmail({
    email: recipientEmail,
    subject: `Interview Reminder - ${interview.position}`,
    message,
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendInterviewReminder,
};
