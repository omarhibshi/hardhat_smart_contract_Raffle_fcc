import { contractAddresses, abi } from "../constants/index"
import { useMoralis, useWeb3Contract } from "react-moralis"
import { useEffect, useState } from "react"
import { ethers } from "ethers"
import buttonStyles from "../styles/connectButton.module.css"
import homeStyles from "../styles/Home.module.css"
import { useNotification } from "web3uikit"

export default function LotteryEntrance() {
    const [entranceFee, setEntranceFee] = useState("0")
    const { chainId: chainIdHex, isWeb3Enabled } = useMoralis() // Pull up "chainId" from Moralis and rename it to "chainIdHex"

    const chainId = parseInt(chainIdHex).toString()
    const raffleAddress =
        chainId in contractAddresses ? contractAddresses[chainId][0] : null

    const dispatch = useNotification()

    const { runContractFunction: enterRaffle } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "enterRaffle",
        params: {},
        msgValue: entranceFee,
    })

    const { runContractFunction: getEntranceFee } = useWeb3Contract({
        abi: abi,
        contractAddress: raffleAddress,
        functionName: "getEntranceFee",
        params: {},
    })

    async function updateUIValues() {
        // Another way we could make a contract call:
        // const options = { abi, contractAddress: raffleAddress }
        // const fee = await Moralis.executeFunction({
        //     functionName: "getEntranceFee",
        //     ...options,
        // })
        const entranceFeeFromCall = (await getEntranceFee()).toString()
        //const numPlayersFromCall = (await getPlayersNumber()).toString()
        //const recentWinnerFromCall = await getRecentWinner()
        //setEntranceFee(entranceFeeFromCall)
        //setNumberOfPlayers(numPlayersFromCall)
        //setRecentWinner(recentWinnerFromCall)
        //setEntranceFee(ethers.utils.formatUnits(entranceFeeFromCall, "ether"))
        setEntranceFee(entranceFeeFromCall)

        console.log(entranceFeeFromCall)
    }

    useEffect(() => {
        // useEffect is continuously running to check the state of any state variable. Here, the state variable is "isWeb3Enabled"
        if (isWeb3Enabled) {
            updateUIValues()
        }
    }, [isWeb3Enabled])

    const handleNewNotification = () => {
        dispatch({
            type: "info",
            message: "Transaction Complete!",
            title: "Transaction Notification",
            position: "topR",
            icon: "🔔️",
        })
    }
    const handleSuccess = async (tx) => {
        try {
            await tx.wait(1)
            updateUIValues()
            handleNewNotification(tx)
        } catch (error) {
            console.log(error)
        }
    }

    return (
        <div>
            <br></br>
            {raffleAddress ? (
                <p align="center">
                    <div className={homeStyles.logo}>
                        Entrance Fee :{" "}
                        {ethers.utils.formatUnits(entranceFee, "ether")} ETH
                    </div>
                    <br></br>
                    <br></br>
                    <button
                        className={buttonStyles.button}
                        onClick={async function () {
                            await enterRaffle({
                                onSuccess: handleSuccess,
                                onError: (error) => console.log(error),
                            })
                        }}
                    >
                        Enter Raffle
                    </button>
                </p>
            ) : (
                <p align="center">No Raffle Address Detected</p>
            )}
        </div>
    )
}
