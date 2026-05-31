import { useEffect } from "react";

import {
  connectWebSocket,
  subscribeWebSocket,
} from "../services/websocket";

export default function useTicketSocket({
  onNewTicket,
  onStatusUpdate,
  onNewComment,
  onNotification,
  onTicketHistory,
}) {

  useEffect(() => {

    connectWebSocket();

    const unsubscribe = subscribeWebSocket((message) => {

      switch (message.type) {

        case "NEW_TICKET":
          onNewTicket?.(message.data);
          break;

        case "TICKET_STATUS_UPDATED":
          onStatusUpdate?.(message.data);
          break;

        case "NEW_COMMENT":
          onNewComment?.(message.data);
          break;

        case "NEW_NOTIFICATION":
          onNotification?.(message.data);
          break;

          case "TICKET_HISTORY":
            console.log(
              "[WS HISTORY RECEIVED]",
              message.data
            );
      
            onTicketHistory?.(message.data);
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