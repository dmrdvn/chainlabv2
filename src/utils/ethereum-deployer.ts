import type { Abi, Account, Address, Hex, PublicClient, WalletClient } from 'viem';

// EVM kontrat artifact'leri için arayüz (viem ile uyumlu)
export interface ViemEvmContractArtifacts {
  abi: Abi; // viem'in Abi tipi
  bytecode: Hex; // viem'in Hex tipi (0x ile başlamalı)
  contractName?: string; // Opsiyonel: Kontrat adı loglama için
}

// Deploy seçenekleri için arayüz (viem ile uyumlu)
export interface DeployViemEvmContractOptions {
  artifacts: ViemEvmContractArtifacts;
  walletClient: WalletClient; // viem WalletClient (wagmi'den useWalletClient() ile alınabilir)
  publicClient?: PublicClient; // Opsiyonel: İşlem sonucunu beklemek için (wagmi'den usePublicClient() ile alınabilir)
  onProgress?: (message: string) => void;
  constructorArgs?: any[]; // Opsiyonel: Kontratın constructor argümanları
  gas?: bigint; // Opsiyonel: Gas limiti (viem bigint bekler)
  value?: bigint; // Opsiyonel: Kontrata gönderilecek ETH miktarı (payable constructor için, viem bigint bekler)
  account?: Account | Address; // Opsiyonel: Deploy eden hesap (WalletClient'ta tanımlı değilse)
}

// Deploy sonucu için arayüz (viem ile uyumlu)
export interface DeployViemEvmContractResult {
  contractAddress: Address;
  transactionHash: Hex;
  blockNumber?: bigint;
  contractName?: string;
}

/**
 * Derlenmiş bir EVM kontratını viem kullanarak deploy eder.
 *
 * @param options DeployViemEvmContractOptions içeren deploy seçenekleri.
 * @returns DeployViemEvmContractResult içeren deploy sonucu.
 */
export async function deployEvmContractWithViem({
  artifacts,
  walletClient,
  publicClient,
  onProgress,
  constructorArgs = [],
  gas,
  value,
  account,
}: DeployViemEvmContractOptions): Promise<DeployViemEvmContractResult> {
  onProgress?.(`Starting deployment of ${artifacts.contractName || 'contract'} using viem...`);

  if (!walletClient) {
    throw new Error('viem WalletClient is required for deployment.');
  }

  if (!artifacts.abi || !artifacts.bytecode) {
    throw new Error('Contract ABI and bytecode are required.');
  }

  if (!artifacts.bytecode.startsWith('0x')) {
    throw new Error('Bytecode must be a hex string starting with 0x.');
  }

  const deployerAccount = account || walletClient.account;
  if (!deployerAccount) {
    throw new Error('Deployer account could not be determined from WalletClient or options.');
  }

  try {
    onProgress?.('Sending deployment transaction...');

    const hash = await walletClient.deployContract({
      abi: artifacts.abi,
      bytecode: artifacts.bytecode,
      args: constructorArgs,
      gas: gas,
      value: value,
      account: deployerAccount,
      chain: walletClient.chain,
    });

    onProgress?.(`Deployment transaction sent. Hash: ${hash}`);

    if (!publicClient) {
      onProgress?.(
        'PublicClient not provided, cannot wait for transaction receipt. Returning transaction hash.'
      );
      // publicClient yoksa, transaction hash'i ile hemen dönebiliriz,
      // ancak kontrat adresini ve block numarasını alamayız.
      // Bu durumda, UI tarafında hash ile işlem takibi yapılabilir.
      // Şimdilik bir uyarı verip, adres olmadan dönelim ya da hata fırlatalım.
      // Daha iyi bir UX için publicClient sağlanmalı.
      throw new Error('PublicClient is required to get contract address and confirm deployment.');
    }

    onProgress?.('Waiting for transaction to be mined...');
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'reverted') {
      onProgress?.(`Deployment transaction reverted. Status: ${receipt.status}`);
      throw new Error('Contract deployment transaction reverted.');
    }

    if (!receipt.contractAddress) {
      onProgress?.('Contract address not found in transaction receipt.');
      throw new Error('Contract address not found after deployment. Check transaction receipt.');
    }

    onProgress?.(`Contract deployed successfully! Address: ${receipt.contractAddress}`);

    return {
      contractAddress: receipt.contractAddress,
      transactionHash: hash,
      blockNumber: receipt.blockNumber,
      contractName: artifacts.contractName,
    };
  } catch (error: any) {
    console.error('viem EVM contract deployment error:', error);
    onProgress?.(`Deployment failed: ${error.message}`);
    let friendlyMessage = `Deployment failed: ${error.message}`;
    // viem hataları daha spesifik olabilir, error.shortMessage veya error.meta.details kontrol edilebilir
    if (error.message?.toLowerCase().includes('insufficient funds')) {
      friendlyMessage = 'Deployment failed: Insufficient funds for gas.';
    } else if (error.message?.toLowerCase().includes('user rejected')) {
      friendlyMessage = 'Deployment failed: User rejected the transaction.';
    }
    throw new Error(friendlyMessage);
  }
}
