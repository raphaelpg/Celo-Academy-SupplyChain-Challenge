const { expect } = require("chai");

const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("SupplyChainTracking tests", function () {

  // Deploy contract and return the contract instance and accounts
  async function deploySupplyChainTrackingFixture() {
    const [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();

    const supplyChainTracking = await ethers.deployContract("SupplyChainTracking");
    
    await supplyChainTracking.waitForDeployment();
    
    return { supplyChainTracking, owner, addr1, addr2, addr3, addr4 };
  }

  describe("Test Asset Transfer functions", async function () {
    it("Should allow an actor to transfer an asset", async function () {
      const { supplyChainTracking, addr1, addr2, addr3, addr4 } = await loadFixture(deploySupplyChainTrackingFixture);
      // Registering Producer
      await supplyChainTracking.registerActor(addr1.address, 0);
      // Registering Carrier
      await supplyChainTracking.registerActor(addr2.address, 1);
      // Registering Retailer
      await supplyChainTracking.registerActor(addr3.address, 2);
      // Registering Consumer
      await supplyChainTracking.registerActor(addr4.address, 3);

      // Creating new asset
      const currentTimestamp = Date.now().toString();
      await supplyChainTracking.connect(addr1).registerAsset("Battery", currentTimestamp, "Curitiba");

      // Perform transfers
      expect(await supplyChainTracking.connect(addr1).transferAsset(1, addr2.address)).to.emit(supplyChainTracking, 'AssetTransfered');
      expect(await supplyChainTracking.connect(addr2).transferAsset(1, addr3.address)).to.emit(supplyChainTracking, 'AssetTransfered');
      expect(await supplyChainTracking.connect(addr3).transferAsset(1, addr4.address)).to.emit(supplyChainTracking, 'AssetTransfered');
      const result = await supplyChainTracking
    })

    it("Should revert if last actor transfers an asset", async function () {
      const { supplyChainTracking, owner, addr1, addr2, addr3, addr4 } = await loadFixture(deploySupplyChainTrackingFixture);
      // Registering Producer
      await supplyChainTracking.registerActor(addr1.address, 0);
      // Registering Carrier
      await supplyChainTracking.registerActor(addr2.address, 1);
      // Registering Retailer
      await supplyChainTracking.registerActor(addr3.address, 2);
      // Registering Consumer
      await supplyChainTracking.registerActor(addr4.address, 3);
      
      // Creating new asset
      const currentTimestamp = Date.now().toString();
      await supplyChainTracking.connect(addr1).registerAsset("Battery", currentTimestamp, "Curitiba");
      
      // Perform transfers
      await supplyChainTracking.connect(addr1).transferAsset(1, addr2.address);
      await supplyChainTracking.connect(addr2).transferAsset(1, addr3.address);
      await supplyChainTracking.connect(addr3).transferAsset(1, addr4.address);

      await expect(supplyChainTracking.connect(addr4).transferAsset(1, addr3.address)).to.be.revertedWith('Consumer can not transfer asset');
    })
    
    it("Should revert if next actor is not valid", async function () {
      const { supplyChainTracking, owner, addr1, addr2 } = await loadFixture(deploySupplyChainTrackingFixture);
      await supplyChainTracking.registerActor(addr1.address, 0);

      // Creating new asset
      const currentTimestamp = Date.now().toString();
      await supplyChainTracking.connect(addr1).registerAsset("Battery", currentTimestamp, "Curitiba");

      await expect(supplyChainTracking.connect(addr1).transferAsset(1, addr2.address)).to.be.revertedWith('Next owner is not valid');
    })

    it("Should revert if next actor has incorrect role", async function () {
      const { supplyChainTracking, addr1, addr2 } = await loadFixture(deploySupplyChainTrackingFixture);
      // Registering Producers
      await supplyChainTracking.registerActor(addr1.address, 0);
      await supplyChainTracking.registerActor(addr2.address, 0);
      
      // Creating new asset
      const currentTimestamp = Date.now().toString();
      await supplyChainTracking.connect(addr1).registerAsset("Battery", currentTimestamp, "Curitiba");
      
      await expect(supplyChainTracking.connect(addr1).transferAsset(1, addr2.address)).to.be.revertedWith('Wrong next owner role');
    })

    it("Should revert if asset ID is incorret", async function () {
      const { supplyChainTracking, addr1, addr2 } = await loadFixture(deploySupplyChainTrackingFixture);
      // Registering Producers
      await supplyChainTracking.registerActor(addr1.address, 0);
      // Registering Carrier
      await supplyChainTracking.registerActor(addr2.address, 1);
      
      // Creating new asset
      const currentTimestamp = Date.now().toString();
      await supplyChainTracking.connect(addr1).registerAsset("Battery", currentTimestamp, "Curitiba");
      
      const transfer = supplyChainTracking.connect(addr1).transferAsset(2, addr2.address); 
      const transfer0 = supplyChainTracking.connect(addr1).transferAsset(2, addr2.address); 
      await expect(transfer).to.be.revertedWithCustomError(supplyChainTracking, 'OnlyAssetOwner');
      await expect(transfer0).to.be.revertedWithCustomError(supplyChainTracking, 'OnlyAssetOwner');
    })

    it("Should revert if new owner tries to transfer back", async function () {
      const { supplyChainTracking, addr1, addr2 } = await loadFixture(deploySupplyChainTrackingFixture);
      // Registering Producers
      await supplyChainTracking.registerActor(addr1.address, 0);
      // Registering Carrier
      await supplyChainTracking.registerActor(addr2.address, 1);
      
      // Creating new asset
      const currentTimestamp = Date.now().toString();
      await supplyChainTracking.connect(addr1).registerAsset("Battery", currentTimestamp, "Curitiba");
      
      await supplyChainTracking.connect(addr1).transferAsset(1, addr2.address); 
      await expect(supplyChainTracking.connect(addr2).transferAsset(1, addr1.address)).to.be.revertedWith('Wrong next owner role'); 
    })
  });
});