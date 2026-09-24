import { useEffect, useRef } from "react";

import {connectWebSocket, subscribeWebSocket} from "../services/websocket";

export default function useTicketSocket({
  onNewTicket,
  onTicketUpdated,
  onStatusUpdate,
  onNewComment,
  onNotification,
  onTicketHistory,
  onEngineerResolution,
}) {
  const callbacksRef = useRef({
    onNewTicket,
    onTicketUpdated,
    onStatusUpdate,
    onNewComment,
    onNotification,
    onTicketHistory,
    onEngineerResolution,
  });

  useEffect(() => {
    callbacksRef.current = {
      onNewTicket,
      onTicketUpdated,
      onStatusUpdate,
      onNewComment,
      onNotification,
      onTicketHistory,
      onEngineerResolution,
    };
  }, [
    onNewTicket,
    onTicketUpdated,
    onStatusUpdate,
    onNewComment,
    onNotification,
    onTicketHistory,
    onEngineerResolution,
  ]);

  useEffect(() => {
    connectWebSocket();

    const unsubscribe = subscribeWebSocket((message) => {
      switch (message.type) {
        case "NEW_TICKET":
          callbacksRef.current.onNewTicket?.(message.data);
          break;

        case "TICKET_UPDATED":
          callbacksRef.current.onTicketUpdated?.(message.data);
          break;

        case "TICKET_STATUS_UPDATED":
          callbacksRef.current.onStatusUpdate?.(message.data);
          break;

        case "NEW_COMMENT":
          callbacksRef.current.onNewComment?.(message.data);
          break;

        case "NEW_NOTIFICATION":
          callbacksRef.current.onNotification?.(message.data);
          break;

        case "TICKET_HISTORY":
          callbacksRef.current.onTicketHistory?.(message.data);
          break;

        case "TICKET_ENGINEER_RESOLUTION":
          callbacksRef.current.onEngineerResolution?.(message.data);
          break;

        default:
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);
}