const { expect } = require("chai");

const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("SupplyChainTracking tests", function () {

  // Deploy contract and return the contract instance and accounts
  async function deploySupplyChainTrackingFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const supplyChainTracking = await ethers.deployContract("SupplyChainTracking");
    
    await supplyChainTracking.waitForDeployment();
    
    return { owner, addr1, addr2, supplyChainTracking };
  }

  // Test deployment
  describe("Test deployment", async function () {
    it("Should deploy SupplyChainTracking", async function () {
      const { supplyChainTracking, owner } = await loadFixture(deploySupplyChainTrackingFixture);

      expect(await supplyChainTracking.owner()).to.equal(owner.address);
    });
  });

  // Test Actors functions
  describe("Test Actors functions", async function () {
    it("Should add an actor", async function () {
      const { supplyChainTracking, addr1 } = await loadFixture(deploySupplyChainTrackingFixture);

      const result = await supplyChainTracking.registerActor(addr1.address, 1);
      expect(result).to.emit(supplyChainTracking, 'ActorRegistered');
    })
    
    it("Should disable an actor", async function () {
      const { supplyChainTracking, addr1 } = await loadFixture(deploySupplyChainTrackingFixture);

      await supplyChainTracking.registerActor(addr1.address, 1);
      expect(await supplyChainTracking.disableActor(addr1.address)).to.emit(supplyChainTracking, 'ActorDisabled');
    })
    
    it("Should not allow unauthorized address to register an actor", async function () {
      const { supplyChainTracking, addr1 } = await loadFixture(deploySupplyChainTrackingFixture);

      const unauthorizedRegistration = supplyChainTracking.connect(addr1).registerActor(addr1.address, 1);
      await expect(unauthorizedRegistration).to.be.revertedWithCustomError(supplyChainTracking, "OwnableUnauthorizedAccount");
    })

    it("Should not allow unauthorized address to disable an actor", async function () {
      const { supplyChainTracking, addr1, addr2 } = await loadFixture(deploySupplyChainTrackingFixture);
      
      await supplyChainTracking.registerActor(addr1.address, 1);
      const unauthorizedDisabling = supplyChainTracking.connect(addr2).disableActor(addr1.address);
      await expect(unauthorizedDisabling).to.be.revertedWithCustomError(supplyChainTracking, "OwnableUnauthorizedAccount");
    })
    
    it("Should get an actor's data", async function () {
      const { supplyChainTracking, addr1, addr2 } = await loadFixture(deploySupplyChainTrackingFixture);

      const actor = addr1.address;
      const role = 1;

      await supplyChainTracking.registerActor(actor, role);

      const [returnedRole, returnedStatus] = await supplyChainTracking.getActor(actor);

      expect(returnedRole.toString()).to.equal("1");
      expect(returnedStatus).to.equal(true);
    })

    it("Should not allow unauthorized address get an actor's data", async function () {
      const { supplyChainTracking, addr1, addr2 } = await loadFixture(deploySupplyChainTrackingFixture);

      const actor = addr1.address;
      const role = 1;

      await supplyChainTracking.registerActor(actor, role);

      const actorAdata = supplyChainTracking.connect(addr2).getActor(actor);
      await expect(actorAdata).to.be.revertedWithCustomError(supplyChainTracking, "OwnableUnauthorizedAccount");
    })
  });

  describe("Test Product functions", async function () {
    it("Should allow a Producer to register a new asset", async function () {
      const { supplyChainTracking, addr1 } = await loadFixture(deploySupplyChainTrackingFixture);
      await supplyChainTracking.registerActor(addr1.address, 0);
      const currentTimestamp = Date.now().toString();

      const result = await supplyChainTracking.connect(addr1).registerAsset("Battery", currentTimestamp, "Curitiba");
      await expect(result).to.emit(supplyChainTracking, 'AssetRegistered');
    })
    
    it("Should not allow a Producer to register a new asset if it is not registered", async function () {
      const { supplyChainTracking, addr2 } = await loadFixture(deploySupplyChainTrackingFixture);
      const currentTimestamp = Date.now().toString();

      const result = supplyChainTracking.connect(addr2).registerAsset("Battery", currentTimestamp, "Curitiba");
      await expect(result).to.be.revertedWith("Actor not enabled");
    })

    it("Should not allow an actor without Producer role to register a new asset", async function () {
      const { supplyChainTracking, addr1 } = await loadFixture(deploySupplyChainTrackingFixture);
      await supplyChainTracking.registerActor(addr1.address, 1);
      const currentTimestamp = Date.now().toString();
      
      const result = supplyChainTracking.connect(addr1).registerAsset("Battery", currentTimestamp, "Curitiba");
      await expect(result).to.be.revertedWith("Actor's role must be Producer");
    })

    it("Should return the total number of assets", async function () {
      const { supplyChainTracking, addr1 } = await loadFixture(deploySupplyChainTrackingFixture);
      expect(await supplyChainTracking.getTotalAssetNumber()).to.equal(0);
      
      await supplyChainTracking.registerActor(addr1.address, 0);
      const currentTimestamp = Date.now().toString();
      
      await supplyChainTracking.connect(addr1).registerAsset("Battery", currentTimestamp, "Curitiba");
      await supplyChainTracking.connect(addr1).registerAsset("Screen", currentTimestamp, "Santiago");
      expect(await supplyChainTracking.getTotalAssetNumber()).to.equal(2);
    })
    
    it("Should return an asset's data providing it's id", async function () {
      const { supplyChainTracking, addr1 } = await loadFixture(deploySupplyChainTrackingFixture);
      await supplyChainTracking.registerActor(addr1.address, 0);

      const assetType = "Tyre";
      const assetProductionDate = Date.now().toString();
      const assetOrigin = "Buenos Aires";
      const assetData = [assetType, BigInt(assetProductionDate), assetOrigin, addr1.address, [addr1.address]];

      await supplyChainTracking.connect(addr1).registerAsset(assetType, assetProductionDate, assetOrigin);

      const result = await supplyChainTracking.getAsset(1);
      expect(result).to.deep.equal(assetData);
    })

    it("Should revert data retrieval if asset does not exists", async function () {
      const { supplyChainTracking, addr1 } = await loadFixture(deploySupplyChainTrackingFixture);
      await supplyChainTracking.registerActor(addr1.address, 0)
      const currentTimestamp = Date.now().toString();
      await supplyChainTracking.connect(addr1).registerAsset("Battery", currentTimestamp, "Curitiba");

      const resultInf = supplyChainTracking.getAsset(0);
      await expect(resultInf).to.be.revertedWith("Asset ID must be within valid range")
      const resultSup = supplyChainTracking.getAsset(2);
      await expect(resultSup).to.be.revertedWith("Asset ID must be within valid range")
    })

    it("Should revert data retrieval if asset list is empty", async function () {
      const { supplyChainTracking, addr1 } = await loadFixture(deploySupplyChainTrackingFixture);
      await supplyChainTracking.registerActor(addr1.address, 0);

      const result = supplyChainTracking.getAsset(1);
      await expect(result).to.be.revertedWith("Asset ID must be within valid range")
    })
  });
});