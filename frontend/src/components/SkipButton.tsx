"use client";
import { useRouter } from "next/navigation";

const SkipButton = ({ nextPage }: any) => {
  const router = useRouter();
  const handleSkip = () => {
    try {
      router.push(nextPage);
    } catch (error) {
      console.warn("Navigation error caught:", error);
    }
  };

  return (
    <button
      onClick={handleSkip}
      className="skip-button"
      aria-label="Skip to next question"
      title="Skip this question (for testing only)"
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        padding: "5px 15px",
        background: "rgba(0, 243, 255, 0.2)",
        color: "white",
        border: "1px solid rgba(0, 243, 255, 0.4)",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold",
        zIndex: 1000,
      }}
    >
      Skip
    </button>
  );
};

export default SkipButton;
