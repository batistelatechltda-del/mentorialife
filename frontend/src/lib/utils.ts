import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { API } from "../services";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const notify = (type: any, message: any) => {
  if (type === "success") {
    return toast.success(message);
  } else {
    return toast.error(message);
  }
};

export const logout = async (router: any) => {
  try {
    await API.logout();

    localStorage.clear();
    Cookies.remove("token");
    router.push("/welcome");
  } catch (error) {
    localStorage.clear();
    Cookies.remove("token");
    router.push("/welcome");
  }
};
