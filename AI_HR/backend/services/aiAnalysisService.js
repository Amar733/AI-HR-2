const axios = require("axios");

class AIAnalysisService {
  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY;
  }

  // Generate interview questions based on job requirements
  async generateQuestions(job) {
    try {
      const prompt = this.buildQuestionPrompt(job);
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content:
                "You are an expert interviewer creating questions for technical interviews. Generate relevant, insightful questions based on the job requirements.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 10000,
        },
        {
          headers: {
            Authorization: `Bearer ${this.openaiApiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return this.parseGeneratedQuestions(
        response.data.choices[0].message.content,
        job
      );
    } catch (error) {
      console.error("AI Question Generation Error:", error);
      return this.generateFallbackQuestions(job);
    }
  }

  buildQuestionPrompt(job) {
    return `
Create ${job.totalQuestions} interview questions for the following job:

Position: ${job.title}
Department: ${job.department}
Difficulty: ${job.difficulty}
Required Skills: ${job.requiredSkills.map((s) => s.skill).join(", ")}
Experience Level: ${job.experience.min} - ${job.experience.max} years

Question Distribution:
- Technical: ${job.questionTypes.technical} questions
- Behavioral: ${job.questionTypes.behavioral} questions  
- Situational: ${job.questionTypes.situational} questions

For each question, provide:
1. The question text
2. Question type (technical/behavioral/situational)
3. Expected key points in the answer
4. Difficulty level
5. Scoring criteria (how interviewer should evaluate)

Format as JSON array with objects containing: 
question, type, expectedKeywords, difficulty, scoringCriteria, timeLimit
`;
  }

  parseGeneratedQuestions(aiResponse, job) {
    try {
      const jsonMatch = aiResponse.match(/\[.*\]/s);
      if (jsonMatch) {
        let parsed = JSON.parse(jsonMatch[0]);

        // Normalize shape
        return parsed.map((q) => ({
          question: q.question || "",
          type: q.type || "general",
          difficulty: q.difficulty || job.difficulty,
          expectedKeywords: Array.isArray(q.expectedKeywords)
            ? q.expectedKeywords
            : typeof q.expectedKeywords === "string"
            ? q.expectedKeywords.split(",").map((s) => s.trim())
            : [],
          scoringCriteria: q.scoringCriteria || "",
          timeLimit: q.timeLimit || 120,
          generatedAt: new Date(),
        }));
      }
      return this.generateFallbackQuestions(job);
    } catch (error) {
      console.error("Question parsing error:", error);
      return this.generateFallbackQuestions(job);
    }
  }

  generateFallbackQuestions(job) {
    const questions = [];

    // Technical questions based on skills
    job.requiredSkills
      .slice(0, job.questionTypes.technical)
      .forEach((skill) => {
        questions.push({
          question: `Describe your experience with ${skill.skill}. Can you walk me through a project where you used this technology?`,
          type: "technical",
          expectedKeywords: [skill.skill, "project", "experience"],
          difficulty: job.difficulty,
          scoringCriteria:
            "Look for hands-on experience, problem-solving ability, and clear explanation",
          timeLimit: 180,
          generatedAt: new Date(),
        });
      });

    // Behavioral questions
    const behavioralQuestions = [
      "Tell me about a time when you faced a significant challenge at work. How did you overcome it?",
      "Describe a situation where you had to work with a difficult team member.",
      "How do you prioritize tasks when you have multiple deadlines?",
      "Tell me about a time when you made a mistake. How did you handle it?",
      "Describe your ideal work environment and team dynamic.",
    ];

    behavioralQuestions.slice(0, job.questionTypes.behavioral).forEach((q) => {
      questions.push({
        question: q,
        type: "behavioral",
        expectedKeywords: ["situation", "action", "result"],
        difficulty: job.difficulty,
        scoringCriteria:
          "Look for structured responses (STAR method), self-awareness, and adaptability",
        timeLimit: 120,
        generatedAt: new Date(),
      });
    });

    // Situational questions
    const situationalQuestions = [
      "If you were given a project with an impossible deadline, how would you approach it?",
      "How would you handle a situation where you disagree with your manager's decision?",
      "What would you do if you discovered a security vulnerability in the system?",
    ];

    situationalQuestions
      .slice(0, job.questionTypes.situational)
      .forEach((q) => {
        questions.push({
          question: q,
          type: "situational",
          expectedKeywords: ["approach", "solution", "decision"],
          difficulty: job.difficulty,
          scoringCriteria:
            "Evaluate problem-solving, decision-making, and risk awareness",
          timeLimit: 150,
          generatedAt: new Date(),
        });
      });

    return questions;
  }
}

module.exports = AIAnalysisService;
