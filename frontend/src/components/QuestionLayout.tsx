import React, { useEffect, useRef } from "react";

interface QuestionLayoutProps {
  questionNumber: number;
  totalQuestions: number;
  question: string;
  children: React.ReactNode;
}

const QuestionLayout: React.FC<QuestionLayoutProps> = ({
  questionNumber,
  totalQuestions,
  question,
  children,
}) => {
  const starsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createStars();
  }, []);

  const createStars = () => {
    const starsContainer = starsRef.current;
    if (starsContainer) {
      starsContainer.innerHTML = "";

      const numStars = 100;
      for (let i = 0; i < numStars; i++) {
        const star = document.createElement("div");
        star.className = "star";
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        starsContainer.appendChild(star);
      }
    }
  };

  return (
    <div className="question-view">
      <div className="stars" ref={starsRef}></div>
      <div className="question-container">
        <div className="question-header">
          <div className="progress-container">
            <span className="progress-text">
              Question {questionNumber} of {totalQuestions}
            </span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
              ></div>
            </div>
          </div>
          <h2 className="question-title">{question}</h2>
        </div>
        <div className="question-content">{children}</div>
      </div>
    </div>
  );
};

export default QuestionLayout;
