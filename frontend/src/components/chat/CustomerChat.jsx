// src/components/chat/CustomerChat.jsx
import React, { useEffect, useRef, useState } from "react";

import "../../styles/chat/CustomerChat.css";

export default function CustomerChat({ customerId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [autoScroll, setAutoScroll] = useState(true);
  const [myName, setMyName] = useState(localStorage.getItem("customerName") || "");

  const BACKEND_URL = "http://localhost:8081";
  const token = localStorage.getItem("token");
  const listEndRef = useRef(null);
  const containerRef = useRef(null);

  // Fetch my info once (for label guard)
  useEffect(() => {
    if (!token) return;
    fetch(`${BACKEND_URL}/api/chat/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.name) {
          setMyName(d.name);
          localStorage.setItem("customerName", d.name);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!customerId) return;
    fetchMessages();
    const id = setInterval(fetchMessages, 3000);
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, [customerId]);

  const fetchMessages = async () => {
    if (!customerId) return;
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/chat/customer/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) || [];
        // ensure chronological order by sentAt
        data.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
        setMessages(data);
        if (autoScroll) smoothScrollToEnd();
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const smoothScrollToEnd = () => {
    requestAnimationFrame(() => {
      listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  };

  const onScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAutoScroll(dist < 50);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput("");

    try {
      await fetch(`${BACKEND_URL}/api/chat/customer/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
      });
      await fetchMessages();
      smoothScrollToEnd();
    } catch {
      // optionally toast
    }
  };


  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="customerchat-wrap">
      <div className="customerchat-box">
        <div className="customerchat-header">
          <div className="customerchat-title">💬 Chat Support </div>
        </div>

        <div
          className="customerchat-messages"
          ref={containerRef}
          onScroll={onScroll}
        >
          {loading && <div className="customerchat-loading">Loading chat…</div>}

          {(() => {
            let lastDate = null;
            return messages.map((msg) => {
              const msgDate = new Date(msg.sentAt);
              const dateStr = msgDate.toLocaleDateString();
              let showDate = false;
              if (lastDate !== dateStr) {
                showDate = true;
                lastDate = dateStr;
              }

              const mine = msg.senderType === "CUSTOMER";
              const side = mine ? "right" : "left";

              // SAFEGUARD: never show my own (customer) name beside Admin
              let adminLabel = "Admin";
              if (!mine && msg.senderType === "ADMIN") {
                if (msg.adminName && msg.adminName !== myName) {
                  adminLabel = `Admin (${msg.adminName})`;
                }
              }

              return (
                <React.Fragment key={msg.id}>
                  {showDate && (
                    <div className="customerchat-date-separator">
                      {msgDate.toLocaleDateString(undefined, {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  )}
                  <div className={`customerchat-row ${side}`}>
                    <div className="customerchat-bubble">
                      <div className="customerchat-bubble-head">
                        <span className="customerchat-sender">
                          {mine ? "You" : adminLabel}
                        </span>
                        <span className="customerchat-time">
                          {msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="customerchat-text">{msg.message}</div>
                    </div>
                  </div>
                </React.Fragment>
              );
            });
          })()}

          <div ref={listEndRef} />
        </div>

        <div className="customerchat-inputrow">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message…"
            rows={1}
          />
          

          

          <button className="customerchat-send" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
