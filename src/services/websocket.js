let socket = null;
let listeners = [];

export const connectWebSocket = () => {
  if (
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {
    return socket;
  }

  const token = localStorage.getItem("token");

  if (!token) return null;

  socket = new WebSocket(
    `ws://localhost:3000/ws?token=${token}`
  );

  socket.onopen = () => {
    console.log("websocket connected");
  };

  socket.onmessage = (event) => {

    try {

      const data = JSON.parse(event.data);

      console.log("WS MESSAGE:", data);

      listeners.forEach((callback) => {
        callback(data);
      });

    } catch (err) {
      console.error("WS parse error:", err);
    }
  };

  socket.onclose = () => {

    console.log("websocket disconnected");

    setTimeout(() => {
      connectWebSocket();
    }, 3000);
  };

  socket.onerror = (err) => {
    console.error("WebSocket error:", err);
  };

  return socket;
};

export const subscribeWebSocket = (callback) => {

  listeners.push(callback);

  return () => {
    listeners = listeners.filter(
      (cb) => cb !== callback
    );
  };
};

export const disconnectWebSocket = () => {

  if (socket) {
    socket.close();
    socket = null;
  }

  listeners = [];
};