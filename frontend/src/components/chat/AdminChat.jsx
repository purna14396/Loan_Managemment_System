import React, { useEffect, useRef, useState } from "react";

import "../../styles/chat/AdminChat.css";

export default function AdminChat({ adminId }) {
  const [chats, setChats] = useState({});
  const [customerNames, setCustomerNames] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [input, setInput] = useState("");

  const [listOpen, setListOpen] = useState(false);
  // const [adminDisplayName, setAdminDisplayName] = useState(
  //   localStorage.getItem("adminName") || ""
  // );

  const token = localStorage.getItem("token");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const firstLoadRef = useRef(true);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);

  const BACKEND_URL = "http://localhost:8081";
  const parsedAdminId =
    adminId == null
      ? null
      : typeof adminId === "string"
      ? parseInt(adminId, 10)
      : adminId;

  // fetch my admin display name once
  // useEffect(() => {
  //   if (!token) return;
  //   fetch(`${BACKEND_URL}/api/chat/me`, {
  //     headers: { Authorization: `Bearer ${token}` },
  //   })
  //     .then((r) => (r.ok ? r.json() : null))
  //     .then((d) => {
  //       if (d?.name) {
  //         setAdminDisplayName(d.name);
  //         localStorage.setItem("adminName", d.name);
  //       }
  //     })
  //     .catch(() => {});
  //   // eslint-disable-next-line
  // }, []);

  // polling chats
  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, []);

  const fetchChats = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/chat/admin/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const data = await res.json();
      const grouped = {};
      const names = {};
      data.forEach((msg) => {
        const cid = String(msg.customerId);
        if (!grouped[cid]) grouped[cid] = [];
        grouped[cid].push(msg);
        if (msg.customerName) names[cid] = msg.customerName;
      });

      // optional: keep each list sorted by sentAt (asc)
      Object.keys(grouped).forEach((cid) => {
        grouped[cid].sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt));
      });

      setChats(grouped);
      setCustomerNames(names);

      if (firstLoadRef.current) {
        const firstKey = Object.keys(grouped)[0];
        if (firstKey) setSelectedCustomer(firstKey);
        firstLoadRef.current = false;
      } else {
        if (selectedCustomer !== null && !grouped[String(selectedCustomer)]) {
          setSelectedCustomer(null);
        }
      }
    } catch {
      // no-op
    }
  };

  const onScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setAutoScrollEnabled(distanceFromBottom < 50);
  };

  useEffect(() => {
    if (!autoScrollEnabled) return;
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [chats, selectedCustomer, autoScrollEnabled]);

  const sendReply = async () => {
    if (!input.trim() || !selectedCustomer) return;

    try {
      await fetch(`${BACKEND_URL}/api/chat/admin/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId: Number(selectedCustomer),
          message: input.trim(),
        }),
      });
      setInput("");
      fetchChats();
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } catch {
      // no-op
    }
  };


  const renderPeople = () => (
    <div className={`adminchat-people ${listOpen ? "open" : ""}`}>
      <div className="adminchat-people-header">
        <span>Customers</span>
        <button
          className="adminchat-close-list"
          onClick={() => setListOpen(false)}
          aria-label="Close list"
        >
          ✕
        </button>
      </div>

      {Object.keys(chats).length === 0 && (
        <div className="adminchat-empty">No customer messages yet.</div>
      )}

      <div className="adminchat-people-scroll">
        {Object.keys(chats).map((cid) => {
          const name = customerNames[cid] || `Customer ${cid}`;
          const isActive = String(selectedCustomer) === String(cid);
          return (
            <div
              key={cid}
              className={`adminchat-person ${isActive ? "active" : ""}`}
              onClick={() => {
                setSelectedCustomer(cid);
                setListOpen(false);
              }}
            >
              <div className="adminchat-avatar">
                {name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="adminchat-person-meta">
                <div className="adminchat-person-name">{name}</div>
                <div className="adminchat-person-sub">
                  {chats[cid]?.length || 0} messages
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="adminchat-wrap">
      <div className="adminchat-box">
        {renderPeople()}

        <div className="adminchat-panel">
          <div className="adminchat-header">
            <button
              className="adminchat-toggle-list"
              onClick={() => setListOpen(true)}
              aria-label="Open customer list"
            >
              ☰
            </button>
            {selectedCustomer ? (
              <div className="adminchat-title">
                Chat with{" "}
                <span className="adminchat-title-name">
                  {customerNames[selectedCustomer] ||
                    "Customer " + selectedCustomer}
                </span>
              </div>
            ) : (
              <div className="adminchat-title">Select a customer</div>
            )}
          </div>

          <div
            className="adminchat-messages"
            ref={messagesContainerRef}
            onScroll={onScroll}
          >
            {selectedCustomer &&
              chats[selectedCustomer] &&
              (() => {
                const msgs = chats[selectedCustomer];
                let lastDate = null;
                return msgs.map((msg, idx) => {
                  const msgDate = new Date(msg.sentAt);
                  const dateStr = msgDate.toLocaleDateString();
                  let showDate = false;
                  if (lastDate !== dateStr) {
                    showDate = true;
                    lastDate = dateStr;
                  }

                  const isAdminMsg = msg.senderType === "ADMIN";
                  const isMine =
                    isAdminMsg &&
                    msg.adminId &&
                    parsedAdminId &&
                    Number(msg.adminId) === Number(parsedAdminId);

                  const senderLabel = isMine
                    ? "You"
                    : isAdminMsg && msg.adminName
                    ? `Admin (${msg.adminName})`
                    : !isAdminMsg && customerNames[msg.customerId]
                    ? customerNames[msg.customerId]
                    : "Customer";

                  const side = isMine ? "right" : "left";

                  return (
                    <React.Fragment key={msg.id}>
                      {showDate && (
                        <div className="adminchat-date-separator">
                          {msgDate.toLocaleDateString(undefined, {
                            weekday: "short",
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      )}
                      <div className={`adminchat-msg adminchat-side-${side}`}>
                        <div className="adminchat-bubble">
                          <div className="adminchat-bubble-head">
                            <span className="adminchat-sender">{senderLabel}</span>
                            <span className="adminchat-time">
                              {msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>

                          </div>
                          <div className="adminchat-text">{msg.message}</div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                });
              })()}
            <div ref={messagesEndRef} />
          </div>

          {selectedCustomer && (
            <div className="adminchat-inputrow">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your reply…"
                spellCheck={false}
              />

              

              

              <button className="adminchat-send" onClick={sendReply}>
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
