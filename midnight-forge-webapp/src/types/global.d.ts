declare global {
  interface Window {
    midnight?: {
      mnLace?: import('@midnight-ntwrk/dapp-connector-api').DAppConnectorAPI;
    };
  }
}

export {}; 