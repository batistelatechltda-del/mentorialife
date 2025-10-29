"use client";

import type React from "react";


import {
  Plus,
  MessageSquare,
  MoreHorizontal,
  Trash2,
  Edit3,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Chat from "./Chat";  // Correto
import Link from "next/link";

interface Chat {
  id: string;
  title: string;
  timestamp?: string;
  isActive?: boolean;
}

interface ChatSidebarProps {
  chats: Chat[];
  onNewChat?: () => void;
  onChatSelect?: (chatId: string) => void;
  onChatDelete?: (chatId: string) => void;
  onChatRename?: (chatId: string) => void;
}

export function ChatSidebar({
  chats,
  onNewChat,
  onChatSelect,
  onChatDelete,
  onChatRename,
}: ChatSidebarProps) {

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const handleChatSelect = (chatId: string) => {
    setSelectedChatId(chatId);  // Atualiza o chat selecionado
    onChatSelect?.(chatId);  // Chama a função de seleção (caso haja)
  };
  
  
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const groupedChats = chats?.reduce((groups: any, chat: any) => {
    const period = formatTimestamp(chat.created_at) || "Older";
    if (!groups[period]) groups[period] = [];
    groups[period].push(chat);
    return groups;
  }, {});

  const timeOrder = [
    "Today",
    "Yesterday",
    "Previous 7 Days",
    "Previous 30 Days",
    "Older",
  ];
  const sortedGroups = Object.entries(groupedChats).sort(([a], [b]) => {
    const aIndex = timeOrder.indexOf(a);
    const bIndex = timeOrder.indexOf(b);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDropdownToggle = (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setOpenDropdown(openDropdown === chatId ? null : chatId);
  };

  const handleDropdownAction = (
    action: () => void,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();
    action();
    setOpenDropdown(null);
  };

  return (
    <div className="flex h-screen w-72 rounded-2xl flex-col bg-slate-700/20">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          Chat
        </h1>
        <button
          onClick={onNewChat}
          className="h-7 w-7 p-0 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center text-sm justify-center transition-colors"
        >
          <Plus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          <span className="sr-only">New Chat</span>
        </button>
      </div>

      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-start gap-2 h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
        >
          <Plus className="h-4 w-4" />
          New chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="h-8 w-8 text-gray-400 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              No conversations yet
            </p>
            <button
              onClick={onNewChat}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            >
              Start your first chat
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedGroups.map(([period, periodChats]: any) => (
              <div key={period}>
                <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2">
                  {period}
                </h3>
                <div className="space-y-1">
                  {periodChats?.map((chat: any) => (
                    <Link
                      href={`/dashboard?conversation_id=${chat?.id}`}
                      key={chat.id}
                      className={`group relative flex items-center gap-2 rounded-lg px-2 py-2 text-sm cursor-pointer transition-colors ${
                        chat.isActive
                          ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                      onClick={() => onChatSelect?.(chat.id)}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0 text-gray-400" />
                      <span className="flex-1 truncate font-medium">
                        {chat.title}
                      </span>
                       <div>

      {/* Renderiza o componente Chat quando um chat é selecionado */}
      {selectedChatId && <Chat chatId={selectedChatId} />}
    </div>

                      <div className="relative" ref={dropdownRef}>
                        <button
                          onClick={(e) => handleDropdownToggle(chat.id, e)}
                          className="h-6 w-6 p-0 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-all"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                          <span className="sr-only">Chat options</span>
                        </button>

                        {openDropdown === chat.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50">
                            <div className="py-1">
                              <button
                                onClick={(e) =>
                                  handleDropdownAction(
                                    () => onChatRename?.(chat.id),
                                    e
                                  )
                                }
                                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Rename
                              </button>
                              <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                              <button
                                onClick={(e) =>
                                  handleDropdownAction(
                                    () => onChatDelete?.(chat.id),
                                    e
                                  )
                                }
                                className="w-full flex items-center px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
}
