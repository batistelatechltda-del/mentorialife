"use client";

import type React from "react";
import { useState } from "react";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { notify } from "@/lib/utils";
import { API } from "../services";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OtpVerification() {
  const [otp, setOtp] = useState("");
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await API.otpVerification({ otp });
      const token = response?.data?.data?.token;
      if (token) {
        Cookies.set("token", token, { expires: 7 });
        notify("success", "Email verified");
        router.push("/dashboard");
      } else {
        notify("error", "Token missing in response");
      }
    } catch (error: any) {
      notify("error", error?.response?.data.message || error?.message);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setOpen(false);
      }, 2000);
    }
  };
  const resendOtp = async (e: React.FormEvent) => {
    setLoading(true);
    e.preventDefault();
    try {
      await API.resendOtp();
      notify("success", "OTP resent successfully");
    } catch (error: any) {
      notify("error", error?.response?.data?.message || error?.message);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const otpArray = otp.split("");
    otpArray[index] = value;
    const newOtp = otpArray.join("").padEnd(6, "");
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleCancel = () => {
    setOpen(false);
    setOtp("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 bg-transparent border-none shadow-none max-w-md">
        <Card className="w-full max-w-md bg-[#202029] border-gray-700 text-center">
          <CardHeader className="text-center">
            <CardTitle className="text-white text-xl font-medium">
              Verify Account
            </CardTitle>
            <CardTitle className="text-blue-400 text-sm text-center font-medium">
              Enter verification code
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit}>
              <div className="flex justify-center space-x-2">
                {Array.from({ length: 6 }, (_, index) => (
                  <Input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    value={otp[index] || ""}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-white bg-gray-700 border-gray-600 focus:border-blue-400 focus:ring-blue-400"
                    maxLength={1}
                  />
                ))}
              </div>

              <div className="text-center mt-4">
                <span>Didn't receive code? </span>
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={loading}
                  className="text-blue-400 text-sm hover:underline"
                >
                  Resend...
                </button>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader className="w-3 h-3 animate-spin  " />
                  ) : (
                    "Verify Code"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
