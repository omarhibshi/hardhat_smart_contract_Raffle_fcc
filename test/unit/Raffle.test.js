const { assert, expect } = require("chai")
const { deployments, ethers, network } = require("hardhat")
const {
    developementChains,
    networkConfig,
} = require("../../helper-hardhat-config")
const { __evm__Adjust } = require("../../utils/myTools")

!developementChains.includes(network.name)
    ? describe.skip
    : describe(" === Raffle Unit Tests ===", function () {
          let raffle,
              entranceFee,
              interval,
              player,
              raffleContract,
              vrfCoordV2Mock,
              accounts

          const chainId = network.config.chainId
          //
          beforeEach(async function () {
              accounts = await ethers.getSigners() // could also do with getNamedAccounts
              player = accounts[1]
              await deployments.fixture(["mocks", "raffle"]) // Deploys modules with the tags "mocks" and "raffle"
              vrfCoordV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
              raffleContract = await ethers.getContract("Raffle") // Returns a new connection to the Raffle contract
              raffle = raffleContract.connect(player) // Returns a new instance of the Raffle contract connected to player
              entranceFee = await raffle.getEntranceFee()
              interval = await raffle.getInterval()

              /**
               *  @Notice Below is another method for retrieving deployed contract
               *  deployer = (await getNamedAccounts()).deployer
               *  await deployments.fixture(["mocks", "raffle"])
               *  raffle = await ethers.getContract("Raffle", deployer)
               */
          })
          describe("*** Constrctor ***", function () {
              it("- initializes raffleState ...", async () => {
                  const raffleState = await raffle.getRaffleState()
                  assert.equal(raffleState.toString(), "0")
              })
              it("- initializes Interval ...", async () => {
                  assert.equal(
                      interval.toString(),
                      networkConfig[chainId]["interval"]
                  )
              })
              it("- initializes gasLane ...", async () => {
                  const gasLane = await raffle.getGasLane()
                  assert.equal(
                      gasLane.toString(),
                      networkConfig[chainId]["gasLane"]
                  )
              })

              it("- initializes entranceFee ...", async () => {
                  assert.equal(
                      entranceFee.toString(),
                      networkConfig[chainId]["entranceFee"]
                  )
              })

              it("- initializes callbackGasLimit ...", async () => {
                  const callbackGasLimit = await raffle.getCallbackGasLimit()
                  assert.equal(
                      callbackGasLimit.toString(),
                      networkConfig[chainId]["callbackGasLimit"]
                  )
              })
          })
          describe("*** Enter Raffle ***", function () {
              it("- reverts if you don't pay enough", async () => {
                  await expect(
                      raffle.enterRaffle()
                  ).to.be.revertedWithCustomError(
                      raffle,
                      "Raffle__NotEnoughETHEntered"
                  )
              })
              it("- records players when they enter", async () => {
                  await raffle.enterRaffle({ value: entranceFee })
                  const playerFromContract = await raffle.getPlayer(0)
                  assert.equal(playerFromContract, playerFromContract)
              })

              it("- emits event on entering the raffel", async () => {
                  await expect(
                      raffle.enterRaffle({ value: entranceFee })
                  ).to.emit(raffle, "RaffleEntered")
              })
              it("- doesn't allow entrance when raffle is calculating ...", async () => {
                  await raffle.enterRaffle({ value: entranceFee })
                  await __evm__Adjust(interval, 1)
                  // we pretend to be a chainlink keeper
                  await raffle.performUpkeep([])
                  await expect(
                      raffle.enterRaffle({ value: entranceFee })
                  ).to.be.revertedWithCustomError(raffle, "Raffle__NotOpen")
              })
          })
          describe("*** checkUpKeep ***", function () {
              it("- returns false if people haven't sent any ETH", async () => {
                  await __evm__Adjust(interval, 1)
                  const upKeepNeeded = await raffle.callStatic.checkUpkeep([])
                  assert(!upKeepNeeded[0])
              })
              it("- returns false if raffle isn't open", async () => {
                  await raffle.enterRaffle({ value: entranceFee })
                  await __evm__Adjust(interval, 1)
                  await raffle.performUpkeep("0x") // "0x" means balnk object just like ([])
                  const raffleState = await raffle.getRaffleState()
                  const upKeepNeeded = await raffle.callStatic.checkUpkeep([])
                  assert.equal(raffleState.toString(), "1")
                  assert.equal(upKeepNeeded[0], false)
              })
              it("- returns false if raffle isn't open", async () => {
                  await raffle.enterRaffle({ value: entranceFee })
                  await __evm__Adjust(interval, 1)
                  await raffle.performUpkeep([]) // changes the state to calculating
                  const raffleState = await raffle.getRaffleState() // stores the new state
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep(
                      "0x"
                  ) // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert.equal(
                      raffleState.toString() == "1",
                      upkeepNeeded == false
                  )
              })
              it("- returns false if enough time hasn't passed", async () => {
                  await raffle.enterRaffle({ value: entranceFee })
                  await __evm__Adjust(interval, -6)
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep(
                      "0x"
                  ) // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(!upkeepNeeded)
              })
              it("- returns true if enough time has passed, has players, eth, and is open", async () => {
                  await raffle.enterRaffle({ value: entranceFee })
                  await __evm__Adjust(interval, 1)
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep(
                      "0x"
                  ) // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(upkeepNeeded)
              })
          })
          describe("*** performUpKeep ***", () => {
              it("- it can only run if 'checkUpKeep' is true", async () => {
                  await raffle.enterRaffle({ value: entranceFee })
                  await __evm__Adjust(interval, 1)
                  const tx = await raffle.performUpkeep([])
                  assert(tx)
              })
              it("- it reverts when 'checkUpKeep' is false", async () => {
                  await raffle.enterRaffle({ value: entranceFee })
                  await __evm__Adjust(interval, -6)
                  await expect(
                      raffle.performUpkeep([])
                  ).to.be.revertedWithCustomError(
                      raffle,
                      "Raffle__UpkeepNotNeeded"
                  )
              })
              it("- it updates the raffle state, emits an event and calls the vrf Coordinator", async () => {
                  await raffle.enterRaffle({ value: entranceFee })
                  await __evm__Adjust(interval, 1)
                  const txRsp = await raffle.performUpkeep([])
                  const raffleState = await raffle.getRaffleState()
                  const txRcpt = await txRsp.wait(1)
                  const rqstId = await txRcpt.events[1].args.requestId
                  assert(rqstId.toNumber() > 0)
                  assert(raffleState == 1) // 0 = open, 1 = calculating
              })
          })
          describe("*** fullfillRandomwords ***", () => {
              beforeEach(async () => {
                  await raffle.enterRaffle({ value: entranceFee })
                  await __evm__Adjust(interval, 1)
              })
              it("- it can only be called after 'performUpKeep'", async () => {
                  await expect(
                      /** 
                  // this is a basic test to see fulfillRandomWords()'s behavior when called prior to calling performUpkeep([]),
                  // this action is simulated by calling fulfillRandomWords() while passing 0 as the requestId
                  */
                      vrfCoordV2Mock.fulfillRandomWords(0, raffle.address)
                  ).to.be.revertedWith("nonexistent request")
                  await expect(
                      vrfCoordV2Mock.fulfillRandomWords(1, raffle.address) // reverts if not fulfilled
                  ).to.be.revertedWith("nonexistent request")
              })
              it("- it picks a winner, resets the lottery, and sends money'", async () => {
                  const additionalEntrants = 3
                  const startingAccountIndex = 1 // deployer = 0
                  for (
                      let i = startingAccountIndex;
                      i < startingAccountIndex + additionalEntrants;
                      i++
                  ) {
                      const accountConnectedRaffle = raffle.connect(accounts[i])
                      await accountConnectedRaffle.enterRaffle({
                          value: entranceFee,
                      })
                  }
                  const startingTimeStamp = await raffle.getLatestTimeStamp()

                  // performUpKeep (mock being ChainLink keepers)
                  // fulfillRandomWord (mock being the ChainLink VRF)
                  // We will have to wait for the fulfillRandomWords to be called
                  // We aill do this by setting up a listener
                  await new Promise(async (resolve, reject) => {
                      raffle.once("WinnerPicked", async () => {
                          console.log(
                              `Found the event (${txRcpt.events[1].event})`
                          )
                          try {
                              const recentWinner =
                                  await raffle.getRecentWinner()
                              console.log(`- Recent winner : ${recentWinner}`)
                              console.log(
                                  `- Account 2 : ${accounts[2].address}`
                              )
                              console.log(
                                  `- Account 0 : ${accounts[0].address}`
                              )
                              console.log(
                                  `- Account 1 : ${accounts[1].address}`
                              )
                              console.log(
                                  `- Account 3 : ${accounts[2].address}`
                              )
                              //
                              const raffleState = await raffle.getRaffleState()
                              const endingTimeStamp =
                                  await raffle.getLatestTimeStamp()
                              const numPlayer =
                                  await raffle.getNumberOfPlayers()
                              const winnerEndinBalance =
                                  await accounts[1].getBalance()

                              assert.equal(numPlayer, 0)
                              assert.equal(raffleState, 0)
                              assert(endingTimeStamp > startingTimeStamp)
                              assert.equal(
                                  winnerEndinBalance.toString(),
                                  winnerStartinBalance.add(
                                      entranceFee
                                          .mul(additionalEntrants)
                                          .add(entranceFee)
                                          .toString()
                                  )
                              )
                              resolve()
                          } catch (e) {
                              reject(e)
                          }
                      })
                      // Setting up the listener
                      // below, we will fire the event, and the listener will pick it up, and resolve
                      const tx = await raffle.performUpkeep([])
                      const txRcpt = await tx.wait(1)
                      const winnerStartinBalance =
                          await accounts[1].getBalance()
                      await vrfCoordV2Mock.fulfillRandomWords(
                          txRcpt.events[1].args.requestId,
                          raffle.address
                      )
                  })
              })
          })
      })
