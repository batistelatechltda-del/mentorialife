import React, { useState } from "react";
import SkipButton from "./SkipButton";

interface AuthPopupProps {
  onClose: () => void;
  onSuccess: () => void;
  authEndpoint: string;
  initialAuthMethod?: "email" | "phone";
}

const AuthPopup: React.FC<AuthPopupProps> = ({
  onClose,
  onSuccess,
  authEndpoint,
  initialAuthMethod = "email",
}) => {
  const [status, setStatus] = useState<
    "initializing" | "authenticating" | "success" | "error"
  >("initializing");
  const [message, setMessage] = useState("Starting authentication...");
  const [authMethod, setAuthMethod] = useState<"email" | "phone">(
    initialAuthMethod
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [phoneStep, setPhoneStep] = useState<"number" | "verification">(
    "number"
  );

  const [submitting, setSubmitting] = useState(false);

  const isSignup = authEndpoint === "signup";

  const switchAuthMethod = (method: "email" | "phone") => {
    setAuthMethod(method);
    setStatus("initializing");
    setMessage("");
    if (method === "phone") {
      setPhoneStep("number");
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {

      return;
    }

    setSubmitting(true);
    setStatus("authenticating");
    setMessage(`${isSignup ? "Creating your account" : "Logging in"}...`);

    try {

      const success = isSignup;


      if (success) {
        setStatus("success");
        setMessage(
          `${isSignup ? "Registration" : "Login"} successful! Redirecting...`
        );

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1000);
      } else {
        setStatus("error");
        setMessage(
          `${isSignup ? "Registration" : "Login"} failed. Please try again.`
        );
      }
    } catch (error) {
      console.error("Error during Supabase auth:", error);
      setStatus("error");
      setMessage(
        `Authentication error: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );


    } finally {
      setSubmitting(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (phoneStep === "number") {
        if (!phoneNumber.match(/^\+[0-9]{10,15}$/)) {
          throw new Error(
            "Please enter a valid phone number in international format (e.g., +15555555555)"
          );
        }

        setStatus("authenticating");
        setMessage("Sending verification code...");

        const success = false;
        if (success) {
          setPhoneStep("verification");
          setStatus("initializing"); 
          
        } else {
          throw new Error("Failed to send verification code");
        }
      } else {
        if (!otpCode.match(/^[0-9]{6}$/)) {
          throw new Error("Please enter the 6-digit verification code");
        }

        setStatus("authenticating");
        setMessage("Verifying code...");

        const success = false;

        if (success) {
          setStatus("success");
          setMessage("Phone verification successful! Redirecting...");

          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1000);
        } else {
          throw new Error("Invalid verification code");
        }
      }
    } catch (error) {
      console.error("Error during phone auth:", error);
      setStatus("error");
      setMessage(
        `Authentication error: ${error instanceof Error ? error.message : "Unknown error"
        }`
      );

  
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = handleEmailSubmit;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (
      e.target === e.currentTarget &&
      status !== "authenticating" &&
      !submitting
    ) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#111] rounded-lg p-6 w-full max-w-md flex flex-col">
        {isSignup ? (
          <SkipButton nextPage="question1" />
        ) : (
          <SkipButton nextPage="dashboard" />
        )}

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-neon">
            {isSignup ? "Create Account" : "Log In"}
          </h2>
          {!submitting && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              &times; Close
            </button>
          )}
        </div>

        <div className="bg-[#222] rounded border border-[#333] p-6">
          {status === "initializing" && (
            <>
              <div className="auth-method-tabs flex mb-5 border-b border-[#444]">
                <button
                  type="button"
                  onClick={() => switchAuthMethod("email")}
                  className={`flex-1 pb-2 text-center ${authMethod === "email"
                      ? "border-b-2 border-neon text-white font-medium"
                      : "text-gray-400 hover:text-gray-200"
                    }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => switchAuthMethod("phone")}
                  className={`flex-1 pb-2 text-center ${authMethod === "phone"
                      ? "border-b-2 border-neon text-white font-medium"
                      : "text-gray-400 hover:text-gray-200"
                    }`}
                >
                  Phone
                </button>
              </div>

              {authMethod === "email" && (
                <form
                  onSubmit={handleEmailSubmit}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="text-white text-sm">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-[#333] text-white px-3 py-2 rounded border border-[#444] focus:border-neon outline-none"
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="password" className="text-white text-sm">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-[#333] text-white px-3 py-2 rounded border border-[#444] focus:border-neon outline-none"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-gradient-to-r from-[#0f766e] to-[#10b981] hover:from-[#10b981] hover:to-[#0f766e] text-white font-bold py-2 px-4 rounded mt-4 transition-all"
                  >
                    {isSignup ? "Sign Up" : "Log In"}
                  </button>
                </form>
              )}

              {authMethod === "phone" && (
                <form
                  onSubmit={handlePhoneSubmit}
                  className="flex flex-col gap-4"
                >
                  {phoneStep === "number" && (
                    <>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="phone" className="text-white text-sm">
                          Phone Number
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="bg-[#333] text-white px-3 py-2 rounded border border-[#444] focus:border-neon outline-none"
                          placeholder="+15555555555"
                          required
                        />
                        <p className="text-gray-400 text-xs mt-1">
                          Enter your phone number in international format (e.g.,
                          +15555555555)
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="bg-gradient-to-r from-[#0f766e] to-[#10b981] hover:from-[#10b981] hover:to-[#0f766e] text-white font-bold py-2 px-4 rounded mt-4 transition-all"
                      >
                        Send Verification Code
                      </button>
                    </>
                  )}

                  {phoneStep === "verification" && (
                    <>
                      <div className="flex flex-col gap-2">
                        <label htmlFor="otp" className="text-white text-sm">
                          Verification Code
                        </label>
                        <input
                          id="otp"
                          type="text"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="bg-[#333] text-white px-3 py-2 rounded border border-[#444] focus:border-neon outline-none"
                          placeholder="123456"
                          required
                        />
                        <p className="text-gray-400 text-xs mt-1">
                          Enter the 6-digit code sent to {phoneNumber}
                        </p>
                      </div>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setPhoneStep("number")}
                          className="text-sm text-neon hover:underline"
                        >
                          Change phone number
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="bg-gradient-to-r from-[#0f766e] to-[#10b981] hover:from-[#10b981] hover:to-[#0f766e] text-white font-bold py-2 px-4 rounded mt-4 transition-all"
                      >
                        Verify & Sign In
                      </button>
                    </>
                  )}
                </form>
              )}
            </>
          )}

          {(status === "authenticating" || submitting) && (
            <div className="flex flex-col items-center justify-center my-6">
              <div className="loading-spinner mb-4"></div>
              <p className="text-gray-300 text-center">{message}</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-green-400 my-6 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p>{message}</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-red-400 text-center">{message}</p>
              <button
                onClick={() => onClose()}
                className="bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPopup;
