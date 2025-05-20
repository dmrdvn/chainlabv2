import { _mock } from './_mock';

// ----------------------------------------------------------------------

// Sample contract templates
export const CONTRACT_TEMPLATES = [
  {
    id: '1',
    name: 'ERC20 Token',
    description: 'Standard ERC20 token implementation',
    category: 'token',
    language: 'solidity',
  },
  {
    id: '2',
    name: 'NFT Collection',
    description: 'ERC721 NFT collection with minting functionality',
    category: 'nft',
    language: 'solidity',
  },
  {
    id: '3',
    name: 'Staking Contract',
    description: 'Token staking with rewards distribution',
    category: 'defi',
    language: 'solidity',
  },
];

// File structure for the editor
export const EDITOR_FILES = {
  'contracts': {
    type: 'directory',
    children: {
      'Token.sol': {
        type: 'file',
        content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC20, Ownable {
    constructor() ERC20("MyToken", "MTK") {
        _mint(msg.sender, 1000000 * 10 ** decimals());
    }
}`,
        language: 'solidity',
      },
      'NFT.sol': {
        type: 'file',
        content: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT is ERC721, Ownable {
    constructor() ERC721("MyNFT", "MNFT") {}
}`,
        language: 'solidity',
      },
    },
  },
  'test': {
    type: 'directory',
    children: {
      'Token.test.js': {
        type: 'file',
        content: `const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token", function () {
  it("Should deploy with correct name and symbol", async function () {
    const Token = await ethers.getContractFactory("Token");
    const token = await Token.deploy();
    await token.deployed();

    expect(await token.name()).to.equal("MyToken");
    expect(await token.symbol()).to.equal("MTK");
  });
});`,
        language: 'javascript',
      },
    },
  },
  'scripts': {
    type: 'directory',
    children: {
      'deploy.js': {
        type: 'file',
        content: `async function main() {
  const Token = await ethers.getContractFactory("Token");
  const token = await Token.deploy();
  await token.deployed();

  console.log("Token deployed to:", token.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });`,
        language: 'javascript',
      },
    },
  },
};

// Recent files
export const RECENT_FILES = [
  {
    id: _mock.id(1),
    name: 'Token.sol',
    path: '/contracts/Token.sol',
    language: 'solidity',
    lastModified: _mock.time(1),
    size: 1240,
  },
  {
    id: _mock.id(2),
    name: 'NFT.sol',
    path: '/contracts/NFT.sol',
    language: 'solidity',
    lastModified: _mock.time(2),
    size: 890,
  },
  {
    id: _mock.id(3),
    name: 'deploy.js',
    path: '/scripts/deploy.js',
    language: 'javascript',
    lastModified: _mock.time(3),
    size: 450,
  },
];

// LLM chat history
export const CHAT_HISTORY = [
  {
    id: _mock.id(1),
    role: 'user',
    content: 'Can you help me implement a staking function in my Token contract?',
    timestamp: _mock.time(1),
  },
  {
    id: _mock.id(2),
    role: 'assistant',
    content: 'I can help you implement a staking function. First, we need to add a mapping to track staked balances...',
    timestamp: _mock.time(2),
  },
  {
    id: _mock.id(3),
    role: 'user',
    content: 'How do I calculate rewards for stakers?',
    timestamp: _mock.time(3),
  },
];

// Editor settings
export const EDITOR_SETTINGS = {
  theme: 'vs-dark',
  fontSize: 14,
  tabSize: 2,
  minimap: {
    enabled: true,
  },
  autoSave: true,
  formatOnSave: true,
  wordWrap: 'on',
};

// Compilation configurations
export const COMPILER_VERSIONS = [
  '0.8.20',
  '0.8.19',
  '0.8.18',
  '0.8.17',
  '0.8.16',
  '0.8.15',
];

export const OPTIMIZATION_SETTINGS = {
  enabled: true,
  runs: 200,
};
