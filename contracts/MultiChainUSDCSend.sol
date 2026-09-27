// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// On Arc, native gas IS USDC at 18 decimals. Fees are paid as native (18-dec)
// via msg.value. The ERC-20 principal (6-dec) is pulled separately. Both draw
// from the same USDC pool. Frontend must show unified cost: amount + fee/1e12
// in USDC terms.

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ITokenMessengerWithFees {
    struct QuoteClaim {
        bytes signedQuote;
        address refundAddress;
    }

    function depositForBurnWithFees(
        uint256 amount,
        uint32 destinationDomain,
        bytes32 mintRecipient,
        address burnToken,
        bytes32 destinationCaller,
        QuoteClaim calldata claim
    ) external payable;

    function getFee(bytes calldata signedQuote)
        external
        pure
        returns (uint256 totalFee, address feeToken);
}

contract MultiChainUSDCSend {
    using SafeERC20 for IERC20;

    struct BurnRequest {
        uint32 destinationDomain;
        bytes32 mintRecipient;
        uint256 amount;
        uint256 fee;
        bytes signedQuote;
    }

    error ZeroAddress();
    error EmptyRequests();
    error TooManyRequests(uint256 provided, uint256 maxAllowed);
    error InsufficientNativeFee(uint256 provided, uint256 required);
    error ZeroAmount(uint256 index);
    error ZeroMintRecipient(uint256 index);
    error NativeRefundFailed();

    event BurnInitiated(
        uint32 indexed destinationDomain,
        bytes32 indexed mintRecipient,
        uint256 amount,
        uint256 fee
    );

    event MultiSendExecuted(
        address indexed sender,
        uint256 numDestinations,
        uint256 totalAmount,
        uint256 totalFee
    );

    uint256 internal constant MAX_REQUESTS = 10;

    address private immutable _tokenMessengerWithFees;
    address private immutable _usdc;

    constructor(address tokenMessengerWithFees_, address usdc_) {
        if (tokenMessengerWithFees_ == address(0) || usdc_ == address(0)) {
            revert ZeroAddress();
        }

        _tokenMessengerWithFees = tokenMessengerWithFees_;
        _usdc = usdc_;
    }

    function multiSend(BurnRequest[] calldata requests) external payable {
        _execute(requests);
    }

    /// @notice Gasless-approval variant: executes an EIP-2612 permit for the
    /// total principal, then the multi-send, all in one transaction.
    /// The user signs the permit off-chain (no gas); only this call costs gas.
    function permitAndMultiSend(
        BurnRequest[] calldata requests,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external payable {
        uint256 totalAmount;
        for (uint256 i = 0; i < requests.length; ++i) {
            totalAmount += requests[i].amount;
        }
        IERC20Permit(_usdc).permit(
            msg.sender,
            address(this),
            totalAmount,
            deadline,
            v,
            r,
            s
        );
        _execute(requests);
    }

    function _execute(BurnRequest[] calldata requests) internal {
        uint256 requestCount = requests.length;
        if (requestCount == 0) revert EmptyRequests();
        if (requestCount > MAX_REQUESTS) {
            revert TooManyRequests(requestCount, MAX_REQUESTS);
        }

        uint256 totalFee;
        uint256 totalAmount;

        for (uint256 i = 0; i < requestCount; ++i) {
            BurnRequest calldata request = requests[i];
            if (request.amount == 0) revert ZeroAmount(i);
            if (request.mintRecipient == bytes32(0)) revert ZeroMintRecipient(i);

            totalFee += request.fee;
            totalAmount += request.amount;
        }

        if (msg.value < totalFee) {
            revert InsufficientNativeFee(msg.value, totalFee);
        }

        IERC20 usdcToken = IERC20(_usdc);
        ITokenMessengerWithFees messenger = ITokenMessengerWithFees(_tokenMessengerWithFees);

        for (uint256 i = 0; i < requestCount; ++i) {
            BurnRequest calldata request = requests[i];

            usdcToken.safeTransferFrom(msg.sender, address(this), request.amount);

            usdcToken.forceApprove(_tokenMessengerWithFees, 0);
            usdcToken.forceApprove(_tokenMessengerWithFees, request.amount);

            messenger.depositForBurnWithFees{value: request.fee}(
                request.amount,
                request.destinationDomain,
                request.mintRecipient,
                _usdc,
                bytes32(0),
                ITokenMessengerWithFees.QuoteClaim({
                    signedQuote: request.signedQuote,
                    refundAddress: payable(msg.sender)
                })
            );

            emit BurnInitiated(
                request.destinationDomain,
                request.mintRecipient,
                request.amount,
                request.fee
            );
        }

        usdcToken.forceApprove(_tokenMessengerWithFees, 0);

        uint256 refund = msg.value - totalFee;
        if (refund > 0) {
            (bool success,) = payable(msg.sender).call{value: refund}("");
            if (!success) revert NativeRefundFailed();
        }

        emit MultiSendExecuted(msg.sender, requestCount, totalAmount, totalFee);
    }

    function tokenMessengerWithFees() external view returns (address) {
        return _tokenMessengerWithFees;
    }

    function usdc() external view returns (address) {
        return _usdc;
    }

    function totalCost(BurnRequest[] calldata requests)
        external
        pure
        returns (uint256 usdcErc20Total, uint256 nativeFeeTotal)
    {
        for (uint256 i = 0; i < requests.length; ++i) {
            usdcErc20Total += requests[i].amount;
            nativeFeeTotal += requests[i].fee;
        }
    }
}
