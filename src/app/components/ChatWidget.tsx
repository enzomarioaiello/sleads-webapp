"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  X,
  Send,
  User,
  Bot,
  Plus,
  ChevronDown,
  LogIn,
  AlertTriangle,
} from "lucide-react";
import { useApp } from "../contexts/AppContext";
import Image from "next/image";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { authClient } from "../../lib/auth-client";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { t } = useApp();
  const [showSessionList, setShowSessionList] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);

  // Session Management
  const [sessionId, setSessionId] = useState("");

  // Auth
  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session;

  // Convex Hooks
  const remoteMessages = useQuery(
    api.chat.getMessages,
    sessionId ? { sessionId } : "skip"
  );
  const sendMessage = useAction(api.chatActions.sendMessage);
  const userSessions = useQuery(api.chat.getUserSessions);
  const createSession = useMutation(api.chat.createSession);

  // Initialize Session
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check for existing session ID in local storage
      const stored = localStorage.getItem("sleads_chat_session_id");

      // If user is authenticated, we might want to default to their last session or stay with local one?
      // Logic: If we have a stored session ID, use it. If not, and authenticated, wait for user to pick or start new?
      // For simplicity: Always try to use stored session. If none, create new one.

      if (!stored) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        startNewChat();
      } else {
        setSessionId(stored);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startNewChat = async () => {
    const newId = crypto.randomUUID();
    setIsTyping(true); // Show loading feedback
    try {
      await createSession({ sessionId: newId });
      localStorage.setItem("sleads_chat_session_id", newId);
      setSessionId(newId);
      setShowSessionList(false);
    } catch (e) {
      console.error("Failed to create session", e);
      // Fallback to local only for now until message sent
      localStorage.setItem("sleads_chat_session_id", newId);
      setSessionId(newId);
    } finally {
      setIsTyping(false);
    }
  };

  const switchSession = (id: string) => {
    setSessionId(id);
    localStorage.setItem("sleads_chat_session_id", id);
    setShowSessionList(false);
  };

  // Derived State
  const messages: Message[] = useMemo(() => {
    let combinedMessages: Message[] = [];

    if (remoteMessages && remoteMessages.length > 0) {
      combinedMessages = remoteMessages.map((msg) => ({
        id: msg._id,
        text: msg.content,
        sender: msg.role === "user" ? "user" : "bot",
        timestamp: new Date(msg.createdAt),
      }));
    } else if (remoteMessages !== undefined) {
      // Only show welcome if loaded and empty
      combinedMessages = [
        {
          id: "welcome",
          text: t("chat.welcome"),
          sender: "bot",
          timestamp: new Date(),
        },
      ];
    }

    // Deduplicate optimistic messages that are already in remote
    // We match by content and sender since IDs won't match
    const dedupedOptimistic = optimisticMessages.filter(
      (optMsg) =>
        !combinedMessages.some(
          (remoteMsg) =>
            remoteMsg.text === optMsg.text && remoteMsg.sender === optMsg.sender
        )
    );

    return [...combinedMessages, ...dedupedOptimistic];
  }, [remoteMessages, optimisticMessages, t]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  const handleSend = async () => {
    if (!inputValue.trim() || !sessionId) return;

    const messageContent = inputValue;
    setInputValue("");
    setIsTyping(true);

    // Optimistically update UI
    const tempId = Date.now().toString();
    const optimisticMsg: Message = {
      id: tempId,
      text: messageContent,
      sender: "user",
      timestamp: new Date(),
    };

    setOptimisticMessages((prev) => [...prev, optimisticMsg]);

    try {
      await sendMessage({ sessionId, message: messageContent });
      // Remove from optimistic once sent (or let it be deduped by ID if we could, but IDs differ)
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId));
    } catch (error) {
      console.error("Failed to send message:", error);
      // Optional: Show error toast or message in chat
      // Keep optimistic message but mark as error? For now just remove.
      setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 w-[90vw] md:w-[380px] h-[600px] max-h-[80vh] bg-white/90 dark:bg-sleads-midnight/90 backdrop-blur-xl border border-slate-200 dark:border-sleads-slate700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-sleads-slate700 bg-slate-50/50 dark:bg-sleads-slate900/50 flex justify-between items-center relative overflow-hidden z-20">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-sleads-blue via-blue-400 to-sleads-blue animate-gradient bg-size-[200%_auto]"></div>

              <div className="flex items-center gap-3 relative z-10 flex-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sleads-blue/20">
                  <Image
                    src="/images/logo.png"
                    alt="Sleads"
                    width={40}
                    height={40}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading font-bold text-slate-900 dark:text-white leading-tight">
                      {t("chat.title")}
                    </h3>
                    {isAuthenticated && (
                      <button
                        onClick={() => setShowSessionList(!showSessionList)}
                        className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                      >
                        <ChevronDown
                          className={`w-3 h-3 transition-transform ${showSessionList ? "rotate-180" : ""}`}
                        />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] font-mono text-sleads-blue dark:text-blue-300 uppercase tracking-wide opacity-80">
                    {t("chat.subtitle")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={startNewChat}
                  className="p-2 text-slate-400 hover:text-sleads-blue dark:hover:text-blue-400 transition-colors"
                  title="New Chat"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Session List Dropdown */}
            <AnimatePresence>
              {showSessionList && isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-slate-50 dark:bg-sleads-slate800 border-b border-slate-200 dark:border-sleads-slate700 overflow-hidden z-10"
                >
                  <div className="p-2 max-h-40 overflow-y-auto custom-scrollbar">
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-sleads-slate400 mb-2 px-2">
                      Previous Chats
                    </h4>
                    {userSessions && userSessions.length > 0 ? (
                      <div className="space-y-1">
                        {userSessions.map((s) => (
                          <button
                            key={s._id}
                            onClick={() => switchSession(s.sessionId)}
                            className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between ${
                              sessionId === s.sessionId
                                ? "bg-sleads-blue/10 text-sleads-blue dark:bg-sleads-blue/20 dark:text-blue-300"
                                : "hover:bg-black/5 dark:hover:bg-white/5 text-slate-700 dark:text-sleads-slate200"
                            }`}
                          >
                            <span className="truncate">
                              Chat {new Date(s.createdAt).toLocaleDateString()}
                            </span>
                            {sessionId === s.sessionId && (
                              <span className="w-2 h-2 rounded-full bg-sleads-blue"></span>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 px-2 pb-2">
                        No previous chats found.
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Unauthenticated Warning */}
            {!isAuthenticated && (
              <div className="bg-amber-50 dark:bg-amber-900/20 px-4 py-2 border-b border-amber-100 dark:border-amber-900/50 flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 dark:text-amber-200">
                  <p className="mb-1">
                    You won&apos;t be able to access this chat later if you
                    close the browser.
                  </p>
                  <Link
                    href="/auth/signin"
                    className="font-semibold hover:underline flex items-center gap-1"
                  >
                    Sign in to save history <LogIn className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${
                    msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.sender === "user"
                        ? "bg-slate-200 dark:bg-sleads-slate700 text-slate-600 dark:text-sleads-slate300"
                        : "bg-sleads-blue/10 dark:bg-sleads-blue/20 text-sleads-blue"
                    }`}
                  >
                    {msg.sender === "user" ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>

                  <div
                    className={`p-3.5 max-w-[80%] rounded-2xl text-sm leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-sleads-blue text-white rounded-tr-sm shadow-md shadow-sleads-blue/10"
                        : "bg-white dark:bg-sleads-slate900 border border-slate-100 dark:border-sleads-slate700 text-slate-700 dark:text-sleads-slate100 rounded-tl-sm shadow-sm"
                    }`}
                  >
                    <div className="prose dark:prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          a: ({ node, ...props }) => (
                            <a
                              {...props}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 dark:text-blue-400 underline hover:text-blue-600 dark:hover:text-blue-300"
                            />
                          ),
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          p: ({ node, ...props }) => (
                            <p {...props} className="mb-2 last:mb-0" />
                          ),
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          ul: ({ node, ...props }) => (
                            <ul
                              {...props}
                              className="list-disc list-inside mb-2"
                            />
                          ),
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          ol: ({ node, ...props }) => (
                            <ol
                              {...props}
                              className="list-decimal list-inside mb-2"
                            />
                          ),
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          li: ({ node, ...props }) => (
                            <li {...props} className="mb-1" />
                          ),
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          h1: ({ node, ...props }) => (
                            <h1
                              {...props}
                              className="text-lg font-bold mb-2 mt-2"
                            />
                          ),
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          h2: ({ node, ...props }) => (
                            <h2
                              {...props}
                              className="text-base font-bold mb-2 mt-2"
                            />
                          ),
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          h3: ({ node, ...props }) => (
                            <h3
                              {...props}
                              className="text-sm font-bold mb-1 mt-1"
                            />
                          ),
                          // eslint-disable-next-line @typescript-eslint/no-unused-vars
                          code: ({ node, ...props }) => (
                            <code
                              {...props}
                              className="bg-slate-100 dark:bg-slate-800 rounded px-1 py-0.5 text-xs font-mono"
                            />
                          ),
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-sleads-blue/10 dark:bg-sleads-blue/20 text-sleads-blue flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white dark:bg-sleads-slate900 border border-slate-100 dark:border-sleads-slate700 p-4 rounded-2xl rounded-tl-sm shadow-sm flex gap-1.5 items-center">
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
                      className="w-1.5 h-1.5 rounded-full bg-sleads-blue"
                    />
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        delay: 0.2,
                      }}
                      className="w-1.5 h-1.5 rounded-full bg-sleads-blue"
                    />
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{
                        repeat: Infinity,
                        duration: 1.5,
                        delay: 0.4,
                      }}
                      className="w-1.5 h-1.5 rounded-full bg-sleads-blue"
                    />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-sleads-midnight border-t border-slate-200 dark:border-sleads-slate700">
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={t("chat.placeholder")}
                  disabled={isTyping}
                  className="w-full bg-slate-100 dark:bg-sleads-slate900 border border-slate-200 dark:border-sleads-slate700 rounded-xl px-4 py-3 pr-12 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sleads-blue/50 transition-all placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isTyping}
                  className="absolute right-2 p-2 bg-sleads-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2 text-center">
                <span className="text-[10px] text-slate-400 dark:text-sleads-slate500">
                  {t("chat.subtitle")}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="fixed bottom-6 right-6 z-50 group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-sleads-blue text-white shadow-xl shadow-sleads-blue/30 overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-tr from-sleads-blue to-blue-400 opacity-100 group-hover:opacity-90 transition-opacity" />

          {/* Animated Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border border-white/20 border-t-white/60"
          />

          <div className="relative z-10">
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                >
                  <X className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="open"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                >
                  <MessageSquare className="w-6 h-6 fill-current" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Tooltip */}
        <AnimatePresence>
          {isHovered && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="absolute right-16 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-white dark:bg-sleads-slate900 text-slate-900 dark:text-white text-xs font-bold rounded-lg shadow-lg whitespace-nowrap border border-slate-200 dark:border-sleads-slate700"
            >
              Chat with Sleads AI
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
};
