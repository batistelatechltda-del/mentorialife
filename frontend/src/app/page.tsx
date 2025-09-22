"use client";
import React, { useEffect, useRef } from "react";
import SkipButton from "../components/SkipButton";
import { useRouter } from "next/navigation";

const page: React.FC = () => {
  const starsContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  useEffect(() => {
    localStorage.removeItem("bypass_auth_check");
    localStorage.removeItem("force_dashboard");
    localStorage.removeItem("_emergency_dashboard_override");
    localStorage.removeItem("authenticated");

    if (starsContainerRef.current) {
      const numStars = 100;
      const starsContainer = starsContainerRef.current;
      starsContainer.innerHTML = "";

      for (let i = 0; i < numStars; i++) {
        const star = document.createElement("div");
        star.className = "star";
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.width = `${Math.random() * 3}px`;
        star.style.height = star.style.width;
        star.style.animationDelay = `${Math.random() * 2}s`;
        starsContainer.appendChild(star);
      }
    }

    let isMounted = true;

    const fadeTimeout = setTimeout(() => {
      if (!isMounted) return;

      document.body.classList.add("fade-out");

      const redirectTimeout = setTimeout(() => {
        if (!isMounted) return;

        localStorage.setItem("splash_shown", "true");
        router.push("/welcome");
      }, 1000);

      return () => {
        clearTimeout(redirectTimeout);
      };
    }, 4000);

    return () => {
      isMounted = false;
      clearTimeout(fadeTimeout);
      document.body.classList.remove("fade-out");
    };
  }, []);

  return (
    <div className="splash-screen">
      <SkipButton nextPage="welcome" />
      <div className="stars" id="stars" ref={starsContainerRef}></div>
      <div className="content-container">
        <div className="mentor-title">
          Mentor<span className="gradient">AI</span>
        </div>
        <div className="mentor-subtitle">
          You've been searching for clarity in a world that rarely listens. I'm
          not here to judge you — I'm here to guide you, step by step, back to
          your true self. This is where the real journey begins.
        </div>
      </div>
    </div>
  );
};

export default page;
