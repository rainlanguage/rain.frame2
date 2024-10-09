import { TokenDeposit } from '../_components/SubmissionModal';
import { TokenInfo } from '../_services/getTokenInfo';
import { YamlData } from './yamlData';

export type FrameState = {
	strategyName: string | null;
	strategyDescription: string | null;
	currentStep: string;
	deploymentOption?: YamlData['gui']['deployments'][0];
	bindings: any;
	deposits: TokenDeposit[];
	buttonPage: number;
	buttonMax?: number;
	textInputLabel: string;
	error: string | null;
	isWebapp?: boolean;
	tokenInfos: TokenInfo[];
	inputText?: string;
	buttonsData: any[];
	previousCustomInputValue: string;
};
