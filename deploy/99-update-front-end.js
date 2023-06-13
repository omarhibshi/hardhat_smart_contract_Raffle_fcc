const { ethers } = require("hardhat")
const fs = require("fs-extra")
const { FRONT_END_ADDRESSES_FILE } = require("../helper-hardhat-config")
const { FRONT_END_ABI_FILE } = require("../helper-hardhat-config")

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("Updating front end")
        await updateContractAddresses()
        await updateAbi()
        console.log("Front end written!")
    }
}

async function updateAbi() {
    const raffle = await ethers.getContract("Raffle")
    fs.writeFileSync(
        FRONT_END_ABI_FILE,
        raffle.interface.format(ethers.utils.FormatTypes.json)
    )
}

async function updateContractAddresses() {
    const raffle = await ethers.getContract("Raffle")
    const chainId = network.config.chainId.toString()
    const JSONContent = fs.readFileSync(FRONT_END_ADDRESSES_FILE, "utf8")
    const contractAddresses = JSON.parse(JSONContent)

    if (chainId in contractAddresses) {
        if (!contractAddresses[chainId].includes(raffle.address)) {
            contractAddresses[chainId].push(raffle.address)
        }
    } else {
        contractAddresses[chainId] = [raffle.address]
    }
    fs.writeFileSync(
        FRONT_END_ADDRESSES_FILE,
        JSON.stringify(contractAddresses, null, 4)
    )
}

module.exports.tags = ["all", "frontend"]
