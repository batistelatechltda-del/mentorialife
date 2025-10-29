import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = `${process.env.NEXT_PUBLIC_BASE_URL_SERVER}/api`;

interface CustomAxiosInstance {
  defaults: any;
  interceptors: {
    request: {
      use: (
        onFulfilled: (config: any) => any,
        onRejected?: (error: any) => any
      ) => void;
    };
    response: {
      use: (
        onFulfilled: (response: any) => any,
        onRejected?: (error: any) => any
      ) => void;
    };
  };
  get: (url: string, config?: any) => Promise<any>;
  post: (url: string, data?: any, config?: any) => Promise<any>;
  put: (url: string, data?: any, config?: any) => Promise<any>;
  delete: (url: string, config?: any) => Promise<any>;
  patch: (url: string, data?: any, config?: any) => Promise<any>;
  request: (config: any) => Promise<any>;
  registerUser: (data: Record<string, any>) => Promise<any>;
  createMessage: (data: Record<string, any>) => Promise<any>;
  createEvent: (data: Record<string, any>) => Promise<any>;
  getTodos: () => Promise<any>;
  getConversation: () => Promise<any>;
  getConversationMessage: () => Promise<any>;
  reminderAll: () => Promise<any>;
  loginUser: (data: Record<string, any>) => Promise<any>;
  updateReminder: (id: string, data: any) => Promise<any>;
  updateGoals: (id: string, data: any) => Promise<any>;
  updateEvent: (id: string, data: any) => Promise<any>;
  deleteGoal: (id: string) => Promise<any>;
  deleteReminder: (id: string) => Promise<any>;
  deleteJournal: (id: string) => Promise<any>;
  deleteEvent: (id: string) => Promise<any>;
  addGoals: (data: any) => Promise<any>;
  addReminder: (data: any) => Promise<any>;
  addJournal: (data: any) => Promise<any>;
  clearChat: () => Promise<any>;
  otpVerification: (data: Record<string, any>) => Promise<any>;
  resetPasswordProcess: (
    data: Record<string, any>,
    token: string
  ) => Promise<any>;
  resetPassword: (data: Record<string, any>) => Promise<any>;
  SignIn: (data: Record<string, any>) => Promise<any>;
  profileUpdate: (data: Record<string, any>) => Promise<any>;
  updateProfile: (data: Record<string, any>) => Promise<any>;
  forgotPassword: (data: Record<string, any>) => Promise<any>;
  resendOtp: () => Promise<any>;
  logout: () => Promise<any>;
  getProfile: () => Promise<any>;
  getUser: () => Promise<any>;
  getAllLifeArea: () => Promise<any>;
}

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, 
  maxContentLength: 20 * 1024 * 1024, 
  maxBodyLength: 20 * 1024 * 1024, 
}) as any;

axiosInstance.interceptors.request.use(
  (config: any): any => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.authorization = token;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

axiosInstance.registerUser = (data: Record<string, any>) => {
  return axiosInstance.post("/auth/register", data);
};
axiosInstance.updateProfile = (data: Record<string, any>) => {
  return axiosInstance.patch("/auth/profile/update", data);
};

axiosInstance.otpVerification = (data: Record<string, any>) => {
  const emailToken = localStorage.getItem("email_token");
  return axiosInstance.post(
    "/auth/verify",
    {
      ...data,
    },
    {
      headers: {
        authorization: emailToken,
      },
    }
  );
};

axiosInstance.resendOtp = (data: Record<string, any>) => {
  const emailToken = localStorage.getItem("email_token");
  return axiosInstance.post("/auth/resend-otp", data, {
    headers: {
      authorization: emailToken,
    },
  });
};

axiosInstance.loginUser = (data: Record<string, any>) => {
  return axiosInstance.post("/auth/login", data);
};

axiosInstance.forgotPassword = (data: Record<string, any>) => {
  return axiosInstance.post("/auth/generateForgetLink", data);
};
axiosInstance.resetPasswordProcess = (
  data: Record<string, any>,
  token: Record<string, any>
) => {
  return axiosInstance.post("/auth/new-password", data, {
    headers: {
      authorization: token,
    },
  });
};
axiosInstance.resetPassword = (data: Record<string, any>) => {
  return axiosInstance.patch("/auth/resetpassword", data);
};
axiosInstance.logout = () => {
  const token = Cookies.get("token");
  return axiosInstance.get("/auth/logout", {
    headers: {
      authorization: token,
    },
  });
};
axiosInstance.getTodos = () => {
  const token = Cookies.get("token");
  return axiosInstance.get("/client/conversation/todo/get-all", {
    headers: {
      authorization: token,
    },
  });
};
axiosInstance.reminderAll = () => {
  const token = Cookies.get("token");
  return axiosInstance.get("/client/reminder/get-all", {
    headers: {
      authorization: token,
    },
  });
};

axiosInstance.createMessage = (data: any) => {
  return axiosInstance.post("/client/messages/create", data);
};

axiosInstance.createEvent = (data: any) => {
  return axiosInstance.post("/client/calendar-event/create", data);
};

axiosInstance.getConversation = () => {
  return axiosInstance.get("/client/conversation/get/all");
};
axiosInstance.getConversationMessage = (id: any) => {
  return axiosInstance.get(`/client/messages/user`);
};

axiosInstance.updateGoals = (id: any, data: any) => {
  return axiosInstance.patch(`/client/goal/update/${id}`, data);
};
axiosInstance.updateReminder = (id: any, data: any) => {
  return axiosInstance.patch(`/client/reminder/update/${id}`, data);
};

axiosInstance.updateEvent = (id: any, data: any) => {
  return axiosInstance.patch(`/client/calendar-event/update/${id}`, data);
};
axiosInstance.deleteGoal = (id: any) => {
  return axiosInstance.delete(`/client/goal/delete/${id}`);
};
axiosInstance.deleteReminder = (id: any) => {
  return axiosInstance.delete(`/client/reminder/delete/${id}`);
};
axiosInstance.deleteJournal = (id: any) => {
  return axiosInstance.delete(`/client/journal/delete/${id}`);
};
axiosInstance.deleteEvent = (id: any) => {
  return axiosInstance.delete(`/client/calendar-event/delete/${id}`);
};
axiosInstance.addGoals = (data: any) => {
  return axiosInstance.post(`/client/goal/create`, data);
};
axiosInstance.addReminder = (data: any) => {
  return axiosInstance.post(`/client/reminder/create`, data);
};
axiosInstance.addJournal = (data: any) => {
  return axiosInstance.post(`/client/journal/create`, data);
};
axiosInstance.clearChat = () => {
  return axiosInstance.delete(`/client/messages/delete-all`);
};
axiosInstance.getAllLifeArea = () => {
  return axiosInstance.get(`/client/life-areas/get-all`);
};

axiosInstance.getUser = () => {
  const token = Cookies.get("token");
  return axiosInstance.get("/auth", {
    headers: {
      authorization: token,
    },
  });
};

const API: CustomAxiosInstance = axiosInstance;

export { API };