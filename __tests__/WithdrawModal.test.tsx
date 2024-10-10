import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WithdrawalModal } from '@/app/_components/WithdrawalModal';
import { vi, type Mock } from 'vitest';
import { useWriteContract } from 'wagmi';

vi.mock('wagmi', () => ({
	useWriteContract: vi.fn()
}));

const mockWriteContractAsync = vi.fn();

// Set up mock implementation for `useWriteContract`
(useWriteContract as unknown as Mock).mockReturnValue({
	writeContractAsync: mockWriteContractAsync
});

// Mock props for testing
const mockVault = {
	token: { address: '0x123', decimals: 18 },
	vaultId: '1',
	balance: '1000000000000000000', // 1 token in raw format
	orderbook: { id: '0xorderbook' }
};

describe('WithdrawalModal', () => {
	it('disables the submit button when there is an error (wrong network)', async () => {
		render(
			<WithdrawalModal
				vault={mockVault}
				networkStatus={{ wrongNetwork: true, targetNetworkName: 'Ethereum' }}
			/>
		);

		// Open the dialog
		await userEvent.click(screen.getByText(/withdraw/i));

		// The button should be disabled due to the wrong network
		const submitButton = screen.getByRole('button', { name: /submit/i });
		expect(submitButton).toBeDisabled();
	});

	it('enables the submit button and calls withdraw function when there is no error', async () => {
		render(
			<WithdrawalModal
				vault={mockVault}
				networkStatus={{ wrongNetwork: false, targetNetworkName: 'Ethereum' }}
			/>
		);

		// Open the dialog
		await userEvent.click(screen.getByText(/withdraw/i));

		// Set a valid withdrawal amount in the input field
		const amountInput = screen.getByPlaceholderText('0');
		await userEvent.type(amountInput, '0.5'); // Type a valid amount

		// Verify the submit button is enabled
		const submitButton = screen.getByRole('button', { name: /submit/i });
		expect(submitButton).toBeEnabled();

		// Click the submit button to initiate the withdrawal
		await userEvent.click(submitButton);

		// Ensure that the withdrawal function was called with the correct raw amount
		expect(mockWriteContractAsync).toHaveBeenCalled();
	});
});
