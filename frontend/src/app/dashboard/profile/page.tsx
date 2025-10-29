"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { useUser } from "@/store/user/userState";
import { API } from "@/services";
import { notify } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Download,
  Key,
  Loader2,
  Save,
  Trash2,
  Upload,
  UserIcon,
} from "lucide-react";
import Link from "next/link";

type FormValues = {
  first_name?: string;
  last_name?: string;
  bio?: string;
  mentor_name?: string;
  phone_number?: string;
  profile_picture_url?: File | null;
};

const DeleteAccountModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-11/12 max-w-md shadow-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
          Delete Account
        </h3>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          Are you sure you want to delete your account? This action cannot be
          undone and all your data will be permanently removed.
        </p>
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 transition-colors"
            onClick={onConfirm}
          >
            <Trash2 size={16} />
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

const ProfilePage: React.FC = () => {
  const { user, setUser }: any = useUser();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      first_name: "",
      last_name: "",
      bio: "",
      mentor_name: "",
      phone_number: "",
      profile_picture_url: null,
    },
  });

  const [previewImage, setPreviewImage] = useState<string | any>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [localProfileImage, setLocalProfileImage] = useState<File | null>(null);
  const [isImageDirty, setIsImageDirty] = useState(false);

  useEffect(() => {
    if (!user) return;

    setUploadedImage(user?.profile?.profile_picture_url || null);

    let first = "";
    let last = "";
    if (user.profile?.full_name) {
      const parts = user.profile.full_name.split(" ");
      first = parts[0] || "";
      last = parts.slice(1).join(" ") || "";
    }

    reset({
      first_name: first,
      last_name: last,
      bio: user.profile?.bio || "",
      mentor_name: user.profile?.mentor_name || "",
      profile_picture_url: null,
      phone_number: user?.profile?.phone_number || "",
    });

    setPreviewImage(null);
    setLocalProfileImage(null);
    setIsImageDirty(false);
  }, [user, reset]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        notify("error", "Please select a valid image file.");
        return;
      }
      setLocalProfileImage(file);
      setPreviewImage(URL.createObjectURL(file));
      setValue("profile_picture_url", file as any, { shouldValidate: true });
      setIsImageDirty(true);
    }
  };

  const handleProfileImageUpload = async () => {
    if (!localProfileImage) {
      notify("error", "Please select an image before uploading.");
      return;
    }

    const formData = new FormData();
    formData.append("profile_picture_url", localProfileImage);
    setIsUploadingImage(true);

    try {
      const response = await API.updateProfile(formData);
      notify("success", "Profile picture updated successfully!");

      setUser(response.data.data);
      setUploadedImage(response.data.data.profile.profile_picture_url);
      setPreviewImage(null);
      setLocalProfileImage(null);
      setValue("profile_picture_url", null);
      setIsImageDirty(false);
    } catch (error: any) {
      notify(
        "error",
        error?.response?.data?.message || "Failed to upload image."
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    try {
      const fullName = `${data.first_name || ""} ${
        data.last_name || ""
      }`.trim();

      const res = await API.updateProfile({
        full_name: fullName,
        bio: data.bio || "",
        mentor_name: data.mentor_name || "",
        phone_number: data?.phone_number || "   ",
      });

      setUser(res?.data?.data);
      notify("success", "Profile updated successfully!");
      setIsImageDirty(false);
    } catch (error: any) {
      notify(
        "error",
        error?.response?.data?.message || "Failed to update profile."
      );
    }
  };

  const displayName = user?.profile?.full_name || user?.email || "User";
  const joinDate = user?.created_at
    ? new Date(user?.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";

  const handleDownloadData = () => {
    const userData = {
      ...watch(),
      email: user?.email,
      joinDate: new Date(user?.created_at || "").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      downloadDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(userData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mentorAI-user-data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const confirmDeleteAccount = async () => {
    try {
      notify("success", "Account deleted successfully.");
      setIsModalOpen(false);
      router.push("/splash");
    } catch (e) {
      notify("error", "Failed to delete account.");
    }
  };
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

  return (
    <div className="min-h-screen bg-black from-slate-950 bg-gradient-to-b">
      <div
        ref={starsRef}
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ zIndex: 0 }}
      />
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={18} className="mr-2" />
              <span>Back</span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Profile
            </h1>
            <div className="w-20"></div> 
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 sm:px-10">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group">
                <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden bg-white/20 flex items-center justify-center border-4 border-white/30 shadow-lg">
                  {previewImage || uploadedImage ? (
                    <Image
                      src={previewImage || uploadedImage}
                      width={500}
                      height={500}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserIcon size={64} className="text-white/90" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 rounded-full p-2 shadow-md cursor-pointer group-hover:scale-110 transition-transform">
                  <Camera
                    size={18}
                    className="text-blue-600 dark:text-blue-400"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUploadingImage}
                  />
                </label>
              </div>

              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold text-white">{displayName}</h2>
                <p className="text-blue-100">Member since {joinDate}</p>
                <p className="text-blue-100 mt-1">{user?.email}</p>

                {previewImage !== null && (
                  <button
                    onClick={handleProfileImageUpload}
                    type="button"
                    disabled={isUploadingImage}
                    className="mt-3 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    {isUploadingImage ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        <span>Upload Profile Image</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="first_name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    {...register("first_name", {
                      maxLength: {
                        value: 30,
                        message: "First name cannot exceed 30 characters",
                      },
                    })}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Your first name"
                  />
                  {errors.first_name && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.first_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="last_name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    {...register("last_name", {
                      maxLength: {
                        value: 30,
                        message: "Last name cannot exceed 30 characters",
                      },
                    })}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Your last name"
                  />
                  {errors.last_name && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.last_name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="phone_number"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Number
                  </label>
                  <input
                    type="text"
                    id="phone_number"
                    {...register("phone_number", {
                      maxLength: {
                        value: 14,
                        message: "number cannot exceed 14 characters",
                      },
                    })}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Phone Number"
                  />
                  {errors.phone_number && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.phone_number.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="mentor_name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    AI Mentor Name
                  </label>
                  <input
                    type="text"
                    id="mentor_name"
                    {...register("mentor_name", {
                      maxLength: {
                        value: 50,
                        message: "Mentor name cannot exceed 50 characters",
                      },
                    })}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Your AI mentor's name"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    This is the name of your AI mentor that was set during
                    onboarding.
                  </p>
                  {errors.mentor_name && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.mentor_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label
                    htmlFor="bio"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Short Bio
                  </label>
                  <textarea
                    id="bio"
                    rows={4}
                    {...register("bio", {
                      maxLength: {
                        value: 500,
                        message: "Bio cannot exceed 500 characters",
                      },
                    })}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    placeholder="Tell us a little about yourself..."
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Max 500 characters
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {watch("bio")?.length || 0}/500
                    </p>
                  </div>
                  {errors.bio && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {errors.bio.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={(!isDirty && !isImageDirty) || isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Account Settings
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                  href="/dashboard/settings"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-800 dark:text-gray-200 transition-colors"
                >
                  <Key size={18} />
                  <span>Change Password</span>
                </Link>

                <button
                  onClick={handleDownloadData}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-gray-800 dark:text-gray-200 transition-colors"
                >
                  <Download size={18} />
                  <span>Download My Data</span>
                </button>

                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 transition-colors"
                >
                  <Trash2 size={18} />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <DeleteAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDeleteAccount}
      />
    </div>
  );
};

export default ProfilePage;
