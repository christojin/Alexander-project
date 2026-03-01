"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout";
import { useChat } from "@/hooks/useChat";
import { cn, formatDateTime } from "@/lib/utils";
import {
  MessageSquare,
  Send,
  Paperclip,
  ArrowLeft,
  Loader2,
  User,
} from "lucide-react";

export default function SellerChatPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout role="seller">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        </DashboardLayout>
      }
    >
      <SellerChatContent />
    </Suspense>
  );
}

function SellerChatContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id");

  const [activeId, setActiveId] = useState<string | null>(initialId);
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    conversations,
    messages,
    totalUnread,
    loading,
    sending,
    sendMessage,
  } = useChat({ role: "seller", activeConversationId: activeId });

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Focus textarea when conversation opens
  useEffect(() => {
    if (activeId) {
      textareaRef.current?.focus();
    }
  }, [activeId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "chat");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        await sendMessage("", data.url);
      }
    } catch {
      // Upload failed silently
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const activeConversation = conversations.find((c) => c.id === activeId);

  if (loading) {
    return (
      <DashboardLayout role="seller">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="seller">
      <div className="flex h-[calc(100vh-8rem)] rounded-xl border border-surface-200 bg-white shadow-sm overflow-hidden">
        {/* Left Panel: Conversation List */}
        <div
          className={cn(
            "w-full md:w-80 lg:w-96 border-r border-surface-200 flex flex-col shrink-0",
            activeId && "hidden md:flex"
          )}
        >
          <div className="border-b border-surface-100 px-4 py-3">
            <h2 className="text-lg font-bold text-surface-900">
              Mensajes
              {totalUnread > 0 && (
                <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-xs font-semibold text-white">
                  {totalUnread}
                </span>
              )}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <MessageSquare className="h-10 w-10 text-surface-300 mb-3" />
                <p className="text-sm font-medium text-surface-500">
                  No tienes conversaciones aun
                </p>
                <p className="text-xs text-surface-400 mt-1">
                  Los compradores te contactaran desde tus productos
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setActiveId(conv.id)}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors cursor-pointer border-b border-surface-50",
                    activeId === conv.id
                      ? "bg-primary-50"
                      : "hover:bg-surface-50"
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-100 text-surface-500">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-surface-900 truncate">
                        {conv.otherPartyName}
                      </p>
                      {conv.lastMessageAt && (
                        <span className="text-[10px] text-surface-400 shrink-0">
                          {formatDateTime(conv.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    {conv.productName && (
                      <p className="text-[11px] text-primary-500 truncate">
                        {conv.productName}
                      </p>
                    )}
                    {conv.lastMessage && (
                      <p className="text-xs text-surface-500 truncate mt-0.5">
                        {conv.lastMessage}
                      </p>
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="mt-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-[10px] font-bold text-white shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Message Thread */}
        <div
          className={cn(
            "flex-1 flex flex-col",
            !activeId && "hidden md:flex"
          )}
        >
          {!activeId ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
              <MessageSquare className="h-12 w-12 text-surface-200 mb-3" />
              <p className="text-sm text-surface-400">
                Selecciona una conversacion para ver los mensajes
              </p>
            </div>
          ) : (
            <>
              {/* Conversation Header */}
              <div className="flex items-center gap-3 border-b border-surface-100 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setActiveId(null)}
                  className="md:hidden rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 cursor-pointer"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-100 text-surface-500">
                  <User className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-surface-900 truncate">
                    {activeConversation?.otherPartyName ?? "Chat"}
                  </p>
                  {activeConversation?.productName && (
                    <p className="text-[11px] text-primary-500 truncate">
                      {activeConversation.productName}
                    </p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare className="h-8 w-8 text-surface-200 mb-2" />
                    <p className="text-xs text-surface-400">
                      Envia un mensaje para iniciar la conversacion
                    </p>
                  </div>
                )}
                {messages.map((msg) => {
                  const isMine = msg.senderRole === "seller";
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        isMine ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[75%] rounded-2xl px-4 py-2.5",
                          isMine
                            ? "bg-primary-600 text-white rounded-br-md"
                            : "bg-surface-100 text-surface-800 rounded-bl-md"
                        )}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className={cn(
                              "text-xs font-semibold",
                              isMine ? "text-white/90" : "text-surface-700"
                            )}
                          >
                            {msg.senderName}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-medium px-1.5 py-0.5 rounded",
                              isMine
                                ? "bg-white/20 text-white/80"
                                : "bg-surface-200 text-surface-500"
                            )}
                          >
                            {isMine ? "Tu" : "Comprador"}
                          </span>
                        </div>
                        {msg.imageUrl && (
                          <a
                            href={msg.imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block mb-1.5"
                          >
                            <img
                              src={msg.imageUrl}
                              alt="Imagen adjunta"
                              className="max-w-full max-h-48 rounded-lg object-cover"
                            />
                          </a>
                        )}
                        {msg.content && (
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.content}
                          </p>
                        )}
                        <p
                          className={cn(
                            "text-[11px] mt-1",
                            isMine ? "text-white/60" : "text-surface-400"
                          )}
                        >
                          {formatDateTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-surface-100 px-4 py-3">
                <div className="flex items-end gap-2">
                  <label className="shrink-0 cursor-pointer rounded-lg p-2 text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading || sending}
                    />
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Paperclip className="h-5 w-5" />
                    )}
                  </label>
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 resize-none rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-800 placeholder:text-surface-400 outline-none transition-colors focus:border-primary-400 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className={cn(
                      "shrink-0 rounded-lg p-2 transition-colors cursor-pointer",
                      input.trim()
                        ? "bg-primary-600 text-white hover:bg-primary-700"
                        : "bg-surface-100 text-surface-300"
                    )}
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-surface-400">
                  Presiona Enter para enviar, Shift+Enter para salto de linea.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
