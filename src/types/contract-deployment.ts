export interface ContractDeployment {
  id: string;
  contract_id: string;
  network_name: 'Ethereum' | 'Polygon' | 'BSC' | 'Solana' | 'Avalanche';
  chain_id: number;
  block_number: number;
  block_timestamp: string;
  tx_hash: string;
  deployer_address: string;
  gas_used: number | null;
  gas_price: number | null;
  contract_address: string;
  implementation_address: string | null;
  deployment_type: 'initial' | 'upgrade' | 'clone' | null;
  verified: boolean | null;
  audit_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}
