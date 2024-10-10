import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodemirrorModal } from '@/app/_components/CodemirrorModal';
import { vi } from 'vitest';

vi.mock('@rainlanguage/orderbook/common', () => ({
	DotrainOrder: {
		create: vi.fn().mockResolvedValue({
			composeDeploymentToRainlang: vi.fn().mockResolvedValue('Mocked Rainlang Output')
		})
	}
}));

const mockYamlData = {} as any;
const mockCurrentState = { deploymentOption: { deployment: 'base-weth-usdc' } } as any;
const mockDotrainText = 'Sample dotrain text';
const mockSetError = vi.fn();

describe('CodemirrorModal', () => {
	it('composes and displays Rainlang text correctly', async () => {
		render(
			<CodemirrorModal
				yamlData={mockYamlData}
				currentState={mockCurrentState}
				dotrainText={mockDotrainText}
				setError={mockSetError}
			/>
		);

		await userEvent.click(screen.getByText(/show rainlang/i));

		await waitFor(() => {
			expect(screen.getByText('Mocked Rainlang Output')).toBeInTheDocument();
		});
	});

	it('closes the modal when close button is clicked', async () => {
		render(
			<CodemirrorModal
				yamlData={mockYamlData}
				currentState={mockCurrentState}
				dotrainText={mockDotrainText}
				setError={mockSetError}
			/>
		);

		await userEvent.click(screen.getByText(/show rainlang/i));
		expect(screen.getByText(/generated rainlang/i)).toBeInTheDocument();

		await userEvent.click(screen.getByRole('button', { name: /close/i }));
		await waitFor(() => {
			expect(screen.queryByText(/generated rainlang/i)).not.toBeInTheDocument();
		});
	});
});
