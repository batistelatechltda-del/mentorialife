"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  PanelRight,
  X,
  Send,
  Loader2,
  User,
  Bot,
  Mic,
  MicOff,
} from "lucide-react";
import Link from "next/link";
import { logout } from "@/lib/utils";
import { useUser } from "@/store/user/userState";
import { ChatSidebar } from "@/components/chat-sidebar";
import Sidebar from "@/components/Sidebar";
import { API } from "@/services";
import Image from "next/image";
import { SpeechSettings } from "@/components/speech-settings";
import { defaultSpeechConfig, type SpeechConfig } from "@/lib/speech-utils";
import usePusher from "@/lib/pusher";
import { requestPermissionAndRegisterToken } from "@/firebase";

interface Message {
  id: string;
  message: string;
  sender: "USER" | "mentor" | "BOT";
  timestamp: Date;
}

interface DashboardProps {
  conversation_id?: string;
  conversation?: any;
  sidebarData?: any;
}

const Dashboard: React.FC<DashboardProps> = ({
  conversation_id,
  conversation,
  sidebarData,
}) => {
   
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [speechConfig, setSpeechConfig] =
    useState<SpeechConfig>(defaultSpeechConfig);
  const [showSpeechSettings, setShowSpeechSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const adminMenuRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const { user }: any = useUser();

   // Função para formatar o texto com parágrafos
  const formatMessage = (text: string) => {
    if (!text) return "";
    // Protege o HTML básico
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const safe = esc(text);

    // Substitui quebras duplas de linha por <br/><br/> e simples por <br/>
    return safe.replace(/\n{2,}/g, "<br/><br/>").replace(/\n/g, "<br/>");
  };

  

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        adminMenuRef.current &&
        !adminMenuRef.current.contains(event.target as Node)
      ) {
        setShowAdminMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const res = await API.getConversationMessage();
      const formattedMessages = res.data.data.map((msg: any, index: number) => ({
        id: `${index}`,
        message: formatMessage(msg.message),  // Formatar aqui
        sender: msg.sender === "USER" ? "USER" : "BOT", 
        timestamp: new Date(msg.timestamp || Date.now()),
      }));
      setMessages(formattedMessages);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  usePusher(user?.id ? `user-${user?.id}` : "", "notification", (msg: any) => {
    const formattedMessage = {
      ...msg,
      timestamp: new Date(msg.timestamp),
    };
    setMessages((prev) => [...prev, formattedMessage]);
    router.refresh();
  });

  useEffect(() => {
    loadMessages();
  }, []);

  const showToast = (
    title: string,
    message: string,
    type: "success" | "error" = "success"
  ) => {
    alert(`${title}: ${message}`);
  };

    const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Adiciona a mensagem do usuário ao estado
    const userMessage = {
      id: Date.now().toString(),
      message: inputValue.trim(),
      sender: "USER",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      const payload = {
        message: userMessage.message,
      };
      const response = await API.createMessage(payload);

      // Adiciona a resposta do mentor (AI)
      setTimeout(() => {
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          message: response.data.reply || "I'm here to help!",
          sender: "mentor",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsTyping(false);
      }, 1000);

      // Agora que o usuário enviou a mensagem, solicite permissão para notificações
      if (user?.id) {
        await requestPermissionAndRegisterToken(user.id);
      }
      
      router.refresh();
    } catch (error) {
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm";
      }
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mimeType,
          });
          await processAudioWithGoogleSpeech(audioBlob);
        } catch (error) {
          console.error("Error processing audio:", error);
        } finally {
          stream.getTracks().forEach((track) => track.stop());
        }
      };
      mediaRecorder.start();
      setIsRecording(true);
      setIsProcessingSpeech(false);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessingSpeech(true);
    }
  };

  const processAudioWithGoogleSpeech = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("language", speechConfig.language || "en-US");
      const response = await fetch("/api/speech-to-text", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error(
          `Failed to process speech (status: ${response.status})`
        );
      }
      const data = await response.json();
      if (data.transcript && data.transcript.trim() !== "") {
        setInputValue(data.transcript);
      } else {
        console.warn("No transcript returned or empty transcript");
        setInputValue("");
      }
    } catch (error) {
      console.error("Error during speech processing:", error);
    } finally {
      setIsProcessingSpeech(false);
    }
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleClearHistory = async () => {
    await API.clearChat();
    setMessages([]);
    setShowAdminMenu(false);
    showToast(
      "Chat Cleared",
      "Chat history has been cleared successfully.",
      "success"
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
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
    <div className="flex h-screen overflow-hidden bg-black from-slate-950 bg-gradient-to-b text-white relative">
      <div
        ref={starsRef}
        className="fixed inset-0 overflow-hidden pointer-events-none"
        style={{ zIndex: 0 }}
      />

      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-md bg-gray-100/10 backdrop-blur-lg border border-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 shadow-lg shadow-purple-500/20"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? (
          <X size={20} className="text-white" />
        ) : (
          <PanelRight size={20} className="text-white" />
        )}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-black/40 backdrop-blur-xl border-r border-white/10 transition-transform duration-300 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex-shrink-0 p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse">
              Dashboard
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Sidebar
              sidebarData={sidebarData}
              activeRoute={pathname}
              toggleTheme={() => {}}
              isDarkMode={false}
            />
          </div>
        </div>
      </aside>

      <div className="flex-1 z-10 flex flex-col min-w-0">
        <header className="flex-shrink-0 border-b border-white/10 bg-black/30 backdrop-blur-xl">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-purple-900/50 border border-purple-500/30 px-2.5 py-0.5 text-xs font-semibold text-purple-200 shadow-lg shadow-purple-500/20">
                Mentor: {user?.profile?.mentor_name || "Jarvis"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/lifearea"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 disabled:opacity-50 disabled:pointer-events-none bg-transparent hover:bg-white/10 px-3 py-1.5 text-white hover:text-purple-200 border border-transparent hover:border-white/10 backdrop-blur-sm"
              >
                Lifearea Map
              </Link>
              <Link
                href="/dashboard/profile"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 disabled:opacity-50 disabled:pointer-events-none bg-transparent hover:bg-white/10 px-3 py-1.5 text-white hover:text-purple-200 border border-transparent hover:border-white/10 backdrop-blur-sm"
              >
                Profile
              </Link>
              <Link
                href="/dashboard/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 disabled:opacity-50 disabled:pointer-events-none bg-transparent hover:bg-white/10 px-3 py-1.5 text-white hover:text-purple-200 border border-transparent hover:border-white/10 backdrop-blur-sm"
              >
                Settings
              </Link>
              <button
                onClick={() => logout(router)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 disabled:opacity-50 disabled:pointer-events-none bg-transparent hover:bg-white/10 px-3 py-1.5 text-white hover:text-purple-200 border border-transparent hover:border-white/10 backdrop-blur-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex min-h-0">
          <div className="w-80 border-r border-white/10 bg-black/20 backdrop-blur-lg hidden lg:block overflow-y-auto">
            <ChatSidebar chats={conversation} />
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/30 scrollbar-track-transparent">
              <div className="p-4">
                <div className="space-y-4 max-w-5xl mx-auto">
                  {isLoading && messages.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2 text-purple-400" />
                      <span className="text-purple-300">
                        Loading messages...
                      </span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="relative mx-auto mb-6 w-24 h-24 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 blur-xl animate-pulse"></div>
                        <Bot className="h-12 w-12 text-purple-300 relative z-10" />
                      </div>
                      <h3 className="text-xl font-medium mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                        Start a conversation
                      </h3>
                      <p className="text-purple-300/80">
                        Send a message to begin chatting with your mentor AI.
                      </p>
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex gap-3 ${
                          message.sender === "USER"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        {(message.sender === "mentor" || message.sender === "BOT") && (
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center mt-1 flex-shrink-0 shadow-lg shadow-purple-500/30 border border-white/20">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-[70%] ${
                            message.sender === "USER" ? "order-first" : ""
                          }`}
                        >
                          <div
                            className={`p-3 rounded-lg ${
                              message.sender === "USER"
                                ? "bg-gradient-to-r from-blue-600 to-purple-700 text-white ml-auto shadow-lg shadow-purple-500/20 border border-white/10"
                                : "bg-black/40 backdrop-blur-md text-white border border-white/10 shadow-lg"
                            }`}
                          >
                            <div
                              dangerouslySetInnerHTML={{
                                __html: message.message,
                              }}
                              className="text-sm leading-relaxed"
                            />
                          </div>
                        </div>
                        {message.sender === "USER" && (
                          <>
                            {user.profile.profile_picture_url ? (
                              <div className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-white/20 shadow-lg shadow-purple-500/30">
                                <Image
                                  src={
                                    user.profile.profile_picture_url ||
                                    "/placeholder.svg" ||
                                    "/placeholder.svg"
                                  }
                                  width={500}
                                  height={500}
                                  alt="Profile"
                                  className="h-8 w-8 object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center mt-1 flex-shrink-0 shadow-lg shadow-purple-500/30 border border-white/20">
                                <User className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))
                  )}
                  {isTyping && (
                    <div className="flex gap-3 justify-start">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center mt-1 flex-shrink-0 shadow-lg shadow-purple-500/30 border border-white/20">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="p-3 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 shadow-lg">
                        <div className="flex items-center gap-1">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                          </div>
                          <span className="text-xs text-purple-300 ml-2">
                            Mentor is typing...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>

            <div className="relative">
              {isProcessingSpeech && (
                <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-sm border border-white/20">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <div className="absolute inset-0 h-5 w-5 animate-ping bg-white/30 rounded-full"></div>
                      </div>
                      <span className="text-sm font-medium">
                        Processing your voice...
                      </span>
                      <div className="flex gap-1">
                        <div className="w-1 h-4 bg-white/60 rounded-full animate-pulse"></div>
                        <div
                          className="w-1 h-4 bg-white/60 rounded-full animate-pulse"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-1 h-4 bg-white/60 rounded-full animate-pulse"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-black/30 backdrop-blur-xl border-t border-white/10">
                <div className="max-w-5xl mx-auto py-5">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="relative"
                  >
                    <div className="relative bg-black/40 rounded-2xl border border-white/20 shadow-lg hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 focus-within:ring-2 focus-within:ring-purple-500/30 focus-within:border-purple-500/50 backdrop-blur-xl">
                      <div className="flex items-center gap-3 px-4 py-2.5">
                        <div className="flex-1 relative">
                          <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Share your thoughts with your AI mentor..."
                            disabled={isLoading}
                            className="w-full bg-transparent text-white placeholder-purple-300/70 focus:outline-none text-base leading-relaxed disabled:opacity-50"
                          />
                          {isLoading && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleVoiceInput}
                          disabled={isLoading || isProcessingSpeech}
                          className={`relative group p-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed ${
                            isRecording
                              ? "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-500/25 scale-105"
                              : "bg-black/60 hover:bg-black/80 text-white shadow-md hover:shadow-lg border border-white/10 hover:border-white/20"
                          }`}
                        >
                          {isRecording ? (
                            <>
                              <MicOff className="h-5 w-5" />
                              <div className="absolute inset-0 rounded-xl bg-red-500/20 animate-pulse"></div>
                              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 opacity-20 blur animate-pulse"></div>
                            </>
                          ) : (
                            <>
                              <Mic className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                              {!isProcessingSpeech && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                              )}
                            </>
                          )}
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading || !inputValue.trim()}
                          className="group relative p-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-purple-500/50"
                        >
                          <Send className="h-5 w-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                          {!isLoading && inputValue.trim() && (
                            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-600 to-purple-700 opacity-20 blur animate-pulse"></div>
                          )}
                        </button>
                      </div>
                      {isRecording && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg animate-bounce border border-white/20">
                            Recording...
                          </div>
                        </div>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <SpeechSettings
        config={speechConfig}
        onConfigChange={setSpeechConfig}
        isOpen={showSpeechSettings}
        onClose={() => setShowSpeechSettings(false)}
      />
    </div>
  );
};

export default Dashboard;
