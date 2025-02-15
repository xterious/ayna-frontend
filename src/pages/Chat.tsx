import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

// Types
type Message = { text: string; timeStamp: string };
type SessionData = {
  sessionId: string | null;
  messages: Message[];
  name?: string;
};

export default function Chat() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>(
    []
  );
  const [newSessionName, setNewSessionName] = useState(""); // for renaming

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1) Initialize Socket
  useEffect(() => {
    if (!token) return;
    const newSocket = io("http://localhost:1337", {
      auth: { token },
    });
    setSocket(newSocket);

    // Listen for "message" event from server
    newSocket.on("message", (data: SessionData[]) => {
      console.log("Received message event from server:", data);
      // data is an array of updated sessions
      data.forEach((sessionObj) => {
        // If it's a newly created or updated session, store it
        setSessions((prev) => {
          const existingIndex = prev.findIndex(
            (s) => s.sessionId === sessionObj.sessionId
          );
          if (existingIndex > -1) {
            // Update existing
            const copy = [...prev];
            copy[existingIndex] = sessionObj;
            return copy;
          } else {
            // Add new
            return [...prev, sessionObj];
          }
        });

        // If it matches the current session, update messages and name
        if (sessionObj.sessionId && sessionObj.sessionId === currentSessionId) {
          setMessages(
            sessionObj.messages.map((m) => ({
              text: m.text,
              isUser: false,
            }))
          );
        }
      });
    });

    // Listen for renameSession event
    newSocket.on("renameSession", (data) => {
      console.log("renameSession event from server:", data);
      // data: { sessionId, name }
      const { sessionId, name } = data;
      setSessions((prev) => {
        return prev.map((s) =>
          s.sessionId === sessionId ? { ...s, name } : s
        );
      });
    });

    newSocket.on("error", (errMsg: string) => {
      console.error("Socket error:", errMsg);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [token, currentSessionId]);

  // 2) Fetch sessions from Strapi via REST
  useEffect(() => {
    async function fetchSessions() {
      if (!user || !token) return;

      try {
        const res = await fetch(
          `http://localhost:1337/api/chat-sessions?filters[user][id][$eq]=${user.id}&populate=*`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const json = await res.json();

        if (!json || !json.data || !Array.isArray(json.data)) {
          console.warn("No valid data returned from server");
          return;
        }

        const fetched = json.data.map((item: any) => ({
          sessionId: item.id.toString(),
          messages: item.attributes.messages || [],
          name: item.attributes.name || "Untitled Session",
        }));

        setSessions(fetched);

        // Optionally auto-select the first session if none is selected
        if (fetched.length > 0 && !currentSessionId) {
          const first = fetched[0];
          setCurrentSessionId(first.sessionId);
          setMessages(
            first.messages.map((m: any) => ({
              text: m.text,
              isUser: false,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching sessions:", error);
      }
    }

    fetchSessions();
  }, [user, token, currentSessionId]);

  // 3) Send message
  function sendMessage() {
    if (!socket) return;
    const messageText = inputRef.current?.value;
    if (!messageText) return;

    const timeStamp = new Date().toLocaleTimeString();

    // Build the updated session object
    let updatedSession: SessionData;
    if (currentSessionId) {
      // Try to find the existing session
      const existing = sessions.find((s) => s.sessionId === currentSessionId);
      if (existing) {
        updatedSession = {
          sessionId: currentSessionId,
          messages: [...existing.messages, { text: messageText, timeStamp }],
          name: existing.name,
        };
      } else {
        // Fallback: treat as new
        updatedSession = {
          sessionId: null,
          messages: [{ text: messageText, timeStamp }],
        };
      }
    } else {
      // No session ID => create new
      updatedSession = {
        sessionId: null,
        messages: [{ text: messageText, timeStamp }],
      };
    }

    // Update local messages (just for immediate UI feedback)
    setMessages((prev) => [...prev, { text: messageText, isUser: true }]);

    // Update the sessions array in local state
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.sessionId === currentSessionId);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = updatedSession;
        return copy;
      }
      return [...prev, updatedSession];
    });

    // Send to server as an array
    socket.emit("message", [updatedSession]);

    // Clear input
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  // 4) Create a brand-new session
  function handleNewSession() {
    setCurrentSessionId(null);
    setMessages([]);
  }

  // 5) Switch sessions in the sidebar
  function handleSessionClick(sessionId: string) {
    setCurrentSessionId(sessionId);
    const session = sessions.find((s) => s.sessionId === sessionId);
    if (session) {
      setMessages(
        session.messages.map((m) => ({ text: m.text, isUser: false }))
      );
    } else {
      setMessages([]);
    }
  }

  // 6) Rename a session
  function handleRenameSession(e: React.FormEvent) {
    e.preventDefault();
    if (!socket || !currentSessionId) return;

    socket.emit("renameSession", {
      sessionId: currentSessionId,
      newName: newSessionName,
    });

    // Optimistically update the name in local state
    setSessions((prev) =>
      prev.map((s) =>
        s.sessionId === currentSessionId ? { ...s, name: newSessionName } : s
      )
    );

    setNewSessionName("");
  }

  // Auto-scroll to bottom on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-screen">
      {/* Sidebar: sessions list + new session */}
      <div className="w-1/4 bg-gray-200 p-4">
        <h2 className="text-lg font-bold mb-4">Chat Sessions</h2>
        <button
          onClick={handleNewSession}
          className="mb-4 bg-green-500 text-white px-3 py-2 rounded"
        >
          New Chat Session
        </button>

        {sessions.length === 0 ? (
          <p>No sessions yet</p>
        ) : (
          <ul>
            {sessions.map((session) => (
              <li
                key={session.sessionId || Math.random()}
                onClick={() => handleSessionClick(session.sessionId!)}
                className={`cursor-pointer p-2 ${
                  session.sessionId === currentSessionId
                    ? "bg-blue-300"
                    : "hover:bg-gray-300"
                }`}
              >
                {session.name
                  ? session.name
                  : `Session ${session.sessionId || "New"}`}
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={() => navigate("/")}
          className="mt-4 bg-orange-600 text-white px-3 py-2 rounded hover:-translate-x-1 transition-all duration-300"
        >
          Go Back
        </button>
      </div>

      {/* Main chat area */}
      <div className="flex flex-col flex-1 bg-gray-50">
        {/* Header + rename form */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-4">
          <h1 className="text-xl font-semibold">Chat</h1>
          {currentSessionId && (
            <form onSubmit={handleRenameSession} className="flex gap-2">
              <input
                type="text"
                placeholder="Rename session"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1"
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-3 py-1 rounded"
              >
                Rename
              </button>
            </form>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.isUser
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-900 rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
