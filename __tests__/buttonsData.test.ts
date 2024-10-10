import { describe, it, expect } from 'vitest';
import {
	getPaginatedButtons,
	getFieldPresetsButtons,
	getDepositPresetsButtons,
	generateButtonsData
} from '@/app/_services/buttonsData';
import { FrameState } from '@/app/_types/frame';
import { YamlData, Field, Deposit } from '@/app/_types/yamlData';
import { TokenInfo } from '@/app/_services/getTokenInfo';
import { mockYamlData } from '@/__mocks__/mockYamlData';
import { depositFrameState, fieldsFrameState } from '@/__mocks__/mockFrameStates';

describe('getPaginatedButtons', () => {
	it('returns the correct number of buttons with "More" button when needed', () => {
		const allButtons = Array.from({ length: 10 }, (_, i) => ({
			buttonValue: `val${i}`,
			buttonText: `Button ${i}`
		}));
		const paginatedButtons = getPaginatedButtons(allButtons, 0, 4);

		expect(paginatedButtons).toHaveLength(4);
		expect(paginatedButtons[paginatedButtons.length - 1]).toEqual({
			buttonTarget: 'buttonPage',
			buttonValue: 1,
			buttonText: 'More'
		});
	});

	it('includes "back" button when on a subsequent page', () => {
		const allButtons = Array.from({ length: 10 }, (_, i) => ({
			buttonValue: `val${i}`,
			buttonText: `Button ${i}`
		}));
		const paginatedButtons = getPaginatedButtons(allButtons, 1, 4);

		expect(paginatedButtons[0]).toEqual({
			buttonTarget: 'buttonPage',
			buttonValue: 0,
			buttonText: '←'
		});
	});
});

describe('getFieldPresetsButtons', () => {
	const mockField: Field = {
		presets: [{ name: 'Preset 1', value: 10 }, { name: 'Preset 2', value: 20 }, { value: 30 }],
		min: 5
	} as unknown as Field;

	it('returns preset buttons and "Custom" button if min is defined', () => {
		const fieldButtons = getFieldPresetsButtons(mockField);

		expect(fieldButtons).toEqual([
			{ buttonTarget: 'buttonValue', buttonValue: 'back', buttonText: '←' },
			{ buttonTarget: 'buttonValue', buttonValue: '10', buttonText: 'Preset 1' },
			{ buttonTarget: 'buttonValue', buttonValue: '20', buttonText: 'Preset 2' },
			{ buttonTarget: 'buttonValue', buttonValue: '30', buttonText: '30' },
			{
				buttonTarget: 'textInputLabel',
				buttonValue: 'Enter a number greater than 5',
				buttonText: 'Custom'
			}
		]);
	});
});

describe('getDepositPresetsButtons', () => {
	const mockDeposit: Deposit = {
		presets: [10, 20],
		min: 5,
		token: 'TK1'
	};
	const mockToken: TokenInfo = {
		yamlName: 'TK1',
		symbol: 'TK1'
	} as unknown as TokenInfo;

	it('returns deposit preset buttons with token symbol and "Custom" button if min is defined', () => {
		const depositButtons = getDepositPresetsButtons(mockDeposit, mockToken);

		expect(depositButtons).toEqual([
			{ buttonTarget: 'buttonValue', buttonValue: 'back', buttonText: '←' },
			{ buttonTarget: 'buttonValue', buttonValue: '10', buttonText: '10 TK1' },
			{ buttonTarget: 'buttonValue', buttonValue: '20', buttonText: '20 TK1' },
			{
				buttonTarget: 'textInputLabel',
				buttonValue: 'Enter a number greater than 5',
				buttonText: 'Custom'
			}
		]);
	});
});

describe('generateButtonsData', () => {
	it('returns "start" button when currentStep is "start"', () => {
		const frameState: FrameState = {
			currentStep: 'start',
			buttonPage: 0,
			buttonMax: 4
		} as FrameState;
		const buttonsData = generateButtonsData(mockYamlData as unknown as YamlData, frameState);

		expect(buttonsData).toEqual([
			{
				buttonTarget: 'buttonValue',
				buttonValue: 'start',
				buttonText: 'Start'
			}
		]);
	});

	it('returns paginated deployment buttons when currentStep is "deployment"', () => {
		const frameState: FrameState = {
			currentStep: 'deployment',
			buttonPage: 0,
			buttonMax: 2
		} as FrameState;
		const buttonsData = generateButtonsData(mockYamlData as unknown as YamlData, frameState);

		expect(buttonsData).toHaveLength(3);
		expect(buttonsData[0]).toEqual({
			buttonTarget: 'buttonValue',
			buttonValue: JSON.stringify(mockYamlData.gui.deployments[0]),
			buttonText: mockYamlData.gui.deployments[0].name
		});
	});

	it('returns field preset buttons when currentStep is "fields"', () => {
		const mockField = mockYamlData.gui.deployments[0].fields[0];

		const buttonsData = generateButtonsData(
			mockYamlData as unknown as YamlData,
			fieldsFrameState as unknown as FrameState
		);

		expect(buttonsData).toHaveLength(2);
		expect(buttonsData[1]).toEqual({
			buttonTarget: 'textInputLabel',
			buttonText: 'Custom',
			buttonValue: 'Enter a number greater than 1000'
		});
	});

	it('returns deposit preset buttons when currentStep is "deposit"', () => {
		const buttonsData = generateButtonsData(
			mockYamlData as unknown as YamlData,
			depositFrameState as unknown as FrameState
		);

		expect(buttonsData).toHaveLength(4);
		expect(buttonsData[1]).toEqual({
			buttonTarget: 'buttonValue',
			buttonValue: '0',
			buttonText: '0 USDC'
		});
	});

	it('returns "finalSubmit" button when currentStep is "review" and network is supported', () => {
		const frameState: FrameState = {
			currentStep: 'review',
			isWebapp: true,
			deploymentOption: { deployment: 'base-weth-usdc' }
		} as FrameState;
		const buttonsData = generateButtonsData(mockYamlData as unknown as YamlData, frameState);

		expect(buttonsData).toContainEqual({
			buttonTarget: 'buttonValue',
			buttonValue: 'finalSubmit',
			buttonText: 'Deposit tokens and deploy strategy'
		});
	});
});
