import { useMoralis } from "react-moralis"
import { useEffect } from "react"

export default function ManualHeader() {
    const {
        enableWeb3,
        account,
        isWeb3Enabled,
        Moralis,
        deactivateWeb3,
        isWeb3EnabledLoading,
    } = useMoralis()

    useEffect(() => {
        if (isWeb3Enabled) return
        if (typeof window !== "undefined") {
            if (window.localStorage.getItem("connected") === "injected") {
                enableWeb3()
            }
        }
        // no dependency array, so only runs once
        // CARREFUL with this! Because then you can get circular render
        // balnk dependancy array, run once on load
        // dependencies isn an array, run anytime something in there changes
        enableWeb3()
    }, [isWeb3Enabled])

    useEffect(() => {
        Moralis.onAccountChanged((account) => {
            console.log(`Account changed to: ${account}`)
            if (account == null) {
                window.localStorage.removeItem("connected")
                deactivateWeb3()
                console.log["Null account found"]
            }
        })
    }, [])

    return (
        <div>
            {account ? (
                <div>
                    connected to {account.slice(0, 6)}...
                    {account.slice(account.length - 4)}
                </div>
            ) : (
                <button
                    onClick={async () => {
                        await enableWeb3(true)
                        if (typeof window !== "undefined") {
                            window.localStorage.setItem("connected", "injected") // inject is metamask
                            // window.localStorage.setItem("connected", "walletconnect")
                        }
                    }}
                    disabled={isWeb3EnabledLoading}
                >
                    Connect
                </button>
            )}
        </div>
    )
}
