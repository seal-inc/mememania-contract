// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

error InvalidSigner(address expected, address passed);
error InvalidNonce(uint256 expected, uint256 current);

contract Stand {
    using SafeERC20 for IERC20;
    
    mapping(uint256 => uint256) public lastUsedNonces;

    IERC20 public immutable usdc;
    address public immutable authorizedSigner;

    event Withdrawn(
        address indexed recipient, 
        uint256 amount, 
        uint256 nonce, 
        uint256 indexed userIdentifier
    );

    constructor(address _usdc, address _authorizedSigner) {
        usdc = IERC20(_usdc);
        authorizedSigner = _authorizedSigner;
    }

    function withdraw(
        uint256 userIdentifier, 
        uint256 nonce, 
        uint256 amount, 
        bytes memory signature
    ) external {
        require(amount > 0, "Amount must be greater than 0");
        require(nonce > lastUsedNonces[userIdentifier], "Nonce must be greater than the last used nonce");

        bytes32 messageHash = MessageHashUtils.toEthSignedMessageHash(
            getMessageHash(userIdentifier, nonce, amount)
        );
        address signer = ECDSA.recover(messageHash, signature);
        if (signer != authorizedSigner) {
            revert InvalidSigner(authorizedSigner, signer);
        }

        lastUsedNonces[userIdentifier] = nonce;
        usdc.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount, nonce, userIdentifier);
    }

    function getMessageHash(
        uint256 userIdentifier, 
        uint256 nonce, 
        uint256 amount
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(userIdentifier, nonce, amount));
    }
}
