import headerStyles from "../styles/Header.module.css"
import buttonStyles from "../styles/connectButton.module.css"
import homeStyles from "../styles/Home.module.css"

import { ConnectButton } from "web3uikit"

export default function Header() {
    return (
        <header>
            <h1 className={headerStyles.title}>
                {" "}
                <span>Nextjs Smart Contract</span> Lottery
            </h1>
            <div className={homeStyles.card}>
                <ConnectButton />
            </div>
        </header>
    )
}
