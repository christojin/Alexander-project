"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ChatConversationSummary, ChatMsg } from "@/types";

interface UseChatOptions {
  role: "buyer" | "seller";
  activeConversationId?: string | null;
  pollingInterval?: number;
}

interface UseChatReturn {
  conversations: ChatConversationSummary[];
  messages: ChatMsg[];
  totalUnread: number;
  loading: boolean;
  sending: boolean;
  sendMessage: (content: string, imageUrl?: string) => Promise<void>;
  startConversation: (
    sellerId: string,
    productId?: string
  ) => Promise<string | null>;
  refreshConversations: () => Promise<void>;
}

export function useChat({
  role,
  activeConversationId,
  pollingInterval = 3000,
}: UseChatOptions): UseChatReturn {
  const [conversations, setConversations] = useState<
    ChatConversationSummary[]
  >([]);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const prevMessageCountRef = useRef(0);

  const basePath = `/api/${role}/chat`;

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(basePath);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch {
      // Silently fail — will retry on next poll
    }
  }, [basePath]);

  const fetchMessages = useCallback(async () => {
    if (!activeConversationId) return;
    try {
      const res = await fetch(`${basePath}/${activeConversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch {
      // Silently fail
    }
  }, [basePath, activeConversationId]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchConversations().finally(() => setLoading(false));
  }, [fetchConversations]);

  // Fetch messages when conversation changes
  useEffect(() => {
    if (activeConversationId) {
      setMessages([]);
      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [activeConversationId, fetchMessages]);

  // Poll conversations and active messages
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
      if (activeConversationId) {
        fetchMessages();
      }
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [
    fetchConversations,
    fetchMessages,
    activeConversationId,
    pollingInterval,
  ]);

  const sendMessage = useCallback(
    async (content: string, imageUrl?: string) => {
      if (!activeConversationId) return;
      setSending(true);
      try {
        const res = await fetch(`${basePath}/${activeConversationId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, imageUrl }),
        });
        if (res.ok) {
          const newMsg = await res.json();
          setMessages((prev) => [...prev, newMsg]);
          await fetchConversations();
        }
      } catch {
        // Error handling left to caller
      } finally {
        setSending(false);
      }
    },
    [basePath, activeConversationId, fetchConversations]
  );

  const startConversation = useCallback(
    async (
      sellerId: string,
      productId?: string
    ): Promise<string | null> => {
      try {
        const res = await fetch(basePath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sellerId, productId }),
        });
        if (res.ok) {
          const data = await res.json();
          await fetchConversations();
          return data.conversationId;
        }
      } catch {
        // Error handling left to caller
      }
      return null;
    },
    [basePath, fetchConversations]
  );

  const totalUnread = conversations.reduce(
    (sum, c) => sum + c.unreadCount,
    0
  );

  return {
    conversations,
    messages,
    totalUnread,
    loading,
    sending,
    sendMessage,
    startConversation,
    refreshConversations: fetchConversations,
  };
}
