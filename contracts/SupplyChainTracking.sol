//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SupplyChainTracking is Ownable {

  /**
   * Contract state variables.
   */

  // Possible roles of the actors
  enum Role {
    Producer,
    Carrier,
    Retailer,
    Consumer
  }

  struct Actor {
    Role role;
    bool active;
  }

  mapping(address => Actor) public actors;

  event ActorRegistered(address actor, Role role);
  event ActorDisabled(address actor);

  /**
   * Contract initialization.
   */
  constructor() 
    Ownable(msg.sender) 
  {}

  /**
   * Contract functions.
   */

  /**
   * Function to register an actor
   * @param _actor The Ethereum address of the actor being registered
   * @param _role The role of the actor being registered
   */
  function registerActor(address _actor, Role _role) 
    public 
    onlyOwner 
  {
    actors[_actor] = Actor(_role, true);
    emit ActorRegistered(_actor, _role);
  }

  /**
   * Function to disable an actor
   * @param _actor The Ethereum address of the actor being registered
   */
  function disableActor(address _actor) 
    public 
    onlyOwner 
  {
    actors[_actor].active = false;
    emit ActorDisabled(_actor);
  }

  /**
   * Function to get an actor's data
   * @param _actor The Ethereum address of the actor being retrieved
   */
  function getActor(address _actor) 
    public
    view
    onlyOwner
    returns (Role, bool)
  {
    return (
      actors[_actor].role,
      actors[_actor].active
    );
  }
}