
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

error InvalidSigner(address Expected, address passed);

contract MemeMania is Ownable {
    using ECDSA for bytes32;

    enum TokenType { TOKEN1, TOKEN2, TOKEN3, TOKEN4}
    
    struct Reward {
        uint256 amount;
        TokenType tokenType;
        bytes32 nonce;
        bytes signature;
    }

    mapping(bytes => bool) public usedSignatures;

    IERC20 public token1;
    IERC20 public token2;
    IERC20 public token3;
    IERC20 public token4;

    event RewardClaimed(address indexed claimant, uint256 amount, TokenType tokenType);

    constructor(address _token1, address _token2, address _token3, address _token4) Ownable(msg.sender) {
        token1 = IERC20(_token1);
        token2 = IERC20(_token2);
        token3 = IERC20(_token3);
        token4 = IERC20(_token4);
    }

    function claimRewards(Reward[] memory rewards) external {
        for (uint256 i = 0; i < rewards.length; i++) {
            Reward memory reward = rewards[i];
            require(!usedSignatures[reward.signature], "Signature already used");
            bytes32 messageHash = MessageHashUtils.toEthSignedMessageHash(getMessageHash(msg.sender, reward.amount, reward.tokenType, reward.nonce));
            address signer = ECDSA.recover(messageHash, reward.signature);
            if (signer != owner()) {
                revert InvalidSigner(address(owner()), address(signer));
            }

            usedSignatures[reward.signature] = true;

            if (reward.tokenType == TokenType.TOKEN1) {
                token1.transfer(msg.sender, reward.amount);
            } else if (reward.tokenType == TokenType.TOKEN2) {
                token2.transfer(msg.sender, reward.amount);
            } else if (reward.tokenType == TokenType.TOKEN3) {
                token3.transfer(msg.sender, reward.amount);
            } else if (reward.tokenType == TokenType.TOKEN4) {
                token4.transfer(msg.sender, reward.amount);
            }

            emit RewardClaimed(msg.sender, reward.amount, reward.tokenType);
        }
    }

    function getMessageHash(address recipient, uint256 amount, TokenType tokenType, bytes32 nonce) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(recipient, amount, tokenType, nonce));
    }

    receive() external payable {}

    function withdraw(uint256 amount) external onlyOwner {
        payable(owner()).transfer(amount);
    }

    function withdrawTokens(IERC20 token, uint256 amount) external onlyOwner {
        token.transfer(owner(), amount);
    }
}


