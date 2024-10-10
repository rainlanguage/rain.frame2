import React, { SetStateAction, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId, useSwitchChain, useWriteContract } from 'wagmi';
import * as allChains from 'wagmi/chains';
import { readContract } from 'viem/actions';
import { waitForTransactionReceipt } from 'viem/actions';
import { config } from '../providers';
import { Hex, erc20Abi, formatUnits, parseUnits } from 'viem';
import { orderBookJson } from '@/public/_abis/OrderBook';
import { getOrderDetailsGivenDeployment } from '../_services/parseDotrainFrontmatter';
import { getSubmissionTransactionData } from '../_services/transactionData';
import yaml from 'js-yaml';
import { Referral, YamlData } from '../_types/yamlData';
import { FrameState } from '../_types/frame';
import { useRouter } from 'next/navigation';
import { TokenInfo } from '../_services/getTokenInfo';
import { Alert, Button } from 'flowbite-react';
import { TriangleAlert } from 'lucide-react';

interface SubmissionModalProps {
	yamlData: YamlData;
	currentState: FrameState;
	buttonText: string;
	dotrainText: string;
	setError: React.Dispatch<SetStateAction<string | React.ReactElement | null>>;
}

enum SubmissionStatus {
	ApprovingTokens = 'ApprovingTokens',
	DeployingStrategy = 'DeployingStrategy',
	WaitingForDeploymentConfirmation = 'WaitingForDeploymentConfirmation',
	Done = 'Done'
}

export interface TokenDepositWithStatus {
	tokenAddress: Hex;
	tokenInfo: TokenInfo;
	amount: number;
	referrals?: Referral[] | undefined;
	status: TokenDepositStatus;
}

export interface TokenDeposit {
	amount: number;
	tokenInfo: TokenInfo;
	referrals?: Referral[] | undefined;
}

export enum TokenDepositStatus {
	Pending = 'Pending',
	CheckingAllowance = 'CheckingAllowance',
	ApprovingTokens = 'ApprovingTokens',
	WaitingForApprovalConfirmation = 'WaitingForApprovalConfirmation',
	TokensApproved = 'TokensApproved'
}

