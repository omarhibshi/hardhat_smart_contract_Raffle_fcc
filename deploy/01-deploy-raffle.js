const { network, ethers } = require("hardhat")
const { developementChains } = require("../helper-hardhat-config")
const { networkConfig } = require("../helper-hardhat-config")
const { VERIFICATION_BLOCK_CONFIRMATIONS } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

const FUND_AMOUNT = ethers.utils.parseEther("15") // 1 Ether, or 1e18 (10^18) Wei

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    //
    let vrfCoordinatorV2Address, subscriptionId, vrfCoordinatorV2Mock, sub
    //
    if (developementChains.includes(network.name)) {
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
        //
        const transactionResponse =
            await vrfCoordinatorV2Mock.createSubscription()
        //
        const transactionReceipt = await transactionResponse.wait()

        // once the transactionReceipt is submitted an event called "SubscriptionCreated" is
        // emmitted with subscription Id

        subscriptionId = transactionReceipt.events[0].args.subId

        // Fund the subscription
        // usually, you'd need the link token on a real network
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"]
        subscriptionId = networkConfig[chainId]["subscriptionId"]
        // No need to fund subscriptoion here because it is linked to wallet and done automatically
        // through the VRF v2 Subscription Manager which is available at vrf.chain.link.
    }

    const waitBlockConfirmations = developementChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS
    log("----------------------------------------------------")

    /** deploying the Raffle contract
     *
     * First : Get the list of constructor arguments ready
     *
     */

    const entranceFee = networkConfig[chainId]["entranceFee"]
    const gasLane = networkConfig[chainId]["gasLane"]
    const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
    const interval = networkConfig[chainId]["interval"]
    //
    const args = [
        vrfCoordinatorV2Address,
        subscriptionId,
        gasLane, // keyHash
        interval,
        entranceFee,
        callbackGasLimit,
    ]
    //
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmation: waitBlockConfirmations,
    })
    /**
     * @Notice the following line is important to avoid this "Error: VM Exception while processing transaction: reverted with custom error 'InvalidConsumer()'"
     */
    if (developementChains.includes(network.name)) {
        await vrfCoordinatorV2Mock.addConsumer(
            subscriptionId.toNumber(),
            raffle.address
        )
    }

    if (
        !developementChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(raffle.address, args)
    }
    log("Enter lottery with command:")
    const networkName = network.name == "hardhat" ? "localhost" : network.name
    log(`yarn hardhat run scripts/enterRaffle.js --network ${networkName}`)
    log("----------------------------------------------------")
}

module.exports.tags = ["all", "raffle"]
