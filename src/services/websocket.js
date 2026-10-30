
import { isTokenExpired } from "../utils/auth";

let socket = null;
let reconnectTimer = null;
let shouldReconnect = false;

const listeners = new Set();
const RECONNECT_INTERVAL = 3000;

export const connectWebSocket = () => {
  const token = localStorage.getItem("token");

  if (!token || isTokenExpired()) {
    shouldReconnect = false;
    return null;
  }

  shouldReconnect = true;

  if (
    socket &&
    (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    )
  ) {
    return socket;
  }

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  const currentSocket = new WebSocket(
    `${import.meta.env.VITE_WS_URL}/ws?token=${encodeURIComponent(token)}`
  );

  socket = currentSocket;

  currentSocket.onopen = () => {
    if (socket !== currentSocket) return;

    console.log("[WS] connected");
  };

  currentSocket.onmessage = (event) => {
    if (socket !== currentSocket) return;

    try {
      const data = JSON.parse(event.data);

      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("[WS] listener error:", error);
        }
      });
    } catch (error) {
      console.error("[WS] parse error:", error);
    }
  };

  currentSocket.onclose = (event) => {
    console.log(
      "[WS] disconnected:",
      event.code,
      event.reason
    );

    if (socket !== currentSocket) return;

    socket = null;

    if (
      !shouldReconnect ||
      !localStorage.getItem("token") ||
      isTokenExpired()
    ) {
      shouldReconnect = false;
      return;
    }

    if (!reconnectTimer) {
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;

        if (shouldReconnect) {
          connectWebSocket();
        }
      }, RECONNECT_INTERVAL);
    }
  };

  currentSocket.onerror = (error) => {
    console.error("[WS] connection error:", error);
  };

  return currentSocket;
};

export const subscribeWebSocket = (callback) => {
  listeners.add(callback);

  return () => {
    listeners.delete(callback);
  };
};

export const disconnectWebSocket = () => {
  shouldReconnect = false;

  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  const currentSocket = socket;
  socket = null;

  if (
    currentSocket &&
    (
      currentSocket.readyState === WebSocket.OPEN ||
      currentSocket.readyState === WebSocket.CONNECTING
    )
  ) {
    currentSocket.close(
      1000,
      "User logged out"
    );
  }
};
