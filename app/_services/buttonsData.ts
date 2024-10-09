import { FrameState } from '../_types/frame';
import { DeploymentOption, Deposit, Preset, YamlData, Field } from '../_types/yamlData';
import { TokenInfo } from './getTokenInfo';

export const getPaginatedButtons = (
	allButtons: any[],
	buttonPage: number,
	buttonMax = 4
): any[] => {
	const buttonPageOffset = buttonPage * 3;
	let buttonEndIndex = buttonPageOffset + buttonMax;
	const includeMoreButton = buttonEndIndex < allButtons.length;
	if (includeMoreButton) {
		buttonEndIndex--;
	}
	return [
		...(allButtons.length <= 3
			? allButtons
			: [
					...(buttonPage > 0
						? [
								{
									buttonTarget: 'buttonPage',
									buttonValue: buttonPage - 1,
									buttonText: '←'
								}
							]
						: []),
					...allButtons.slice(buttonPageOffset, buttonEndIndex),
					...(includeMoreButton
						? [
								{
									buttonTarget: 'buttonPage',
									buttonValue: buttonPage + 1,
									buttonText: 'More'
								}
							]
						: [])
				])
	];
};

export const getFieldPresetsButtons = (field: Field): any[] => {
	return [
		{
			buttonTarget: 'buttonValue',
			buttonValue: 'back',
			buttonText: '←'
		},
		...(field.presets
			? field.presets.map((preset: Preset) => ({
					buttonTarget: 'buttonValue',
					buttonValue: `${preset.value}`,
					buttonText: `${preset.name}`
				}))
			: []),
		...(field.min !== undefined
			? [
					{
						buttonTarget: 'textInputLabel',
						buttonValue: `Enter a number greater than ${field.min}`,
						buttonText: 'Custom'
					}
				]
			: [])
	];
};

export const getDepositPresetsButtons = (deposit: Deposit, token: TokenInfo): any[] => {
	if (!deposit) {
		return [];
	}
	return [
		{
			buttonTarget: 'buttonValue',
			buttonValue: 'back',
			buttonText: '←'
		},
		...(deposit.presets
			? deposit.presets.map((preset: number) => ({
					buttonTarget: 'buttonValue',
					buttonValue: `${preset}`,
					buttonText: `${preset} ${token.symbol}`
				}))
			: []),
		...(deposit.min !== undefined
			? [
					{
						buttonTarget: 'textInputLabel',
						buttonValue: `Enter a number greater than ${deposit.min}`,
						buttonText: 'Custom'
					}
				]
			: [])
	];
};

export const generateButtonsData = (yamlData: YamlData, currentState: FrameState): any[] => {
	console.log('GENERATING');
	let buttons: any[] = [];
	if (currentState.textInputLabel) {
		return [
			{
				buttonTarget: 'buttonValue',
				buttonValue: 'back',
				buttonText: '←'
			},
			{
				buttonTarget: 'buttonValue',
				buttonValue: 'submit',
				buttonText: 'Submit'
			}
		];
	}
	switch (currentState.currentStep) {
		case 'start':
			buttons = [
				{
					buttonTarget: 'buttonValue',
					buttonValue: 'start',
					buttonText: 'Start'
				}
			];
			break;
		case 'deployment': {
			const allButtons = yamlData.gui.deployments.map((deploymentOption: DeploymentOption) => ({
				buttonTarget: 'buttonValue',
				buttonValue: JSON.stringify(deploymentOption),
				buttonText: deploymentOption.name
			}));
			buttons = getPaginatedButtons(allButtons, currentState.buttonPage, currentState.buttonMax);
			break;
		}
		case 'fields': {
			if (!currentState.deploymentOption) {
				return buttons;
			}
			const field = currentState.deploymentOption.fields[Object.keys(currentState.bindings).length];
			const fieldButtons = getFieldPresetsButtons(field);
			buttons = getPaginatedButtons(fieldButtons, currentState.buttonPage, currentState.buttonMax);
			break;
		}
		case 'deposit': {
			if (!currentState.deploymentOption) {
				return buttons;
			}

			const deposit =
				currentState.deploymentOption.deposits[Object.keys(currentState.deposits).length];

			const token = currentState.tokenInfos.find((token) => token.yamlName == deposit.token);

			if (!token) throw new Error('Token from deposit not found in retrieved token infos');

			const depositButtons = getDepositPresetsButtons(deposit, token);
			buttons = getPaginatedButtons(
				depositButtons,
				currentState.buttonPage,
				currentState.buttonMax
			);
			break;
		}
		case 'review': {
			buttons = [
				{
					buttonTarget: 'buttonValue',
					buttonValue: 'back',
					buttonText: '←'
				}
			];

			const supportedNetworks = {
				Ethereum: 1,
				Arbitrum: 42161,
				Base: 8453,
				Degen: 666666666,
				Gnosis: 100,
				Optimism: 10,
				Zora: 7777777
			};
			const deployment = yamlData.deployments[currentState.deploymentOption?.deployment || ''];
			const order = yamlData.orders[deployment.order];
			const network = yamlData.networks[order.network];

			if (currentState.isWebapp || Object.values(supportedNetworks).includes(network['chain-id'])) {
				buttons.push({
					buttonTarget: 'buttonValue',
					buttonValue: 'finalSubmit',
					buttonText: 'Deposit tokens and deploy strategy'
				});
			} else {
				buttons.push({
					buttonAction: 'link',
					buttonTarget: 'currentState',
					buttonValue: encodeURIComponent(JSON.stringify(currentState)),
					buttonText: 'Deposit tokens and deploy strategy'
				});
			}
			break;
		}
		case 'done':
			buttons = [
				{
					buttonTarget: 'buttonValue',
					buttonValue: 'restart',
					buttonText: 'Start over'
				}
			];
			break;
	}

	return buttons;
};