export const SubmissionModal = ({
	yamlData,
	buttonText,
	currentState,
	dotrainText,
	setError
}: SubmissionModalProps) => {
	const [showDisclaimer, setShowDisclaimer] = useState(true);

	const router = useRouter();

	const account = useAccount();
	const currentWalletChainId = useChainId();
	const { switchChainAsync } = useSwitchChain();
	const { writeContractAsync } = useWriteContract();

	const { orderBookAddress, network, scenario } = getOrderDetailsGivenDeployment(
		yamlData,
		currentState.deploymentOption?.deployment || ''
	);
	const { ...chains } = allChains;

	const [submissionState, setSubmissionState] = useState<SubmissionStatus>(
		SubmissionStatus.ApprovingTokens
	);
	const [tokenDeposits, setTokenDeposits] = useState<TokenDepositWithStatus[]>(
		currentState.deposits
			.map((deposit) => ({
				tokenAddress: deposit.tokenInfo.address as Hex,
				tokenInfo: currentState.tokenInfos.find(
					(info) => info.address === deposit.tokenInfo.address
				)!,
				amount: deposit.amount,
				referrals: deposit.referrals,
				status: TokenDepositStatus.Pending
			}))
			.filter((deposit) => deposit.amount > 0)
	);

	const [open, setOpen] = useState(false);
	const [showFinalMessage, setShowFinalMessage] = useState(false);

	useEffect(() => {
		if (submissionState === SubmissionStatus.Done) {
			setTimeout(() => {
				setShowFinalMessage(true);
			}, 1000);
		}
	}, [submissionState]);

	const resetSubmissionState = () => {
		setOpen(false);
		setSubmissionState(SubmissionStatus.ApprovingTokens);
		setShowFinalMessage(false);
		setShowDisclaimer(true);
	};

	const submitStrategy = async () => {
		try {
			// Make sure the user is on the correct chain
			if (currentWalletChainId !== network['chain-id']) {
				await switchChainAsync({ chainId: network['chain-id'] });
			}

			// Check if the user has sufficient funds
			for (const deposit of tokenDeposits) {
				if (!deposit.tokenInfo) throw new Error(`Token info not found`);

				const depositAmount = parseUnits(String(deposit.amount), deposit.tokenInfo.decimals);

				const balance = await readContract(config.getClient(), {
					abi: erc20Abi,
					address: deposit.tokenInfo.address,
					functionName: 'balanceOf',
					args: [account.address as `0x${string}`]
				});

				if (balance < depositAmount) {
					setError(
						<>
							<p className="mb-3">
								You don&apos;t have enough {deposit.tokenInfo.symbol} to cover this deposit.
							</p>
							<p className="mb-3">
								Your balance: {formatUnits(BigInt(balance), deposit.tokenInfo.decimals)}
								<br />
								Deposit amount: {deposit.amount}
							</p>
							{deposit.referrals ? (
								<>
									You may be able to get {deposit.tokenInfo.symbol} from:{' '}
									<ul>
										{deposit.referrals?.map((ref, index) => (
											<li key={index}>
												<a
													href={ref.url}
													target="_blank"
													rel="noreferrer"
													style={{ color: 'blue', textDecoration: 'underline' }}
												>
													{ref.name}
												</a>
											</li>
										))}
									</ul>
								</>
							) : (
								''
							)}
						</>
					);
					setOpen(false);
					return;
				}
			}

			// Check if the user has sufficient token approvals
			for (const deposit of tokenDeposits) {
				if (!deposit.tokenInfo) throw new Error(`Token info not found`);

				const depositAmount = parseUnits(String(deposit.amount), deposit.tokenInfo.decimals);

				const existingAllowance = await readContract(config.getClient(), {
					abi: erc20Abi,
					address: deposit.tokenInfo.address,
					functionName: 'allowance',
					args: [account.address as `0x${string}`, orderBookAddress]
				});

				if (existingAllowance < depositAmount) {
					setTokenDeposits((prev) =>
						prev.map((prevDeposit) =>
							prevDeposit.tokenInfo.address === deposit.tokenInfo.address
								? { ...prevDeposit, status: TokenDepositStatus.ApprovingTokens }
								: prevDeposit
						)
					);

					// Send approval transaction
					const approveTx = await writeContractAsync({
						address: deposit.tokenInfo.address,
						abi: erc20Abi,
						functionName: 'approve',
						args: [orderBookAddress, depositAmount]
					});

					setTokenDeposits((prev) =>
						prev.map((prevDeposit) =>
							prevDeposit.tokenInfo.address === deposit.tokenInfo.address
								? {
										...prevDeposit,
										status: TokenDepositStatus.WaitingForApprovalConfirmation
									}
								: prevDeposit
						)
					);

					// Wait for approval transaction confirmation
					await waitForTransactionReceipt(config.getClient(), {
						hash: approveTx,
						confirmations: 1
					});

					setTokenDeposits((prev) =>
						prev.map((prevDeposit) =>
							prevDeposit.tokenInfo.address === deposit.tokenInfo.address
								? { ...prevDeposit, status: TokenDepositStatus.TokensApproved }
								: prevDeposit
						)
					);
				} else {
					setTokenDeposits((prev) =>
						prev.map((prevDeposit) =>
							prevDeposit.tokenInfo.address === deposit.tokenInfo.address
								? { ...prevDeposit, status: TokenDepositStatus.TokensApproved }
								: prevDeposit
						)
					);
				}
			}

			const convertedBindings = Object.keys(currentState.bindings).reduce((acc, key) => {
				const value = currentState.bindings[key];
				if (isNaN(value)) {
					return { ...acc, [key]: value };
				}
				return { ...acc, [key]: Number(value) };
			}, {});
			scenario.bindings = {
				...scenario.bindings,
				...convertedBindings
			};

			// Get multicall data for addOrder and deposit
			const updatedDotrainText = yaml.dump(yamlData) + '---' + dotrainText.split('---')[1];

			const { addOrderCalldata, depositCalldatas } = await getSubmissionTransactionData(
				currentState,
				updatedDotrainText,
				tokenDeposits
			);

			// Send deployment transaction
			const deployTx = await writeContractAsync({
				address: orderBookAddress,
				abi: orderBookJson.abi,
				functionName: 'multicall',
				args: [[addOrderCalldata, ...depositCalldatas]]
			});

			setSubmissionState(SubmissionStatus.WaitingForDeploymentConfirmation);

			// Wait for deployment transaction confirmation
			await waitForTransactionReceipt(config.getClient(), {
				hash: deployTx,
				confirmations: 4
			});

			setSubmissionState(SubmissionStatus.Done);
		} catch (e: any) {
			if (
				e?.cause?.message?.includes('addEthereumChain') ||
				e?.message?.includes('addEthereumChain')
			) {
				setError(
					`Your wallet doesn't support switching to ${
						Object.values(chains).find((chain) => chain.id === network['chain-id'])?.name
					}`
				);
			} else {
				setError(e?.cause?.message || e?.message || 'An error occurred');
			}
			setOpen(false);
			console.error(e);
		}
	};

	return (
		<Dialog open={open}>
			{account.isConnected ? (
				<Button
					onClick={() => setOpen(true)}
					color="primary"
					size="sm"
					className=" from-blue-600 to-violet-600 bg-gradient-to-br"
				>
					{buttonText}
				</Button>
			) : (
				<ConnectButton />
			)}
			<DialogContent
				onInteractOutside={resetSubmissionState}
				className="bg-white flex flex-col justify-center w-full font-light gap-y-8"
			>
				{showDisclaimer && (
					<div className="flex flex-col items-start gap-y-4">
						<DialogTitle className="w-full font-light text-2xl">Wait!</DialogTitle>
						<div className="space-y-4">
							<Alert color="red" className="text-base">
								<div className="flex items-center justify-center">
									<TriangleAlert color="red" size="40" />
									<span className="ml-2">
										Before you deploy your strategy, make sure you understand the following:
									</span>
								</div>
							</Alert>
							<ul className="list-disc list-outside space-y-2 text-gray-700">
								<li className="ml-4">
									This front end is provided as a tool to interact with the Raindex smart contracts.
								</li>
								<li className="ml-4">
									You are deploying your own strategy and depositing funds to an immutable smart
									contract using your own wallet and private keys.
								</li>
								<li className="ml-4">
									Nobody is custodying your funds, there is no recourse for recovery of funds if
									lost.
								</li>
								<li className="ml-4">
									There is no endorsement or guarantee provided with these strategies.
								</li>
								<li className="ml-4">
									Do not proceed if you do not understand the strategy you are deploying.
								</li>
								<li className="ml-4">Do not invest unless you are prepared to lose all funds.</li>
							</ul>
						</div>
						<Button
							size="sm"
							color="primary"
							onClick={() => {
								setShowDisclaimer(false);
								submitStrategy();
							}}
						>
							I understand
						</Button>
					</div>
				)}

				{!showDisclaimer && !showFinalMessage && (
					<div>
						<DialogTitle className="w-full font-light text-2xl mb-4">
							Deploying your strategy
						</DialogTitle>
						<div
							className={`transition-opacity duration-1000 flex flex-col ${
								submissionState === SubmissionStatus.Done ? 'opacity-0' : 'opacity-100'
							}`}
						>
							{tokenDeposits.map((deposit, i) => (
								<div key={i} className="flex items-center my-4">
									<div
										className={`text-2xl text-white rounded-full flex items-center justify-center mr-4 transition-all ${
											deposit.status === TokenDepositStatus.Pending
												? 'bg-gray-400 w-10 h-10'
												: deposit.status === TokenDepositStatus.CheckingAllowance ||
													  deposit.status === TokenDepositStatus.ApprovingTokens ||
													  deposit.status === TokenDepositStatus.WaitingForApprovalConfirmation
													? 'bg-amber-500 w-12 h-12'
													: 'bg-emerald-600 w-10 h-10'
										}`}
									>
										{i + 1}
									</div>
									<div className="text-lg">
										{deposit.status === TokenDepositStatus.Pending ? (
											<span className="text-gray-500">Approve {deposit.tokenInfo.symbol}</span>
										) : deposit.status === TokenDepositStatus.CheckingAllowance ? (
											<span className="animate-pulse">
												Checking allowance for {deposit.tokenInfo.symbol}...
											</span>
										) : deposit.status === TokenDepositStatus.ApprovingTokens ? (
											<span className="animate-pulse">
												Approving allowance for {deposit.tokenInfo.symbol}...
											</span>
										) : deposit.status === TokenDepositStatus.WaitingForApprovalConfirmation ? (
											<span className="animate-pulse">Waiting for approval confirmation...</span>
										) : (
											`${deposit.tokenInfo.symbol} allowance approved`
										)}
									</div>
								</div>
							))}

							<div className="flex items-center my-4">
								<div
									className={`text-2xl text-white rounded-full transition-all flex items-center justify-center mr-4 ${
										submissionState === SubmissionStatus.DeployingStrategy
											? 'bg-amber-500 w-12 h-12'
											: submissionState === SubmissionStatus.WaitingForDeploymentConfirmation
												? 'bg-amber-500 w-12 h-12'
												: submissionState === SubmissionStatus.Done
													? 'bg-emerald-600 w-10 h-10'
													: 'bg-gray-400 w-10 h-10'
									}`}
								>
									{tokenDeposits.length + 1}
								</div>
								<div className="text-lg">
									{submissionState === SubmissionStatus.DeployingStrategy ? (
										<span className="animate-pulse">Deploying strategy...</span>
									) : submissionState === SubmissionStatus.WaitingForDeploymentConfirmation ? (
										<span className="animate-pulse">Waiting for deployment confirmation...</span>
									) : submissionState === SubmissionStatus.Done ? (
										'Strategy deployed'
									) : (
										<span className="text-gray-500">Deploy strategy</span>
									)}
								</div>
							</div>
						</div>
					</div>
				)}
				{showFinalMessage ? (
					<div className="flex flex-col items-start transition-opacity duration-1500 animate-fade-in gap-y-4">
						<DialogTitle className="w-full font-light text-2xl">Your strategy is live!</DialogTitle>
						<div>
							It will continue to trade until removed. If you&apos;re interested in creating your
							own strategies from scratch, try <a href="https://docs.rainlang.xyz"> Raindex.</a>
						</div>
						<Button
							className="mt-4"
							onClick={() => router.push(`${window.location.origin}/my-strategies`)}
						>
							Track your strategy
						</Button>
					</div>
				) : null}
			</DialogContent>
		</Dialog>
	);
};
