"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Bell,
  Shield,
  Palette,
  Mic,
  Volume2,
  Globe,
  Save,
  ArrowLeft,
  Check,
  SettingsIcon,
  Lock,
  Smartphone,
} from "lucide-react";
import { API } from "@/services";
import { notify } from "@/lib/utils";
import { supportedLanguages } from "@/lib/speech-utils";

interface SettingsState {
  emailNotifications: boolean;
  inAppReminders: boolean;
  pushNotifications: boolean;
  soundNotifications: boolean;

  dataCollection: boolean;
  sessionAnalytics: boolean;
  shareUsageData: boolean;

  speechLanguage: string;
  speechModel: "default" | "latest_long" | "latest_short";
  enablePunctuation: boolean;
  useGoogleSpeech: boolean;
  autoSendAfterSpeech: boolean;

  theme: "light" | "dark" | "system";
  fontSize: "small" | "medium" | "large";
  compactMode: boolean;

  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
}

const Settings = () => {
  const [settings, setSettings] = useState<SettingsState>({
    emailNotifications: true,
    inAppReminders: true,
    pushNotifications: false,
    soundNotifications: true,
    dataCollection: true,
    sessionAnalytics: true,
    shareUsageData: false,
    speechLanguage: "en-US",
    speechModel: "latest_long",
    enablePunctuation: true,
    useGoogleSpeech: false,
    autoSendAfterSpeech: true,
    theme: "dark",
    fontSize: "medium",
    compactMode: false,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
  });

  const [activeTab, setActiveTab] = useState("notifications");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const starsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (starsRef.current) {
      starsRef.current.innerHTML = "";
      for (let i = 0; i < 150; i++) {
        const star = document.createElement("div");
        star.className = "absolute bg-white rounded-full animate-pulse";
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.width = `${Math.random() * 3 + 1}px`;
        star.style.height = star.style.width;
        star.style.opacity = `${Math.random() * 0.8 + 0.2}`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        starsRef.current.appendChild(star);
      }
    }
  }, []);

  const showSaveMessage = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setSaveMessage(message);
    setTimeout(() => setSaveMessage(""), 3000);
  };

  const handleToggle = (key: keyof SettingsState, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    showSaveMessage(`${key.replace(/([A-Z])/g, " $1").toLowerCase()} updated!`);
  };

  const handleInputChange = (key: keyof SettingsState, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      const newErrors = { ...errors };
      delete newErrors[key];
      setErrors(newErrors);
    }
  };

  const validatePasswordForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!settings.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!settings.newPassword || settings.newPassword.length < 8) {
      newErrors.newPassword = "New password must be at least 8 characters";
    }

    if (settings.newPassword !== settings.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (
      settings.newPassword &&
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(settings.newPassword)
    ) {
      newErrors.newPassword =
        "Password must contain uppercase, lowercase, and numbers";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setIsSaving(true);
    try {
      const payload = {
        previous_password: settings.currentPassword,
        new_password: settings.newPassword,
      };

      await API.resetPassword(payload);
      notify("success", "Password updated successfully!");

      setSettings((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error: any) {
      notify(
        "error",
        error?.response?.data?.message || "Failed to update password"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAllSettings = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); 
      showSaveMessage("All settings saved successfully!");
    } catch (error) {
      showSaveMessage("Failed to save settings", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "security", label: "Security", icon: Lock },
  ];

  const ToggleSwitch = ({
    label,
    description,
    checked,
    onChange,
    icon: Icon,
  }: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    icon?: any;
  }) => (
    <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors">
      <div className="flex items-center space-x-3">
        {Icon && <Icon className="h-5 w-5 text-gray-400" />}
        <div>
          <h4 className="text-sm font-medium text-gray-100">{label}</h4>
          {description && (
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          )}
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
          checked ? "bg-blue-600" : "bg-gray-600"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );

  const SelectField = ({
    label,
    value,
    options,
    onChange,
    icon: Icon,
  }: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    icon?: any;
  }) => (
    <div className="space-y-2">
      <label className="flex items-center space-x-2 text-sm font-medium text-gray-100">
        {Icon && <Icon className="h-4 w-4 text-gray-400" />}
        <span>{label}</span>
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  const PasswordField = ({
    label,
    value,
    onChange,
    showPassword,
    onToggleShow,
    error,
    placeholder,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    showPassword: boolean;
    onToggleShow: () => void;
    error?: string;
    placeholder: string;
  }) => (
    <div className="">
      <label className="text-sm font-medium text-gray-100 ">{label}</label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full p-3 pr-12 bg-gray-800 border rounded-lg mt-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error ? "border-red-500" : "border-gray-700"
          }`}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5" />
          ) : (
            <Eye className="h-5 w-5" />
          )}
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div
        ref={starsRef}
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ zIndex: 0 }}
      />

      <div className="relative z-10 max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {saveMessage && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-lg">
                <Check className="h-4 w-4 text-green-400" />
                <span className="text-green-400 text-sm">{saveMessage}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 mb-8">
          <SettingsIcon className="h-8 w-8 text-blue-400" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? "bg-blue-600/20 border border-blue-500/30 text-blue-400"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6">
              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold flex items-center space-x-3">
                    <Bell className="h-6 w-6 text-blue-400" />
                    <span>Notification Preferences</span>
                  </h2>

                  <div className="space-y-4">
                    <ToggleSwitch
                      label="Email Notifications"
                      description="Receive important updates and summaries via email"
                      checked={settings.emailNotifications}
                      onChange={(checked) =>
                        handleToggle("emailNotifications", checked)
                      }
                      icon={Bell}
                    />

                    <ToggleSwitch
                      label="Push Notifications"
                      description="Receive push notifications on your mobile device"
                      checked={settings.pushNotifications}
                      onChange={(checked) =>
                        handleToggle("pushNotifications", checked)
                      }
                      icon={Smartphone}
                    />
                  </div>
                </div>
              )}

              {activeTab === "privacy" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold flex items-center space-x-3">
                    <Shield className="h-6 w-6 text-blue-400" />
                    <span>Privacy & Data</span>
                  </h2>

                  <div className="space-y-4">
                    <ToggleSwitch
                      label="Data Collection"
                      description="Allow collection of usage data for personalized experiences"
                      checked={settings.dataCollection}
                      onChange={(checked) =>
                        handleToggle("dataCollection", checked)
                      }
                      icon={Shield}
                    />

                    <ToggleSwitch
                      label="Session Analytics"
                      description="Help improve the app by sharing anonymous usage analytics"
                      checked={settings.sessionAnalytics}
                      onChange={(checked) =>
                        handleToggle("sessionAnalytics", checked)
                      }
                      icon={Shield}
                    />

                    <ToggleSwitch
                      label="Share Usage Data"
                      description="Share anonymized usage data with third-party analytics"
                      checked={settings.shareUsageData}
                      onChange={(checked) =>
                        handleToggle("shareUsageData", checked)
                      }
                      icon={Shield}
                    />
                  </div>
                </div>
              )}

              
              {activeTab === "security" && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold flex items-center space-x-3">
                    <Lock className="h-6 w-6 text-blue-400" />
                    <span>Security</span>
                  </h2>

                  <div className="space-y-6">
                    <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Change Password
                      </h3>
                      <form
                        onSubmit={handlePasswordUpdate}
                        className="space-y-4"
                      >
                        <PasswordField
                          label="Current Password"
                          value={settings.currentPassword}
                          onChange={(value) =>
                            handleInputChange("currentPassword", value)
                          }
                          showPassword={showPasswords.current}
                          onToggleShow={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              current: !prev.current,
                            }))
                          }
                          error={errors.currentPassword}
                          placeholder="Enter your current password"
                        />

                        <PasswordField
                          label="New Password"
                          value={settings.newPassword}
                          onChange={(value) =>
                            handleInputChange("newPassword", value)
                          }
                          showPassword={showPasswords.new}
                          onToggleShow={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              new: !prev.new,
                            }))
                          }
                          error={errors.newPassword}
                          placeholder="Enter your new password"
                        />

                        <PasswordField
                          label="Confirm New Password"
                          value={settings.confirmPassword}
                          onChange={(value) =>
                            handleInputChange("confirmPassword", value)
                          }
                          showPassword={showPasswords.confirm}
                          onToggleShow={() =>
                            setShowPasswords((prev) => ({
                              ...prev,
                              confirm: !prev.confirm,
                            }))
                          }
                          error={errors.confirmPassword}
                          placeholder="Confirm your new password"
                        />

                        <button
                          type="submit"
                          disabled={isSaving}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
                        >
                          <Lock className="h-4 w-4" />
                          <span>
                            {isSaving ? "Updating..." : "Update Password"}
                          </span>
                        </button>
                      </form>
                    </div>

               
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
