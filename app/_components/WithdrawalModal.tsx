'use client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { useWriteContract } from 'wagmi';
import { orderBookJson } from '@/public/_abis/OrderBook';
import { parseUnits, formatUnits } from 'viem';
import type { Output, Input as InputType } from '../types';
import { cn } from '@/lib/utils';

const formSchema = z.object({
	withdrawalAmount: z.preprocess(
		(value) => Number(value),
		z.number().min(0, 'Amount must be a positive number')
	)
});

interface WithdrawalModalProps {
	vault: InputType | Output;
}

export const WithdrawalModal = ({ vault }: WithdrawalModalProps) => {
	const { writeContractAsync } = useWriteContract();
	const [open, setOpen] = useState(false);
	const [rawAmount, setRawAmount] = useState<string>('0'); // Store the raw 18-decimal amount

	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setError(null);
		if (BigInt(rawAmount) > BigInt(vault.balance)) {
			setError('Amount exceeds vault balance');
		}
	}, [rawAmount, vault.balance]);

	// Vault balance in human-readable format (i.e., converted from 18 decimals)
	const readableBalance = formatUnits(vault.balance, Number(vault.token.decimals));

	// Define your form.
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			withdrawalAmount: 0
		}
	});

	const withdraw = async (amount: string) => {
		console.log('Withdraw', amount);
		// Send raw value to the contract (no conversion needed here)
		await writeContractAsync({
			abi: orderBookJson.abi,
			address: vault.orderbook.id as `0x${string}`,
			functionName: 'withdraw2',
			args: [vault.token.address, BigInt(vault.vaultId), BigInt(amount), []]
		});
	};

	const handleMaxClick = () => {
		// Set the form field to the readable max balance for display
		form.setValue('withdrawalAmount', parseFloat(readableBalance));
		// Set the raw balance directly
		setRawAmount(vault.balance.toString()); // Use raw vault balance directly
		form.setFocus('withdrawalAmount'); // Optional: focus the field after setting value
	};

	const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const userInput = e.target.value;
		form.setValue('withdrawalAmount', parseFloat(userInput));

		// Update the raw amount based on the user input (convert back to raw value)
		if (userInput) {
			console.log(userInput);
			try {
				const parsedRawAmount = parseUnits(userInput, Number(vault.token.decimals)).toString();
				setRawAmount(parsedRawAmount); // Update raw amount on every user change
			} catch {
				setRawAmount('0'); // Fallback to 0 if input is invalid
			}
		} else {
			setRawAmount('0'); // Fallback to 0 if input is empty
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger>
				<span
					className={cn(
						buttonVariants(),
						'bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-xl transition-colors cursor-pointer'
					)}
				>
					Withdraw
				</span>
			</DialogTrigger>
			<DialogContent className="bg-white">
				<DialogHeader>
					<DialogTitle>Withdraw</DialogTitle>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(async () => {
								// Always submit the raw amount stored in state
								await withdraw(rawAmount);
								setOpen(false);
							})}
							className="space-y-8"
						>
							<FormField
								control={form.control}
								name="withdrawalAmount"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Amount</FormLabel>
										<FormControl>
											{/* Use onChange to listen to user typing */}
											<Input
												placeholder="0"
												{...field}
												type="number"
												step="0.000000000000000001" // 18 decimals
												onChange={handleUserChange} // Listen for user typing
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
			</DialogContent>
		</Dialog>
	);
};
