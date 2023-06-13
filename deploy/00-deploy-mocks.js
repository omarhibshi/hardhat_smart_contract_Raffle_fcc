const { network } = require("hardhat")
const { developementChains } = require("../helper-hardhat-config")

const BASE_FEE = "250000000000000000" //ethers.utils.parseEther("0.25") //0.25 is the prmium. it cost 0.25 LINK per request
const GAS_PRICE_LINK = 1e9 // link per gas, is this the gas lane? // 0.000000001 LINK per gas

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const args = [BASE_FEE, GAS_PRICE_LINK]

    if (developementChains.includes(network.name)) {
        log(`Local network "${network.name}" detected! deploying mocks ...`)
        // deploy a mock vrfCoordinator ...
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
        })
        log("Mocks Deployed")
        log("-------------------------------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
