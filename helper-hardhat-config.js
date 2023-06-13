const { ethers } = require("hardhat")

const networkConfig = {
    11155111: {
        name: "sepolia",
        ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
        vrfCoordinatorV2: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane:
            "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        subscriptionId: "2426",
        callbackGasLimit: "500000",
        interval: "30",
    },
    31337: {
        name: "hardhat",
        ethUsdPriceFeed: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane:
            "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        callbackGasLimit: "500000",
        interval: "30",
    },
}

const developementChains = ["hardhat", "localhost"]
const DECIMALS = 8
const VERIFICATION_BLOCK_CONFIRMATIONS = 0
const FRONT_END_ADDRESSES_FILE =
    "./nextjs-smartcontract-lottery-fcc/constants/contractAddresses.json"
const FRONT_END_ABI_FILE =
    "./nextjs-smartcontract-lottery-fcc/constants/abi.json"

module.exports = {
    networkConfig,
    developementChains,
    DECIMALS,
    VERIFICATION_BLOCK_CONFIRMATIONS,
    FRONT_END_ADDRESSES_FILE,
    FRONT_END_ABI_FILE,
}
