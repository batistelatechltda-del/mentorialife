"use client";
import React, { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { notify } from "@/lib/utils";
import "@/app/auth.css";
import { API } from "@/services/index";

const formSchema = z
  .object({
    new_password: z.string().min(8, {
      message: "Password must be at least 8 characters.",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.new_password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export default function ResetPasswordPage() {
  const { token }: any = useParams();
  const router = useRouter();
  const starsContainerRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      new_password: "",
      confirmPassword: "",
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = form;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!token) {
      notify("error", "Invalid or missing reset token.");
      return;
    }

    try {
      await API.resetPasswordProcess({ new_password: values.new_password }, token);
      notify("success", "Password changed successfully");

      setTimeout(() => {
        router.push("/welcome");
      }, 1500);
    } catch (error: any) {
      notify("error", error?.response?.data.message || error?.message);
    } finally {
      setTimeout(() => {
        reset();
      }, 2000);
    }
  };

  return (
    <div className="auth-view">
      <div className="stars" id="stars" ref={starsContainerRef}></div>
      <div className="reset-password">
        <h2>Set a New Password</h2>
        <form
          onSubmit={handleSubmit(onSubmit)}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div className="form-group">
            <label>New Password</label>
            <input type="password" {...register("new_password")} />
            {errors.new_password && (
              <p style={{ color: "red" }}>{errors.new_password.message}</p>
            )}
          </div>

          <div className="form-group">
            <label>Confirm New Password</label>
            <input type="password" {...register("confirmPassword")} />
            {errors.confirmPassword && (
              <p style={{ color: "red" }}>{errors.confirmPassword.message}</p>
            )}
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
