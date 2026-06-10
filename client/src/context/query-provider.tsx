import { ReactNode, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface Props {
  children: ReactNode;
}

export default function QueryProvider({ children }: Props) {
  const queryClientRef = useRef<QueryClient | null>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({
      defaultOptions: {
        queries: {
          refetchOnWindowFocus: false,
          retry: (failureCount, error) => {
            if (failureCount < 2 && error?.message === "Network Error") {
              return true;
            }
            return false;
          },
          retryDelay: 0,
        },
      },
    });
  }
  return (
    <QueryClientProvider client={queryClientRef.current}>{children}</QueryClientProvider>
  );
}
