import React, { useState } from "react";
import "@/app/auth.css";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Cookies from "js-cookie";
import { API } from "../services";
import { useUser } from "@/store/user/userState";
import { notify } from "@/lib/utils";
import OtpVerification from "./otp-verification";
import { useRouter } from "next/navigation";

interface AuthFormProps {
  mode: "login" | "register";
  onSuccess?: () => void;
  onCancel?: () => void;
}

const emailSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
});

const phoneSchema = z.object({
  phoneNumber: z.string().regex(/^\+[0-9]{10,15}$/, "Invalid phone number"),
  otpCode: z
    .string()
    .regex(/^[0-9]{6}$/, "OTP must be a 6-digit number")
    .optional(),
});

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const AuthForm: React.FC<AuthFormProps> = ({ mode, onSuccess, onCancel }) => {
  const [showEmailOtpCard, setShowEmailOtpCard] = useState(false);
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email");
  const [phoneStep, setPhoneStep] = useState<"number" | "verification">(
    "number"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { setUser }: any = useUser();
  const router = useRouter();

  const {
    register: emailRegister,
    handleSubmit: handleEmailFormSubmit,
    formState: { errors: emailErrors },
  } = useForm({
    resolver: zodResolver(emailSchema),
  });

  const {
    register: phoneRegister,
    handleSubmit: handlePhoneFormSubmit,
    formState: { errors: phoneErrors },
    watch,
  } = useForm({
    resolver: zodResolver(phoneSchema),
  });

  const {
    register: forgotRegister,
    handleSubmit: handleForgotSubmit,
    formState: { errors: forgotErrors },
  } = useForm({
    resolver: zodResolver(forgotSchema),
  });

  const handleEmailSubmit = async (data: z.infer<typeof emailSchema>) => {
    setIsLoading(true);
    setError(null);
    try {
      let payload: any = { ...data };
      if (mode === "register") {
        if (!data.firstName || !data.lastName) {
          throw new Error("First name and Last name are required");
        }
        payload.full_name = `${data.firstName} ${data.lastName}`;
        delete payload.firstName;
        delete payload.lastName;
      }

      const res =
        mode === "login"
          ? await API.loginUser(payload)
          : await API.registerUser(payload);

      setUser(res?.data?.data?.user);

      if (mode === "login") {
        Cookies.set("token", res?.data?.data?.token);
        notify("success", "Login successfully");

        router.push("/dashboard");
      } else {
        notify("success", "Email send successfully");
        localStorage.setItem("email_token", res?.data?.data?.token);
      }

      if (mode === "register") {
        setShowEmailOtpCard(true);
      }
    } catch (err: any) {
      notify("error", err?.response?.data?.message || err?.message);
      setError(
        err?.response?.data?.message || err?.message || "An error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (
    data: z.infer<typeof forgotSchema>
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      await API.forgotPassword(data);
      notify("success", "Password reset link sent to your email");
      setShowForgotPassword(false);
    } catch (err: any) {
      notify(
        "error",
        err?.response?.data?.message || err?.message || "An error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="auth-form-container">
      <h2>
        {showForgotPassword
          ? "Reset Password"
          : mode === "login"
            ? "Sign In"
            : "Create Account"}
      </h2>
      {showForgotPassword && (
        <form
          onSubmit={handleForgotSubmit(handleForgotPasswordSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: "3px" }}
        >
          <div className="form-group">
            <label
              htmlFor="forgotEmail"
              style={{ display: "block", marginBottom: "6px" }}
            >
              Email
            </label>
            <input
              id="forgotEmail"
              type="email"
              {...forgotRegister("email")}
              disabled={isLoading}
              style={{
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid rgba(0, 255, 255, 0.3)",
                background: "rgba(0, 0, 0, 0.2)",
                color: "white",
                fontSize: "16px",
              }}
            />
            {forgotErrors.email && (
              <p style={{ color: "red" }}>{forgotErrors.email.message}</p>
            )}
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: "10px 20px",
                borderRadius: "4px",
                border: "1px solid var(--neon-border)",
                background: "transparent",
                color: "white",
                fontWeight: "bold",
                cursor: isLoading ? "wait" : "pointer",
                flex: "1",
              }}
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              style={{
                padding: "10px 20px",
                borderRadius: "4px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                background: "transparent",
                color: "white",
                cursor: "pointer",
              }}
            >
              Back
            </button>
          </div>
        </form>
      )}

      {!showForgotPassword && (
        <>
          {authMethod === "email" && (
            <form
              onSubmit={handleEmailFormSubmit(handleEmailSubmit)}
              style={{ display: "flex", flexDirection: "column", gap: "0px" }}
            >
              {mode === "register" && (
                <>
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      id="firstName"
                      type="text"
                      {...emailRegister("firstName")}
                      disabled={isLoading}
                      style={{
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid rgba(0, 255, 255, 0.3)",
                        background: "rgba(0, 0, 0, 0.2)",
                        color: "white",
                        fontSize: "16px",
                      }}
                    />
                    {emailErrors.firstName && (
                      <p style={{ color: "red" }}>
                        {emailErrors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      id="lastName"
                      type="text"
                      {...emailRegister("lastName")}
                      disabled={isLoading}
                      style={{
                        padding: "10px",
                        borderRadius: "4px",
                        border: "1px solid rgba(0, 255, 255, 0.3)",
                        background: "rgba(0, 0, 0, 0.2)",
                        color: "white",
                        fontSize: "16px",
                      }}
                    />
                    {emailErrors.lastName && (
                      <p style={{ color: "red" }}>
                        {emailErrors.lastName.message}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  {...emailRegister("email")}
                  disabled={isLoading}
                  style={{
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid rgba(0, 255, 255, 0.3)",
                    background: "rgba(0, 0, 0, 0.2)",
                    color: "white",
                    fontSize: "16px",
                  }}
                />
                {emailErrors.email && (
                  <p style={{ color: "red" }}>{emailErrors.email.message}</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  {...emailRegister("password")}
                  disabled={isLoading}
                  style={{
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid rgba(0, 255, 255, 0.3)",
                    background: "rgba(0, 0, 0, 0.2)",
                    color: "white",
                    fontSize: "16px",
                  }}
                />
                {emailErrors.password && (
                  <p style={{ color: "red" }}>{emailErrors.password.message}</p>
                )}
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    style={{
                      marginTop: "8px",
                      fontSize: "0.9rem",
                      color: "var(--primary-color)",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      padding: "0",
                    }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button
                  type="submit"
                  disabled={isLoading}
                  style={{
                    padding: "10px 20px",
                    borderRadius: "4px",
                    border: "1px solid var(--neon-border)",
                    background:
                      mode === "login"
                        ? "transparent"
                        : "rgba(16, 185, 129, 0.2)",
                    color: "white",
                    fontWeight: "bold",
                    cursor: isLoading ? "wait" : "pointer",
                    flex: "1",
                  }}
                >
                  {isLoading
                    ? mode === "login"
                      ? "Signing in..."
                      : "Creating account..."
                    : mode === "login"
                      ? "Sign In"
                      : "Create Account"}
                </button>
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "4px",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      background: "transparent",
                      color: "white",
                      cursor: isLoading ? "not-allowed" : "pointer",
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}

          {authMethod === "phone" && <></>}
          {authMethod === "email" && showEmailOtpCard && <OtpVerification />}
        </>
      )}
    </div>
  );
};

export default AuthForm;
