"use client";
import React, { useEffect, useRef, useState } from "react";
import "../../auth.css";
import AuthForm from "@/components/AuthForm";

const Welcome: React.FC = () => {
  const starsContainerRef = useRef<HTMLDivElement>(null);
  const [authMode, setAuthMode] = useState<"none" | "login" | "register">(
    "none"
  );

  useEffect(() => {
    if (starsContainerRef.current) {
      const createStars = () => {
        const starsContainer = starsContainerRef.current;
        if (!starsContainer) return;

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
      };

      createStars();
    }
    return () => console.log("");
  }, []);

  const handleNewUser = (e: React.MouseEvent) => {
    e.preventDefault();
    localStorage.setItem("authMode", "new");
    setAuthMode("register");
  };

  const handleExistingUser = (e: React.MouseEvent) => {
    e.preventDefault();
    setAuthMode("login");
  };

  const handleAuthSuccess = () => {
    if (localStorage.getItem("authMode") === "new") {
    } else {
    }
  };

  return (
    <div className="auth-view">
      <div className="stars" id="stars" ref={starsContainerRef}></div>
      <div className="auth-container">
        <div className="auth-form-container">
          <h1 className="auth-title ">Welcome to MentorAI</h1>
          <p className="auth-subtitle">
            Your personal growth journey starts here
          </p>

          {authMode === "none" ? (
            <div
              className="button-container"
              style={{
                marginTop: "2rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                width: "100%",
              }}
            >
              <button
                onClick={handleNewUser}
                className="button"
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem",
                  border: "1px solid var(--neon-border)",
                  background: "rgba(16, 185, 129, 0.2)",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer",
                  width: "100%",
                  transition: "all 0.2s ease",
                }}
              >
                I'm ready to grow
              </button>
              <button
                onClick={handleExistingUser}
                className="button"
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem",
                  border: "1px solid var(--neon-border)",
                  background: "transparent",
                  color: "white",
                  cursor: "pointer",
                  width: "100%",
                  transition: "all 0.2s ease",
                }}
              >
                Let's pick up where we left off
              </button>
            </div>
          ) : (
            <div style={{ marginTop: "1.5rem", width: "100%" }}>
              <AuthForm
                mode={authMode}
                onSuccess={handleAuthSuccess}
                onCancel={() => setAuthMode("none")}
              />
            </div>
          )}
        </div>

        <div className="auth-hero">
          <div className="hero-content">
            <h2>Personalized AI Mentorship</h2>
            <p>MentorAI helps you succeed by providing:</p>
            <ul>
              <li>Tailored guidance based on your preferences</li>
              <li>Structured goal tracking and progress monitoring</li>
              <li>Intelligent journaling with key insight extraction</li>
              <li>Proactive reminders for important tasks</li>
              <li>Visual mapping of your life priorities</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
