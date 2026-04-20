import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Modal } from "react-bootstrap";

// Interview End Success UI — includes "Clear History" with confirmation modal.
// No scores or metrics. Props:
// - candidateName, onContinue, onExit, onClearHistory

export default function InterviewEndSuccess({
  onClearHistory = () => alert("History cleared"),
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (document.getElementById("interview-end-success-styles")) return;
    const style = document.createElement("style");
    style.id = "interview-end-success-styles";
    style.innerHTML = `
      .ies-wrap { min-height: 65vh; display: flex; align-items:center; justify-content:center; padding: 2rem; }
      .ies-card { width:100%; max-width:600px; background:#ffffff; border-radius:20px; padding:2rem; box-shadow:0 12px 30px rgba(0,0,0,0.07); text-align:center; animation: fadeUp 0.7s ease-out forwards; position: relative; }
      @keyframes fadeUp { from { opacity:0; transform: translateY(40px); } to { opacity:1; transform: translateY(0); } }
      .ies-title { font-size:1.9rem; font-weight:700; margin-bottom:0.6rem; }
      .ies-sub { color:#6b7280; font-size:1rem; margin-bottom:1.6rem; }
      .ies-btn-row { display:flex; gap:12px; justify-content:center; margin-top:1.4rem; }
      .ies-secondary { border-radius:10px; }
      /* confetti */
      .ies-confetti { pointer-events:none; position:absolute; inset:0; overflow:visible; z-index:5; }
      .ies-confetti-piece { position:absolute; width:12px; height:14px; border-radius:2px; opacity:0.9; animation: confettiFall linear forwards; }
      @keyframes confettiFall { to { transform: translateY(420px) rotate(460deg); opacity:0; } }
    `;
    document.head.appendChild(style);
  }, []);

  function renderConfetti() {
    const pieces = 16;
    const arr = [];
    for (let i = 0; i < pieces; i++) {
      const left = Math.random() * 100;
      const delay = Math.random() * 0.6;
      const duration = 1.2 + Math.random() * 1.4;
      const rotate = Math.random() * 360;
      const colors = ["#4ade80", "#22d3ee", "#facc15", "#f472b6", "#60a5fa"];
      const bg = colors[Math.floor(Math.random() * colors.length)];
      const style = {
        left: `${left}%`,
        top: `${-20 - Math.random() * 40}px`,
        background: bg,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        transform: `rotate(${rotate}deg)`,
      };
      arr.push(<div key={i} className="ies-confetti-piece" style={style} />);
    }
    return <div className="ies-confetti">{arr}</div>;
  }

  function handleClearConfirm() {
    try {
      // call the provided callback (the parent should implement the actual clearing logic)
      onClearHistory();
      setShowConfirm(false);
    } catch (err) {
      console.error("Error clearing history:", err);
      setShowConfirm(false);
    }
  }

  return (
    <Container className="ies-wrap">
      <Card className="ies-card">
        {renderConfetti()}

        <div style={{ marginBottom: 10 }}>
          <img
            src="https://cdn-icons-png.flaticon.com/512/190/190411.png"
            width="75"
            height="75"
            alt="Success"
            style={{ opacity: 0.95 }}
          />
        </div>

        <div className="ies-title">Interview Completed Successfully</div>
        <div className="ies-sub">
          Thank you. Everything has been saved securely.
        </div>
      </Card>
    </Container>
  );
}
