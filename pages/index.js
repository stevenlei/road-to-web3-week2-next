import Head from "next/head";
import { useState, useEffect } from "react";
import { ethers } from "ethers";

const CONTRACT_ABI = require("../contracts/BuyMeACoffee.json");
const CONTRACT_ADDRESS = "0x04d91921a713ca3b82075a46807e99e168815e21";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isSettingNewRecipient, setIsSettingNewRecipient] = useState(false);

  const [errorMessage, setErrorMessage] = useState(null);
  const [errorMessageWithdraw, setErrorMessageWithdraw] = useState(null);
  const [errorMessageSettingNewRecipient, setErrorMessageSettingNewRecipient] = useState(null);

  const [coffeeSize, setCoffeeSize] = useState("S");
  const [recipient, setRecipient] = useState("");
  const [contractBalance, setContractBalance] = useState(0);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [memos, setMemos] = useState([]);

  useEffect(() => {
    checkIfWalletIsConnected();
    walletChangeListener();
    fetchRecipient();
    fetchContractBalance();
    fetchMessages();
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      if (window.ethereum) {
        const { ethereum } = window;

        const accounts = await ethereum.request({
          method: "eth_accounts",
        });

        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          ensureOnNetwork();
        }
      }
    } catch (err) {
      console.error("Please install metamask");
    }
  };

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const { ethereum } = window;

        const accounts = await ethereum.request({
          method: "eth_requestAccounts",
        });

        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          ensureOnNetwork();
        } else {
          alert("No address found");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const walletChangeListener = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        ethereum.on("accountsChanged", async (accounts) => {
          if (accounts.length === 0) {
            // Disconnected
            setWalletAddress(null);
          } else {
            setWalletAddress(accounts[0]);
            ensureOnNetwork();
          }
        });
      }
    } catch (err) {}
  };

  const ensureOnNetwork = async () => {
    try {
      const { ethereum } = window;

      const provider = new ethers.providers.Web3Provider(ethereum);
      const { chainId } = await provider.getNetwork();
      console.log(`chainId: ${chainId}`);

      if (chainId !== 5) {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [
            {
              chainId: `0x${Number(5).toString(16)}`,
            },
          ],
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const buyCoffee = async () => {
    if (name === "") {
      alert("Please enter your name");
      return;
    }

    if (message === "") {
      alert("Please enter your message");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { ethereum } = window;

      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI.abi, signer);

      const amount = coffeeSize === "S" ? ethers.utils.parseEther("0.001") : ethers.utils.parseEther("0.003");

      const tx = await contract.buyCoffee(name, message, {
        value: amount,
      });

      const receipt = await tx.wait();
      console.log(receipt);

      await fetchMessages();
      await fetchContractBalance();
      setName("");
      setMessage("");
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const withdraw = async () => {
    setIsWithdrawing(true);
    setErrorMessageWithdraw(null);

    try {
      const { ethereum } = window;

      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI.abi, signer);

      const tx = await contract.withdraw();

      const receipt = await tx.wait();
      console.log(receipt);

      await fetchContractBalance();
    } catch (err) {
      console.error(err);
      setErrorMessageWithdraw(err.message);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const setMyselfAsRecipient = async () => {
    setIsSettingNewRecipient(true);
    setErrorMessageSettingNewRecipient(null);

    try {
      const { ethereum } = window;

      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI.abi, signer);

      const tx = await contract.setMyselfAsRecipient();
      const receipt = await tx.wait();

      console.log(receipt);

      await fetchRecipient();
    } catch (err) {
      console.error(err);
      setErrorMessageSettingNewRecipient(err.message);
    } finally {
      setIsSettingNewRecipient(false);
    }
  };

  const changeCoffeeSize = (size) => {
    setCoffeeSize(size);
  };

  const fetchRecipient = async () => {
    try {
      const { ethereum } = window;

      const provider = new ethers.providers.Web3Provider(ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI.abi, provider);

      const recipient = await contract.recipient();

      setRecipient(recipient);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchContractBalance = async () => {
    try {
      const { ethereum } = window;

      const provider = new ethers.providers.Web3Provider(ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI.abi, provider);

      const balance = await provider.getBalance(contract.address);

      setContractBalance(ethers.utils.formatEther(balance));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async () => {
    try {
      const { ethereum } = window;

      const provider = new ethers.providers.Web3Provider(ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI.abi, provider);

      const memos = await contract.memos();

      setMemos(memos);
    } catch (err) {
      console.error(err);
    }
  };

  const loadingIcon = () => (
    <svg
      className="animate-spin -mt-1 h-6 w-6 text-white inline-block"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  return (
    <div className="bg-yellow-300 min-h-screen">
      <Head>
        <title>Road to Web3 - Week2</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="max-w-6xl mx-auto px-6 py-12 md:p-20">
        <h1 className="text-5xl font-bold text-center text-yellow-900">Road to Web3 - Week2</h1>
        <p className="text-center mt-4 text-lg max-w-xl mx-auto text-yellow-700">
          This is a practice project to learn Web3.js and solidity. Second week is to develop a &quot;Buy Me a
          Coffee&quot; smart contract.
          <br />
          <a
            href="https://docs.alchemy.com/alchemy/road-to-web3/weekly-learning-challenges/2.-how-to-build-buy-me-a-coffee-defi-dapp"
            target="_blank"
            rel="noreferrer"
            className="inline-block bg-yellow-500 rounded-md text-white mt-2 p-1 px-2 hover:bg-yellow-600"
          >
            ➡️ Amazing tutorial here
          </a>
        </p>

        {walletAddress && (
          <div className="flex flex-wrap md:flex-nowrap mt-16">
            <div className="self-start w-full md:w-1/2 md:m-3">
              <div className="self-start w-full bg-yellow-100 rounded-xl overflow-hidden">
                <h4 className="text-2xl text-center bg-yellow-700 p-2 text-white">Buy Me a Coffee</h4>
                <div className="p-4">
                  <h5 className="text-center p-2 text-xl italic text-yellow-700">Coffee Size</h5>
                  <ul className="flex justify-center items-center">
                    <li
                      onClick={() => changeCoffeeSize("S")}
                      className={`text-3xl w-16 h-16 flex justify-center items-center cursor-pointer rounded-md m-2 ${
                        coffeeSize === "S" ? "bg-yellow-800 ring-4 ring-yellow-600" : "bg-yellow-300"
                      }`}
                    >
                      ☕️
                    </li>
                    <li
                      onClick={() => changeCoffeeSize("L")}
                      className={`text-5xl w-16 h-16 flex justify-center items-center cursor-pointer rounded-md m-2 ${
                        coffeeSize === "L" ? "bg-yellow-800 ring-4 ring-yellow-600" : "bg-yellow-300"
                      }`}
                    >
                      ☕️
                    </li>
                  </ul>
                  <h5 className="text-center p-2 text-xl italic text-yellow-700 mt-6">Price</h5>
                  <div className="text-center text-3xl text-yellow-800">
                    {coffeeSize === "S" ? "0.001" : "0.003"} ETH
                  </div>
                  <h5 className="text-center p-2 text-xl italic text-yellow-700 mt-6">Leave a message</h5>
                  <div>
                    <input
                      type="text"
                      onInput={() => setName(event.target.value)}
                      value={name}
                      className="w-full bg-white border border-yellow-500 p-2 rounded-md mt-2"
                      placeholder="Your name"
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      onInput={() => setMessage(event.target.value)}
                      value={message}
                      className="w-full bg-white border border-yellow-500 p-2 rounded-md mt-2"
                      placeholder="Your message"
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    onClick={buyCoffee}
                    disabled={isLoading}
                    className="py-2 px-5 mt-6 mb-2 pb-3 w-full bg-yellow-900 hover:bg-yellow-800 shadow rounded-full text-white text-2xl"
                  >
                    {isLoading ? (
                      loadingIcon()
                    ) : (
                      <>
                        Buy <span className="text-3xl">☕️</span>
                      </>
                    )}
                  </button>
                  {errorMessage && <p className="px-4 py-2 text-red-600">{errorMessage}</p>}
                </div>
              </div>
              <div className="self-start w-full mt-6 bg-yellow-100 rounded-xl overflow-hidden">
                <h4 className="text-2xl text-center bg-yellow-700 p-2 text-white">Coffee Wallet Info</h4>
                <div className="p-4 pb-8">
                  <h5 className="text-center p-2 text-xl italic text-yellow-700">Balance</h5>
                  <div className="text-center text-3xl text-yellow-800">{contractBalance} ETH</div>

                  <button
                    onClick={withdraw}
                    disabled={isWithdrawing}
                    className="py-2 px-5 mt-8 mb-2 pb-3 w-full bg-yellow-600 hover:bg-yellow-700 shadow rounded-full text-white text-2xl"
                  >
                    {isWithdrawing ? (
                      loadingIcon()
                    ) : (
                      <>
                        Withdraw <span className="text-3xl">💸</span>
                      </>
                    )}
                  </button>

                  {errorMessageWithdraw && <p className="px-4 py-2 text-red-600">{errorMessageWithdraw}</p>}

                  <p className="px-4 py-2 text-gray-500">
                    Anyone can withdraw the funds, but it will only send to {recipient}.
                  </p>

                  <button
                    onClick={setMyselfAsRecipient}
                    disabled={isSettingNewRecipient}
                    className="py-2 px-5 mt-6 mb-2 pb-3 w-full bg-yellow-600 hover:bg-yellow-700 shadow rounded-full text-white text-2xl"
                  >
                    {isSettingNewRecipient ? (
                      loadingIcon()
                    ) : (
                      <>
                        Set me as the recipient! <span className="text-3xl">🤑</span>
                      </>
                    )}
                  </button>

                  {errorMessageSettingNewRecipient && (
                    <p className="px-4 py-2 text-red-600">{errorMessageSettingNewRecipient}</p>
                  )}

                  <p className="px-4 py-2 text-gray-500">
                    All the funds will be sent to the current recipient before setting you as the new recipient.
                  </p>
                </div>
              </div>
            </div>
            <div className="self-start w-full mt-6 md:mt-3 md:w-1/2 md:m-3 bg-yellow-100 rounded-xl overflow-hidden">
              <h4 className="text-2xl text-center bg-yellow-700 p-2 text-white">Messages</h4>
              <div className="p-4">
                {memos.map((memo, index) => (
                  <div key={index} className="bg-white p-4 rounded mb-2">
                    <span className="text-yellow-600">
                      {memo.name} @ {new Date(memo.timestamp.toNumber() * 1000).toLocaleDateString()}{" "}
                      {new Date(memo.timestamp.toNumber() * 1000).toLocaleTimeString()}
                    </span>
                    <p className="text-gray-600">{memo.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-12">
          {!walletAddress && (
            <button
              className="mt-12 py-3 px-8 bg-yellow-700 shadow hover:bg-yellow-800 rounded-full text-white text-2xl"
              onClick={connectWallet}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
