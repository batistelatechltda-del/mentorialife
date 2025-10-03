"use client";
import { useEffect, useRef, useState } from "react";
import Pusher, { type Channel } from "pusher-js";

export default function usePusher(
  channelName: string,
  eventName: string,
  callback: (data: any) => void
) {
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<Channel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true); // Usando `mountedRef` para controlar o ciclo de vida

  const isConnectionValid = () => {
    if (!pusherRef.current || !pusherRef.current.connection) return false;

    const state = pusherRef.current.connection.state;
    return (
      state !== "disconnected" &&
      state !== "disconnecting" &&
      state !== "failed" &&
      state !== "closing" &&
      state !== "closed"
    );
  };

  useEffect(() => {
    // Evitar múltiplas conexões e atualizações enquanto o componente está sendo montado
    if (!channelName || !eventName || !callback) return;

    const initPusher = () => {
      try {
        const secret = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
        const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

        if (!secret || !cluster) {
          if (mountedRef.current) {
            setError(new Error("Pusher credentials are missing"));
          }
          return;
        }

        const pusherInstance = new Pusher(secret, {
          cluster: cluster,
          enabledTransports: ["ws", "wss"],
        });

        pusherRef.current = pusherInstance;

        pusherInstance.connection.bind("connected", () => {
          if (!mountedRef.current) return;

          setIsConnected(true); // Atualiza a conexão apenas se o componente estiver montado
          setError(null);

          try {
            if (!channelRef.current) {
              channelRef.current = pusherInstance.subscribe(channelName);

              if (channelRef.current) {
                channelRef.current.bind(eventName, callback);
              }
            }
          } catch (err) {
            console.error("Error subscribing to channel:", err);
          }
        });

        pusherInstance.connection.bind("disconnected", () => {
          if (mountedRef.current) {
            setIsConnected(false);
          }
        });

        pusherInstance.connection.bind("error", (err: Error) => {
          if (mountedRef.current) {
            setError(err);
            setIsConnected(false);
          }
          console.error("Pusher connection error:", err);
        });
      } catch (err) {
        if (mountedRef.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
        console.error("Error initializing Pusher:", err);
      }
    };

    const cleanupConnection = () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      try {
        if (channelRef.current) {
          try {
            channelRef.current.unbind(eventName, callback);
          } catch (err) {
            console.error("Error unbinding event:", err);
          }
        }

        if (pusherRef.current && channelRef.current) {
          try {
            if (isConnectionValid()) {
              pusherRef.current.unsubscribe(channelName);
            }
          } catch (err) {
            console.error("Error unsubscribing from channel:", err);
          }
        }

        if (pusherRef.current) {
          try {
            if (isConnectionValid()) {
              pusherRef.current.disconnect();
            }
          } catch (err) {
            console.error("Error disconnecting Pusher:", err);
          }
        }
      } catch (err) {
        console.error("Error in cleanup:", err);
      }

      channelRef.current = null;
      pusherRef.current = null;
    };

    initPusher();

    return () => {
      mountedRef.current = false; // Marca o componente como desmontado
      cleanupConnection();
    };
  }, [channelName, eventName, callback]); // Garantir que a dependência está estável

  return {
    isConnected,
    error,
    reconnect: () => {
      const cleanAndReconnect = async () => {
        try {
          if (pusherRef.current || channelRef.current) {
            if (channelRef.current) {
              try {
                channelRef.current.unbind(eventName, callback);
              } catch (err) {
                console.error("Error unbinding event:", err);
              }
            }

            channelRef.current = null;
            pusherRef.current = null;
          }

          await new Promise((resolve) => setTimeout(resolve, 500));

          if (mountedRef.current) {
            const secret = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
            const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

            if (!secret || !cluster) {
              if (mountedRef.current) {
                setError(new Error("Pusher credentials are missing"));
              }
              return;
            }

            const pusherInstance = new Pusher(secret, {
              cluster: cluster,
              enabledTransports: ["ws", "wss"],
            });

            pusherRef.current = pusherInstance;

            pusherInstance.connection.bind("connected", () => {
              if (!mountedRef.current) return;

              setIsConnected(true);
              setError(null);

              try {
                channelRef.current = pusherInstance.subscribe(channelName);

                if (channelRef.current) {
                  channelRef.current.bind(eventName, callback);
                }
              } catch (err) {
                console.error("Error subscribing to channel:", err);
              }
            });

            pusherInstance.connection.bind("disconnected", () => {
              if (mountedRef.current) {
                setIsConnected(false);
              }
            });

            pusherInstance.connection.bind("error", (err: Error) => {
              if (mountedRef.current) {
                setError(err);
                setIsConnected(false);
              }
              console.error("Pusher connection error:", err);
            });
          }
        } catch (err) {
          console.error("Error in reconnect:", err);
          if (mountedRef.current) {
            setError(err instanceof Error ? err : new Error(String(err)));
          }
        }
      };

      cleanAndReconnect();
    },
  };
}
