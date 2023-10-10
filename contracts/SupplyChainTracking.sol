//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract SupplyChainTracking is Ownable {

  /**
   * Contract state variables.
   */
  uint assetCounter; // asset Id counter, increment when a new asset isregistered

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

  struct Asset {
    uint productId;
    string productType; 
    uint256 productionDate; // Date in Unix timestamp format 
    string origin;
    address currentHolder;
    address[] holderHistory;
  }

  mapping(address => Actor) public actors;
  mapping(uint => Asset) public assets;

  event ActorRegistered(address actor, Role role);
  event ActorDisabled(address actor);
  event AssetRegistered(uint productId);

  /**
   * Contract initialization.
   */
  constructor() 
    Ownable(msg.sender) 
  {
    assetCounter = 0;
  }

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

  /**
   * Function to register an asset
   * @param _productType The type of the new product in a string format, could be implemented as a enum list optionnaly
   * @param _productionDate The date of production of the new product in a Unix timestamp format
   * @param _origin The origing of the new product in a string format, could be implemented as a enum list and retrieved from the producers directly
   */
  function registerAsset(string calldata _productType, uint256 _productionDate, string calldata _origin) 
    public 
  {
    address _actor = msg.sender;
    console.log(actors[_actor].active);
    require(actors[_actor].active == true, "Actor not enabled");
    require(actors[_actor].role == Role.Producer, "Actor's role must be Producer");

    uint _currentAssetId = assetCounter;
    assets[_currentAssetId].productId = _currentAssetId;
    assets[_currentAssetId].productType = _productType;
    assets[_currentAssetId].productionDate = _productionDate;
    assets[_currentAssetId].origin = _origin;
    assets[_currentAssetId].currentHolder = _actor;
    assets[_currentAssetId].holderHistory.push(_actor);

    assetCounter += 1;
    emit AssetRegistered(_currentAssetId);
  }
}