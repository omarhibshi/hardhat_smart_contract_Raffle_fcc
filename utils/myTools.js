const { network } = require("hardhat")

async function __evm__Adjust(interval, timeCycle) {
    await network.provider.send("evm_increaseTime", [
        interval.toNumber() + timeCycle,
    ])
    //await network.provider.send("evm_mine", [])
    await network.provider.request({
        method: "evm_mine",
        params: [],
    })
}

module.exports = { __evm__Adjust }
