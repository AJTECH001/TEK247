import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { EnokiFlowProvider } from "@mysten/enoki/react";
import { networkConfig } from "./network/sui.ts";
import { RegisterEnokiWallets } from "./network/RegisterEnokiWallets.tsx";
import { ENOKI_API_KEY } from "./network/onchain.ts";
import "@mysten/dapp-kit/dist/index.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <QueryClientProvider client={queryClient}>
        <EnokiFlowProvider apiKey={ENOKI_API_KEY}>
          <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
            <RegisterEnokiWallets />
            <WalletProvider autoConnect>
              <App />
            </WalletProvider>
          </SuiClientProvider>
        </EnokiFlowProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
