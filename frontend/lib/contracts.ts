export const CONTRACT_ADDRESSES = {
  USDC: "0xEcfbE7c72Ba17168209aDDc8B86DB5f9Af1ccdcb",
  AGENT_REGISTRY: "0x8Ac396E032ECd2f1F8BAf9E88e3Fb76Befd2A0CB",
  ESCROW: "0x6f9028E92EF4e50Cea71524A40F88Ea02126E660",
  ERC8004_IDENTITY: "0x7307EEB2F4d903eF9bab3Ec1c6ff2CB798e7C361",
  ERC8004_REPUTATION: "0x1b83e954DC908ED4C74ECe99D29cF7ffC3A0297F"
};

export const getExplorerAddressUrl = (address: string) => {
  return `https://testnet.snowtrace.io/address/${address}`;
};

export const getExplorerTxUrl = (txHash: string) => {
  return `https://testnet.snowtrace.io/tx/${txHash}`;
};

export const truncateAddress = (address: string) => {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};
