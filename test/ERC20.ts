import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";
import Bignumber from 'bignumber.js';

const DECIMALS = 18;

describe("ERC20", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployERC20() {
    

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount, anotherAccount] = await ethers.getSigners();

    const ERC20 = await ethers.getContractFactory("ERC20");
    const erc20 = await ERC20.deploy();

    return { erc20, owner, otherAccount, anotherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right balance", async function () {
      const { erc20, owner } = await loadFixture(deployERC20);

      expect((await erc20.balanceOf(owner.address)).toString()).to.equal(
        new Bignumber(21000000).multipliedBy(10 ** DECIMALS).toFixed(0)
        );
    });

    it("Should has right name", async function () {
      const { erc20} = await loadFixture(deployERC20);

      expect(await erc20.name()).to.equal('ERC-BEGGIN');
    });

    it("Should has right simbol", async function () {
      const { erc20} = await loadFixture(deployERC20);

      expect(await erc20.symbol()).to.equal('ERCB');
    });

    it("Should has right decimals", async function () {
      const { erc20} = await loadFixture(deployERC20);

      expect((await erc20.decimals()).toString()).to.equal(DECIMALS.toString());
    });



    // it("Should set the right owner", async function () {
    //   const { lock, owner } = await loadFixture(deployOneYearLockFixture);

    //   expect(await lock.owner()).to.equal(owner.address);
    // });

    // it("Should receive and store the funds to lock", async function () {
    //   const { lock, lockedAmount } = await loadFixture(
    //     deployOneYearLockFixture
    //   );

    //   expect(await ethers.provider.getBalance(lock.target)).to.equal(
    //     lockedAmount
    //   );
    // });

    // it("Should fail if the unlockTime is not in the future", async function () {
    //   // We don't use the fixture here because we want a different deployment
    //   const latestTime = await time.latest();
    //   const Lock = await ethers.getContractFactory("Lock");
    //   await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
    //     "Unlock time should be in the future"
    //   );
    // });
  });

  describe("Token flow", function() {
    it("can transfer", async function(){
      const { erc20, owner, otherAccount} = await loadFixture(deployERC20);
      
      const balanceToTransfer =  new Bignumber(1000 * 10 ** DECIMALS);
      
      expect((await erc20.balanceOf(otherAccount.address)).toString()).to.equal('0');



      const ownerBalanceBefore = await erc20.balanceOf(owner.address);

      await erc20.transfer(otherAccount.address, balanceToTransfer.toFixed(0));

      expect((await erc20.balanceOf(otherAccount.address)).toString()).to.equal(
        balanceToTransfer.toFixed(0)
        );

      
      expect((await erc20.balanceOf(owner.address)).toString()).to.equal(
        new Bignumber(ownerBalanceBefore.toString())
        .minus(balanceToTransfer)
        .toFixed(0)
        );  

    });

    it("Should revert with no balance", async function () {
            const { erc20, otherAccount, anotherAccount } = await loadFixture(deployERC20);
            
            // We use lock.connect() to send a transaction from another account
            await expect(erc20.connect(otherAccount).transfer(anotherAccount.address, '1000')).to.be.revertedWith(
              "No balance"
            );
    });

    it("Should approve", async function () {
      const { erc20, otherAccount, owner} = await loadFixture(deployERC20);
      
      const AMOUNT_TO_APPROVE = 50;

      await erc20.approve(otherAccount.address, AMOUNT_TO_APPROVE);

      // We use lock.connect() to send a transaction from another account
      expect( await erc20.allowance(owner.address, otherAccount.address)).to.equal(AMOUNT_TO_APPROVE);
    });


    it("Should revert with no allowance", async function () {
      const { erc20, otherAccount, owner,anotherAccount} = await loadFixture(deployERC20);
      
      const AMOUNT_TO_TRY = 50;

      await erc20.approve(otherAccount.address, AMOUNT_TO_TRY);

       expect( 
        await erc20.connect(otherAccount)
        .transferFrom(owner.address, anotherAccount.address, AMOUNT_TO_TRY))
        .to.be.revertedWith('No allowance');
    });

    it("Should transferFrom", async function () {
      const { erc20, otherAccount, owner,anotherAccount} = await loadFixture(deployERC20);
      
      const AMOUNT_TO_TRY = 50;

      const ownerBalanceBefore = await erc20.balanceOf(owner.address);
      const anotherAccountBalanceBefore = await erc20.balanceOf(anotherAccount.address);
      
      
      await erc20.approve(otherAccount.address, AMOUNT_TO_TRY);

      const otherAccountAllowanceBeforeTransfer = await erc20.allowance(
        owner.address, 
        otherAccount.address
      );  

      expect(otherAccountAllowanceBeforeTransfer.toString()).to.equal(
        AMOUNT_TO_TRY.toString()
        );

      
      await erc20.connect(otherAccount)
        .transferFrom(owner.address, anotherAccount.address, AMOUNT_TO_TRY);

        const otherAccountAllowanceAfterTransfer = await erc20.allowance(
          owner.address, 
          otherAccount.address
        );  
      
       expect(otherAccountAllowanceAfterTransfer.toString()).to.equal("0");

      const ownerBalanceAfter = await erc20.balanceOf(owner.address);

      expect(ownerBalanceAfter.toString()).to.equal(
        new Bignumber(ownerBalanceBefore.toString())
        .minus(AMOUNT_TO_TRY)
        .toFixed(0)
      );

      /////OK

      expect((await erc20.balanceOf(anotherAccount.address)).toString()).to.equal(
        new Bignumber(anotherAccountBalanceBefore.toString())
        .plus(AMOUNT_TO_TRY)
        .toFixed(0)
      );

    });

  })


  // describe("Withdrawals", function () {
  //   describe("Validations", function () {
  //     it("Should revert with the right error if called too soon", async function () {
  //       const { lock } = await loadFixture(deployOneYearLockFixture);

  //       await expect(lock.withdraw()).to.be.revertedWith(
  //         "You can't withdraw yet"
  //       );
  //     });

  //     it("Should revert with the right error if called from another account", async function () {
  //       const { lock, unlockTime, otherAccount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // We can increase the time in Hardhat Network
  //       await time.increaseTo(unlockTime);

  //       // We use lock.connect() to send a transaction from another account
  //       await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
  //         "You aren't the owner"
  //       );
  //     });

  //     it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
  //       const { lock, unlockTime } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       // Transactions are sent using the first signer by default
  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).not.to.be.reverted;
  //     });
  //   });

  //   describe("Events", function () {
  //     it("Should emit an event on withdrawals", async function () {
  //       const { lock, unlockTime, lockedAmount } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw())
  //         .to.emit(lock, "Withdrawal")
  //         .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
  //     });
  //   });

  //   describe("Transfers", function () {
  //     it("Should transfer the funds to the owner", async function () {
  //       const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
  //         deployOneYearLockFixture
  //       );

  //       await time.increaseTo(unlockTime);

  //       await expect(lock.withdraw()).to.changeEtherBalances(
  //         [owner, lock],
  //         [lockedAmount, -lockedAmount]
  //       );
  //     });
  //   });
  // });
});
