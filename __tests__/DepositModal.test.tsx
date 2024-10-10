import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DepositModal } from '@/app/_components/DepositModal';
import { vi, type Mock } from 'vitest';
import { useWriteContract, useReadContract, useAccount } from 'wagmi';
import { zeroAddress } from 'viem';
import { readContract } from 'viem/actions';

vi.mock('wagmi', () => ({
	useWriteContract: vi.fn(),
	useReadContract: vi.fn(),
	useAccount: vi.fn()
}));

const mockWriteContractAsync = vi.fn();
const mockUseReadContract = vi.fn();

(useWriteContract as unknown as Mock).mockReturnValue({
	writeContractAsync: mockWriteContractAsync
});

(useAccount as unknown as Mock).mockReturnValue({
	address: zeroAddress
});

vi.mock('viem/actions', () => ({
	readContract: vi.fn()
}));

(readContract as unknown as Mock).mockResolvedValue(BigInt('0'));

(useReadContract as unknown as Mock).mockReturnValue(BigInt('0'));

(useReadContract as unknown as Mock).mockReturnValue(BigInt('1000000000000000000000000000000'));

const mockVault = {
	token: { address: zeroAddress, decimals: 18, symbol: 'TKN' },
	vaultId: '1',
	orderbook: { id: zeroAddress }
};

describe('DepositModal', () => {
	it('disables the submit button when there is an error (wrong network)', async () => {
		render(
			<DepositModal
				vault={mockVault}
				networkStatus={{ wrongNetwork: true, targetNetworkName: 'Ethereum' }}
			/>
		);

		await userEvent.click(screen.getByText(/deposit/i));

		const submitButton = screen.getByRole('button', { name: /submit/i });
		expect(submitButton).toBeDisabled();
	});

	it('enables the submit button and calls deposit function when there is no error', async () => {
		render(
			<DepositModal
				vault={mockVault}
				networkStatus={{ wrongNetwork: false, targetNetworkName: 'Ethereum' }}
			/>
		);

		await userEvent.click(screen.getByText(/deposit/i));

		const amountInput = screen.getByPlaceholderText('0');
		await userEvent.type(amountInput, '0.5');

		const submitButton = screen.getByRole('button', { name: /submit/i });
		expect(submitButton).toBeEnabled();

		await userEvent.click(submitButton);

		await waitFor(() => {
			expect(readContract).toHaveBeenCalled();
		});
	});
});
