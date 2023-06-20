const contractAddresses = require("./contractAddresses.json")
const abi = require("./abi.json")

//smart contract events
const EVENTS = {
    WINNER_PICKED: "WinnerPicked",
}

module.exports = { abi, contractAddresses, EVENTS }
