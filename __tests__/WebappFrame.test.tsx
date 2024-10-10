import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import WebappFrame from '@/app/_components/WebappFrame';
import { Mock, vi } from 'vitest';
import { generateButtonsData } from '@/app/_services/buttonsData';
import { mockFixedLimit } from '@/__mocks__/fixed-limit';
import userEvent from '@testing-library/user-event';

const mockTokenInfos = [
	{
		yamlName: 'base-weth',
		address: '0x4200000000000000000000000000000000000006',
		decimals: 18,
		symbol: 'WETH',
		name: 'Wrapped Ether'
	},
	{
		yamlName: 'base-usdc',
		address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
		decimals: 6,
		symbol: 'USDC',
		name: 'USD Coin'
	},
	{
		yamlName: 'flare-wflr',
		address: '0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d',
		decimals: 18,
		symbol: 'WFLR',
		name: 'Wrapped Flare'
	},
	{
		yamlName: 'flare-sflr',
		address: '0x12e605bc104e93B45e1aD99F9e555f659051c2BB',
		decimals: 18,
		symbol: 'sFLR',
		name: 'Staked FLR'
	},
	{
		yamlName: 'flare-eusdt',
		address: '0x96B41289D90444B8adD57e6F265DB5aE8651DF29',
		decimals: 6,
		symbol: 'eUSDT',
		name: 'Enosys USDT'
	}
];

vi.mock('@/app/_services/buttonsData', () => ({
	generateButtonsData: vi.fn()
}));

vi.mock('../_services/getTokenInfo', () => ({
	getTokenInfos: vi.fn().mockResolvedValue(mockTokenInfos)
}));

describe('WebappFrame Component', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.clearAllMocks();
	});

	it('shows input field when only one "Custom" button is present', async () => {
		(generateButtonsData as Mock).mockReturnValue([
			{ buttonValue: 'customValue', buttonText: 'Custom' }
		]);
		render(<WebappFrame dotrainText={mockFixedLimit} deploymentOption="" />);
		await waitFor(() => {
			expect(screen.getByTestId('input')).toBeInTheDocument();
		});
	});
	it('shows preset buttons when there are multiple choices', async () => {
		(generateButtonsData as Mock).mockReturnValue([
			{
				buttonTarget: 'buttonValue',
				buttonValue: 'back',
				buttonText: '←'
			},
			{
				buttonTarget: 'buttonValue',
				buttonValue: '0',
				buttonText: '0 USDC'
			},
			{
				buttonTarget: 'buttonValue',
				buttonValue: '10',
				buttonText: '10 USDC'
			},
			{
				buttonTarget: 'textInputLabel',
				buttonValue: 'Enter a number greater than 0',
				buttonText: 'Custom'
			}
		]);

		render(<WebappFrame dotrainText={mockFixedLimit} deploymentOption="" />);

		await waitFor(() => {
			expect(screen.getByText('←')).toBeInTheDocument();
			expect(screen.getByText('0 USDC')).toBeInTheDocument();
			expect(screen.getByText('10 USDC')).toBeInTheDocument();
		});

		const customButton = await waitFor(() => screen.getByText('Custom'));
		await userEvent.click(customButton);

		await waitFor(() => {
			expect(screen.getByTestId('input')).toBeInTheDocument();
		});
	});
});
