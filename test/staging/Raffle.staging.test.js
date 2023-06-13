const { assert, expect } = require("chai")
const { deployments, ethers, network } = require("hardhat")
const { __evm__Adjust } = require("../../utils/myTools")
const {
    developementChains,
    networkConfig,
} = require("../../helper-hardhat-config")

developementChains.includes(network.name)
    ? describe.skip
    : describe(" === Raffle Staging Tests ===", () => {
          let raffle, entranceFee

          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer
              raffle = await ethers.getContract("Raffle", deployer)
              entranceFee = await raffle.getEntranceFee()
          })
          describe(" === FulfillRandomWords ===", () => {
              it("works with live ChainLink Keepers and ChainLink VRF, we got a random winner", async () => {
                  /**
                   * @Notice The following is true about ChainLink VRF & Keeper
                   * ChainLink keeper is an automation service (runs the performUpkeep())
                   * ChainLink VRF is a verified Randome number generator (runs the fulfillRandomWords())
                   */
                  console.log("____________ setting up test ____________\n")
                  const startingTimeStamp = await raffle.getLatestTimeStamp()
                  const accounts = await ethers.getSigners()
                  console.log(
                      `____________ accounts : ${accounts} ____________\n`
                  )

                  console.log("____________ Setting up Listener ____________\n")
                  await new Promise(async (resolve, reject) => {
                      // setup listener before we enter the raffle
                      // Just in case the blockchain moves REALLY fast
                      raffle.once("WinnerPicked", async () => {
                          console.log(
                              "____________ 'WinnerPicked' event fired ____________\n"
                          )
                          try {
                              const recentWinner =
                                  await raffle.getRecentWinner()
                              const raffleState = await raffle.getRaffleState()
                              const winnerEndingBalance =
                                  await accounts[0].getBalance()
                              const endingTimeStamp =
                                  await raffle.getLatestTimeStamp()

                              await expect(raffle.getPlayer(0)).to.be.reverted
                              assert.equal(
                                  recentWinner.toString(),
                                  accounts[0].address
                              )
                              assert.equal(raffleState, 0)
                              assert.equal(
                                  winnerEndingBalance.toString(),
                                  winnerStartingBalance
                                      .add(entranceFee)
                                      .toString()
                              )
                              assert(endingTimeStamp > startingTimeStamp)
                              resolve()
                          } catch (error) {
                              reject(error)
                          }
                      })
                      // entering the raffle
                      console.log("____________ Entering Raffle ____________\n")
                      /**
                       * @Notice By this moment, chainlink keeper (automation) is already running "performUpKeep"  waiting
                       * for "checkUpkeep" to rturn true.
                       * By this moment aslo,  all checkUpkeep's conditions are true except for players[] which  false for it is still empty.
                       * Once the line below is executed, players[]  will have at leaset one plyer thus return true.
                       * The next time 'performUpKeep' is called, it will check the status of 'checkupKeep' and this time 'checkupKeep' wil
                       * return true. performUpKeep will then call fulfillRandomWords()
                       *
                       */
                      const tx = await raffle.enterRaffle({
                          value: entranceFee,
                      })
                      await tx.wait(1)
                      console.log(
                          "____________ Ok, Time to wait ____________\n"
                      )
                      const winnerStartingBalance =
                          await accounts[0].getBalance()
                  })
              })
          })
      })
