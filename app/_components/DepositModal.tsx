'use client';
import { config } from '../providers';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog';
import { useWriteContract, useReadContract, useAccount } from 'wagmi';
import { orderBookJson } from '@/public/_abis/OrderBook';
import { parseUnits, formatUnits, erc20Abi } from 'viem';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { readContract } from 'viem/actions';
import { waitForTransactionReceipt } from '@wagmi/core';

export enum TokenDepositStatus {
	Idle,
	Pending = 'Pending',
	CheckingAllowance = 'CheckingAllowance',
	ApprovingTokens = 'ApprovingTokens',
	WaitingForApprovalConfirmation = 'WaitingForApprovalConfirmation',
	TokensApproved = 'TokensApproved',
	DepositingTokens = 'DepositingTokens',
	WaitingForDepositConfirmation = 'WaitingForDepositConfirmation',
	TokensDeposited = 'TokensDeposited',
	Error = 'Error',
	Done = 'Done'
}

const ERC20_ABI = [
	{
		constant: true,
		inputs: [{ name: 'owner', type: 'address' }],
		name: 'balanceOf',
		outputs: [{ name: '', type: 'uint256' }],
		type: 'function'
	}
];

const formSchema = z.object({
	depositAmount: z.preprocess(
		(value) => Number(value),
		z.number().min(0, 'Amount must be a positive number')
	)
});

interface Vault {
	token: any;
	vaultId: any;
	orderbook: any;
}

interface DepositModalProps {
	vault: Vault;
}

