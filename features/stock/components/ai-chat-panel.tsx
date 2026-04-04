"use client";

/**
 * features/stock/components/ai-chat-panel.tsx — RayZar Frontend
 *
 * AI Chat panel for the stock detail page.
 * Sends messages to POST /api/v1/chat/{ticker} and displays conversation.
 * Powered by Claude claude-sonnet-4-6 when ANTHROPIC_API_KEY is configured on the backend.
 */

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AiChatPanelProps {
  ticker: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AiChatPanel({ ticker }: AiChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle @idea command: "@idea TICKER bullish text"
  async function handleIdeaCommand(text: string): Promise<string> {
    // Pattern: @idea [TICKER] text
    const match = text.match(/^@idea\s+([A-Z]{1,6})\s+(.+)$/i) ||
                  text.match(/^@idea\s+(.+)$/i);

    let ticker: string | undefined;
    let ideaText: string;

    if (match && match.length === 3) {
      // Has ticker
      ticker = match[1].toUpperCase();
      ideaText = match[2].trim();
    } else if (match && match.length === 2) {
      // No ticker (or general market idea)
      ideaText = match[1].trim();
      // Check if first word looks like a ticker
      const words = ideaText.split(/\s+/);
      if (words[0] && /^[A-Z]{1,6}$/i.test(words[0])) {
        ticker = words[0].toUpperCase();
        ideaText = words.slice(1).join(" ");
      }
    } else {
      return "Usage: @idea TICKER your idea text (e.g. '@idea NVDA bullish on AI chip demand')";
    }

    if (!ideaText) {
      return "Please include idea text after the ticker. Example: @idea NVDA bullish on AI chips";
    }

    try {
      const result = await apiClient.createIdea({
        ticker,
        text: ideaText,
        source: "chat",
      });

      if (result.success && result.data) {
        const tickerPart = ticker ? ` for ${ticker}` : "";
        return `Idea logged${tickerPart}: "${ideaText.slice(0, 60)}${ideaText.length > 60 ? "..." : ""}". Assessment pending review. [ID: ${result.data.id.slice(0, 8)}]`;
      } else {
        return "Failed to log idea. Please try again.";
      }
    } catch {
      return "Failed to connect to ideas service. Please try again.";
    }
  }

  async function sendMessage() {
    const text = inputValue.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue("");
    setLoading(true);

    try {
      // Handle @idea command locally
      if (text.toLowerCase().startsWith("@idea")) {
        const ideaResponse = await handleIdeaCommand(text);
        setMessages([...newMessages, { role: "assistant", content: ideaResponse }]);
        return;
      }

      // `messages` is the state BEFORE the current message was added, so it
      // already excludes the new user message — just take the last 10 turns.
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await apiClient.chatWithTicker(ticker, text, history);
      const responseText =
        res.data?.reply ??
        "I couldn't process that request. Please try again.";

      setMessages([...newMessages, { role: "assistant", content: responseText }]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Connection error. Please check the backend is running and try again.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-teal/20">
            <Bot className="h-3.5 w-3.5 text-accent-teal" />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            AI Intelligence
          </h3>
        </div>
        <span className="text-2xs text-text-muted">Powered by Claude</span>
      </div>

      {/* Messages area */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 ? (
          <div className="py-6 text-center space-y-2">
            <Bot className="h-8 w-8 text-text-muted mx-auto" />
            <p className="text-xs text-text-muted">
              Ask me anything about{" "}
              <span className="font-mono font-semibold text-accent-teal">{ticker}</span>
            </p>
            <div className="flex flex-col gap-1.5 mt-3">
              {[
                `Why did ${ticker} get this signal?`,
                `What are the key risks for ${ticker}?`,
                `What is the TA health score telling us?`,
                `@idea ${ticker} bullish on earnings beat`,
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInputValue(suggestion);
                    inputRef.current?.focus();
                  }}
                  className="rounded-lg border border-border bg-elevated px-3 py-2 text-left text-xs text-text-secondary hover:border-accent-teal/40 hover:text-text-primary transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              {/* Avatar */}
              <div
                className={cn(
                  "flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center",
                  msg.role === "user"
                    ? "bg-elevated border border-border"
                    : "bg-accent-teal/20"
                )}
              >
                {msg.role === "user" ? (
                  <User className="h-3 w-3 text-text-muted" />
                ) : (
                  <Bot className="h-3 w-3 text-accent-teal" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-xs leading-relaxed",
                  msg.role === "user"
                    ? "bg-accent-teal/15 text-text-primary border border-accent-teal/20"
                    : "bg-card border border-border text-text-secondary"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-2 items-center">
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-accent-teal/20 flex items-center justify-center">
              <Loader2 className="h-3 w-3 text-accent-teal animate-spin" />
            </div>
            <div className="rounded-lg border border-border bg-card px-3 py-2">
              <span className="text-xs text-text-muted">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="mt-3 flex gap-2 border-t border-border pt-3">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask about ${ticker}... or type @idea ${ticker} to log a trade idea`}
          disabled={loading}
          className="flex-1 rounded-lg border border-border bg-elevated px-3 py-2 text-xs text-text-primary placeholder-text-muted outline-none focus:border-accent-teal/60 disabled:opacity-50"
        />
        <button
          onClick={sendMessage}
          disabled={!inputValue.trim() || loading}
          className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-accent-teal text-background transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
