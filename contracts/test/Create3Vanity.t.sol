// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {CREATE3} from "solady/utils/CREATE3.sol";

/// Verifies the offline vanity grind against the real Solady CREATE3 code.
contract Create3VanityTest is Test {
    function test_testnet_vanity() public pure {
        address factory = 0x3d9D3ed75847766357F6bdd1a057d312A9A40fD9;
        bytes32 salt = 0x0000000000000000000000000000000000000000000000000000000000001ff0;
        address predicted = CREATE3.predictDeterministicAddress(salt, factory);
        assertEq(predicted, 0x001B7F47773137C378fb5c07Bdcd97C6bAF0e59B);
    }

    function test_mainnet_vanity() public pure {
        address factory = 0xF6aBDEea21F23b26d351c1C5880b0f7BC801FDc8;
        bytes32 salt = 0x0000000000000000000000000000000000000000000000000000000000000cd9;
        address predicted = CREATE3.predictDeterministicAddress(salt, factory);
        assertEq(predicted, 0x002c32b121CCeE10556335a94e2c64b0fc486927);
    }
}