export const DepositModal = ({ vault }: DepositModalProps) => {
	const { writeContractAsync } = useWriteContract();
	const [open, setOpen] = useState(false);
	const [rawAmount, setRawAmount] = useState<string>('0');
	const [depositState, setDepositState] = useState<TokenDepositStatus>(TokenDepositStatus.Idle);
	const [error, setError] = useState<string | null>(null);
	const [depositTxHash, setDepositTxHash] = useState<string | null>(null);

	useEffect(() => {
		if (!open) {
			setDepositState(TokenDepositStatus.Idle);
			setError(null);
		}
	}, [open]);

	const address = useAccount().address;
	const chain = useAccount().chain;

	const handleDismiss = () => {
		setOpen(false);
		setDepositTxHash(null);
		setDepositState(TokenDepositStatus.Idle);
		setError(null);
	};

	const connectedWalletBalance: bigint = useReadContract({
		abi: ERC20_ABI,
		address: vault.token.address,
		functionName: 'balanceOf',
		args: [address as `0x${string}`]
	}).data as bigint;

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			depositAmount: 0
		}
	});

	const deposit = async () => {
		try {
			setDepositState(TokenDepositStatus.Pending);

			const depositAmount = form.getValues('depositAmount').toString();
			setRawAmount(depositAmount);

			const parsedAmount = parseUnits(depositAmount, vault.token.decimals);

			setDepositState(TokenDepositStatus.CheckingAllowance);
			const existingAllowance = await readContract(config.getClient(), {
				abi: erc20Abi,
				address: vault.token.address,
				functionName: 'allowance',
				args: [address as `0x${string}`, vault.orderbook.id]
			});
			if (existingAllowance < parsedAmount) {
				setDepositState(TokenDepositStatus.ApprovingTokens);
				try {
					const approveTx = await writeContractAsync({
						address: vault.token.address,
						abi: erc20Abi,
						functionName: 'approve',
						args: [vault.orderbook.id, parsedAmount]
					});

					setDepositState(TokenDepositStatus.WaitingForApprovalConfirmation);

					await waitForTransactionReceipt(config, {
						hash: approveTx,
						confirmations: 1
					});
				} catch (error: unknown) {
					setDepositState(TokenDepositStatus.Error);
					if (
						(error as Error)?.message &&
						(error as Error).message.includes('User rejected the request')
					) {
						setError('User rejected the approval request.');
					} else setError('Error during approval process');
				}

				setDepositState(TokenDepositStatus.TokensApproved);
			} else {
				setDepositState(TokenDepositStatus.TokensApproved);
			}

			setDepositState(TokenDepositStatus.DepositingTokens);
			const depositTx = await writeContractAsync({
				abi: orderBookJson.abi,
				address: vault.orderbook.id,
				functionName: 'deposit2',
				args: [vault.token.address, BigInt(vault.vaultId), parsedAmount, []]
			});
			setDepositTxHash(depositTx);

			setDepositState(TokenDepositStatus.WaitingForDepositConfirmation);

			await waitForTransactionReceipt(config, {
				hash: depositTx,
				confirmations: 1
			});

			setDepositState(TokenDepositStatus.Done);
		} catch (error: unknown) {
			setDepositState(TokenDepositStatus.Error);
			if (
				(error as Error)?.message &&
				(error as Error).message.includes('User rejected the request')
			) {
				setError('User rejected the deposit request.');
			} else setError('Error during deposit process');
		}
	};

	const handleMaxClick = () => {
		if (connectedWalletBalance === BigInt(0)) {
			return setError('Insuficient balance');
		} else if (!connectedWalletBalance) {
			return setError('No balance found');
		}
		const userMaxBalance = connectedWalletBalance?.toString();
		const readableMaxBalance = formatUnits(BigInt(userMaxBalance), vault.token.decimals);
		form.setValue('depositAmount', parseFloat(readableMaxBalance));
		setRawAmount(userMaxBalance);
		form.setFocus('depositAmount');
	};

	const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const userInput = e.target.value;
		form.setValue('depositAmount', parseFloat(userInput));

		if (userInput) {
			try {
				const parsedRawAmount = parseUnits(userInput, vault.token.decimals).toString();

				if (BigInt(parsedRawAmount) > connectedWalletBalance) {
					setError('Amount exceeds wallet balance');
				} else {
					setError(null);
				}
				setRawAmount(parsedRawAmount); // Update raw amount on every user change
			} catch {
				// TODO: Allow decimals
				setRawAmount('0'); // Fallback to 0 if input is invalid
			}
		} else {
			setRawAmount('0'); // Fallback to 0 if input is empty
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild={true}>
				<span
					className={cn(
						buttonVariants(),
						'bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-xl transition-colors cursor-pointer'
					)}
				>
					Deposit
				</span>
			</DialogTrigger>
			<DialogContent className="bg-white">
				{depositState === TokenDepositStatus.Idle && (
					<DialogHeader>
						<DialogTitle>Deposit</DialogTitle>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(async () => {
									await deposit();
								})}
								className="space-y-8"
							>
								<FormField
									control={form.control}
									name="depositAmount"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Amount</FormLabel>
											{connectedWalletBalance && (
												<div className="text-sm text-gray-500">
													Your {vault.token.symbol} Balance:{' '}
													<strong>
														{formatUnits(connectedWalletBalance, vault.token.decimals)}
													</strong>
												</div>
											)}
											<FormControl>
												<Input
													placeholder="0"
													{...field}
													type="number"
													step="0.1"
													onChange={handleUserChange}
												/>
											</FormControl>
											<FormMessage>{error}</FormMessage>
											<Button size="sm" type="button" onClick={handleMaxClick}>
												Max
											</Button>
											<FormMessage />
										</FormItem>
									)}
								/>
								<Button type="submit" disabled={!!error}>
									Submit
								</Button>
							</form>
						</Form>
					</DialogHeader>
				)}
				{depositState !== TokenDepositStatus.Idle && (
					<div>
						<DialogTitle className="w-full font-light text-2xl mb-4">
							Depositing your tokens
						</DialogTitle>
						{depositState === TokenDepositStatus.Error ? (
							<div className="flex flex-col gap-4  justify-center">
								<div className="bg-red-200  text-black p-4 rounded-lg flex flex-col gap-2">
									<p>Failed to deposit.</p>
									<p>{error}</p>
								</div>
								<Button className="w-fit" onClick={handleDismiss}>
									Dismiss
								</Button>
							</div>
						) : depositState === TokenDepositStatus.Done ? (
							<div className="flex flex-col gap-4  justify-center">
								<div className="bg-green-200 text-black p-4 rounded-lg flex flex-col gap-2">
									<p>Deposit completed successfully!</p>
								</div>
								<div className="flex gap-2">
									{chain?.blockExplorers?.default.url && depositTxHash && (
										<a
											href={(chain?.blockExplorers.default.url as string) + '/tx/' + depositTxHash}
											target="_blank"
											rel="noreferrer"
										>
											<Button className="w-fit">View Transaction</Button>
										</a>
									)}
									<Button className="w-fit" onClick={handleDismiss}>
										Dismiss
									</Button>
								</div>
							</div>
						) : (
							<div className={`transition-opacity duration-1000 flex flex-col`}>
								<div className="flex items-center my-4">
									<div
										className={`text-2xl text-white rounded-full flex items-center justify-center mr-4 transition-all ${
											depositState === TokenDepositStatus.Pending
												? 'bg-gray-400 w-10 h-10'
												: depositState === TokenDepositStatus.CheckingAllowance ||
													  depositState === TokenDepositStatus.ApprovingTokens ||
													  depositState === TokenDepositStatus.WaitingForApprovalConfirmation
													? 'bg-amber-500 w-12 h-12'
													: 'bg-emerald-600 w-10 h-10'
										}`}
									>
										{1}
									</div>
									<div className="text-lg">
										{depositState === TokenDepositStatus.Pending ? (
											<span className="text-gray-500">Approve {vault.token.symbol}</span>
										) : depositState === TokenDepositStatus.CheckingAllowance ? (
											<span className="animate-pulse">
												Checking allowance for {vault.token.symbol}...
											</span>
										) : depositState === TokenDepositStatus.ApprovingTokens ? (
											<span className="animate-pulse">
												Approving allowance for {vault.token.symbol}...
											</span>
										) : depositState === TokenDepositStatus.WaitingForApprovalConfirmation ? (
											<span className="animate-pulse">Waiting for approval confirmation...</span>
										) : (
											`${vault.token.symbol} allowance approved`
										)}
									</div>
								</div>

								<div className="flex items-center my-4">
									<div
										className={`text-2xl text-white rounded-full transition-all flex items-center justify-center mr-4 ${
											depositState === TokenDepositStatus.DepositingTokens
												? 'bg-amber-500 w-12 h-12'
												: depositState === TokenDepositStatus.WaitingForDepositConfirmation
													? 'bg-amber-500 w-12 h-12'
													: depositState === TokenDepositStatus.TokensDeposited
														? 'bg-emerald-600 w-10 h-10'
														: 'bg-gray-400 w-10 h-10'
										}`}
									>
										{2}
									</div>
									<div className="text-lg">
										{depositState === TokenDepositStatus.DepositingTokens ? (
											<span className="animate-pulse">
												Depositing {rawAmount} {vault.token.symbol}...
											</span>
										) : depositState === TokenDepositStatus.WaitingForDepositConfirmation ? (
											<span className="animate-pulse">Waiting for deposit confirmation...</span>
										) : depositState === TokenDepositStatus.TokensDeposited ? (
											'Deposit complete.'
										) : (
											<span className="text-gray-500">
												Depositing {rawAmount} {vault.token.symbol}...
											</span>
										)}
									</div>
								</div>
							</div>
						)}
						{chain?.blockExplorers?.default.url &&
							depositTxHash &&
							depositState !== TokenDepositStatus.Done && (
								<a
									href={(chain?.blockExplorers.default.url as string) + '/tx/' + depositTxHash}
									target="_blank"
									rel="noreferrer"
								>
									<Button className="w-fit">View Transaction</Button>
								</a>
							)}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};
