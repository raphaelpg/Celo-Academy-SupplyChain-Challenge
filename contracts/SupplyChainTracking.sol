//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SupplyChainTracking is Ownable {

  /**
   * Contract initialization.
   */
  constructor() 
    Ownable(msg.sender) 
  {}

}