const APP_NAME = process.env.APP_NAME || process.env.NEXT_PUBLIC_APP_NAME || "AI Interview";

const generateInterviewInvitation = (
  candidateName,
  jobTitle,
  interviewUrl,
  accessCode,
  companyName,
  duration
) => {
  return {
    subject: `Interview Invitation - ${jobTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Interview Invitation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #22c55e 0%, #000000 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #22c55e; color: white; text-decoration: none; padding: 15px 30px; border-radius: 5px; font-weight: bold; margin: 20px 0; }
          .access-code { background: #e5e7eb; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Interview Invitation</h1>
            <h2>${jobTitle}</h2>
          </div>
          <div class="content">
            <p>Dear ${candidateName || "Candidate"},</p>

            <p>Congratulations! You have been selected to participate in an AI-powered interview for the position of <strong>${jobTitle}</strong> at ${companyName}.</p>

            <h3>📋 Interview Details:</h3>
            <ul>
              <li><strong>Position:</strong> ${jobTitle}</li>
              <li><strong>Duration:</strong> ${duration} minutes</li>
              <li><strong>Type:</strong> AI-Powered Video Interview</li>
              <li><strong>Language:</strong> English</li>
            </ul>

            <h3>🔑 Access Information:</h3>
            <div class="access-code">${accessCode}</div>
            <p><small>Please keep this access code safe - you'll need it to start your interview.</small></p>

            <h3>🎯 How to Take Your Interview:</h3>
            <ol>
              <li>Click the button below to access the interview platform</li>
              <li>Enter your email and the access code provided above</li>
              <li>Ensure you have a stable internet connection and working camera/microphone</li>
              <li>Complete the interview in a quiet, well-lit environment</li>
            </ol>

            <div style="text-align: center;">
              <a href="${interviewUrl}" class="button">🚀 Start Your Interview</a>
            </div>

            <h3>💡 Tips for Success:</h3>
            <ul>
              <li>Test your camera and microphone beforehand</li>
              <li>Choose a quiet, professional environment</li>
              <li>Speak clearly and maintain good eye contact with the camera</li>
              <li>Take your time to think before answering</li>
              <li>Be authentic and showcase your skills confidently</li>
            </ul>

            <p><strong>⏰ Please complete your interview within 7 days of receiving this invitation.</strong></p>

            <p>If you have any technical issues or questions, please contact our support team.</p>

            <p>Good luck with your interview!</p>

            <p>Best regards,<br>
            <strong>${companyName} Hiring Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated message from ${APP_NAME} Platform</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Dear ${candidateName || "Candidate"},

      You have been invited to take an AI-powered interview for ${jobTitle} at ${companyName}.

      Interview Details:
      • Position: ${jobTitle}
      • Duration: ${duration} minutes
      • Type: AI-Powered Video Interview

 
      Interview Link: ${interviewUrl}

      Please complete your interview within 7 days.

      Best regards,
      ${companyName} Hiring Team
    `,
  };
};

const generateInterviewCompleted = (candidateName, jobTitle, companyName) => {
  return {
    subject: `Interview Completed - ${jobTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Interview Completed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Interview Completed!</h1>
            <h2>Thank You ${candidateName}</h2>
          </div>
          <div class="content">
            <p>Dear ${candidateName},</p>

            <p>Thank you for completing your AI-powered interview for the <strong>${jobTitle}</strong> position at ${companyName}.</p>

            <p>🎯 <strong>What happens next?</strong></p>
            <ul>
              <li>Our AI system is analyzing your responses</li>
              <li>Our hiring team will review your interview</li>
              <li>We'll contact you with next steps within 5-7 business days</li>
            </ul>

            <p>We appreciate the time you invested in this interview process. Your responses have been recorded and will be carefully reviewed by our team.</p>

            <p>If you have any questions about the process, please don't hesitate to reach out.</p>

            <p>Best of luck!</p>

            <p>Warm regards,<br>
            <strong>${companyName} Hiring Team</strong></p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

const generateInterviewResultNotification = (
  employerName,
  candidateName,
  jobTitle,
  overallScore,
  recommendation
) => {
  const recommendationEmoji = {
    hire: "🎉",
    maybe: "🤔",
    no_hire: "❌",
    further_evaluation: "📋",
  };

  return {
    subject: `Interview Analysis Complete - ${candidateName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Interview Analysis Complete</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .score { font-size: 48px; font-weight: bold; text-align: center; color: #22c55e; margin: 20px 0; }
          .recommendation { background: #e0f2fe; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Interview Analysis Complete</h1>
          </div>
          <div class="content">
            <p>Dear ${employerName},</p>

            <p>The AI analysis for <strong>${candidateName}</strong>'s interview for the <strong>${jobTitle}</strong> position is now complete.</p>

            <div class="score">${overallScore}/10</div>

            <div class="recommendation">
              <h3>${
                recommendationEmoji[recommendation] || "📋"
              } Recommendation: ${recommendation
      .replace("_", " ")
      .toUpperCase()}</h3>
            </div>

            <p>📋 <strong>Analysis includes:</strong></p>
            <ul>
              <li>Technical Skills Assessment</li>
              <li>Communication Evaluation</li>
              <li>Behavioral Analysis</li>
              <li>Video & Audio Analysis</li>
              <li>Grammar & Language Skills</li>
              <li>Red Flags Detection</li>
              <li>Complete Transcription</li>
            </ul>

            <p>To view the complete analysis report, please log in to your ${APP_NAME} dashboard.</p>

            <p>Best regards,<br>
            <strong>${APP_NAME} Team</strong></p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
};

module.exports = {
  generateInterviewInvitation,
  generateInterviewCompleted,
  generateInterviewResultNotification,
};
