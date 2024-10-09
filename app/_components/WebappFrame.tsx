'use client';

import { useEffect, useMemo, useState } from 'react';
import { generateButtonsData } from '../_services/buttonsData';
import { YamlData } from '../_types/yamlData';
import { FrameImage } from './FrameImage';
import { getUpdatedFrameState } from '../_services/frameState';
import { FrameState } from '../_types/frame';
import yaml from 'js-yaml';
import { ProgressBar } from './ProgressBar';

import { FailsafeSchemaWithNumbers } from '../_schemas/failsafeWithNumbers';
import { SubmissionModal } from './SubmissionModal';
import { useSearchParams, useRouter } from 'next/navigation';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { TriangleAlert } from 'lucide-react';
import { TokenInfo, getTokenInfos } from '../_services/getTokenInfo';
import { Button, Spinner } from 'flowbite-react';
import ShareStateAsUrl from './ShareStateAsUrl';
import { decompress } from '../_services/compress';

interface props {
	dotrainText: string;
	deploymentOption: string | null;
}

const getDefaultState = (yamlData: YamlData, deploymentOption: string | null): FrameState => {
	const deployment =
		yamlData.gui.deployments.find((deployment) => deployment.deployment === deploymentOption) ||
		undefined;

	return {
		strategyName: yamlData.gui.name,
		strategyDescription: yamlData.gui.description,
		currentStep: deploymentOption ? 'fields' : 'start',
		deploymentOption: deployment,
		bindings: {},
		deposits: [],
		buttonPage: 0,
		buttonMax: 10,
		textInputLabel: '',
		error: null,
		isWebapp: true,
		tokenInfos: [] as TokenInfo[],
		buttonsData: [],
		previousCustomInputValue: ''
	};
};

const WebappFrame = ({ dotrainText, deploymentOption }: props) => {
	const yamlData = yaml.load(dotrainText.split('---')[0], {
		schema: FailsafeSchemaWithNumbers
	}) as YamlData;

	const [currentState, setCurrentState] = useState<FrameState>(() =>
		getDefaultState(yamlData, deploymentOption)
	);

	const [loading, setLoading] = useState({
		fetchingTokens: false,
		decodingState: true
	});

	const [error, setError] = useState<string | React.ReactElement | null>(null);
	const [inputText, setInputText] = useState<string>('');

	const searchParams = useSearchParams();
	const router = useRouter();

	const buttonsData = useMemo(() => {
		return generateButtonsData(yamlData, currentState);
	}, [
		currentState.bindings,
		currentState.deposits,
		currentState.currentStep,
		currentState.textInputLabel
	]);

	const getUrlState = async () => {
		const encodedState = searchParams.get('currentState');
		if (encodedState) {
			try {
				const decompressedState = await decompress(encodedState);
				return JSON.parse(decompressedState);
			} catch (e: any) {
				if (e.message.includes('not correctly encoded')) {
					try {
						const params = new URLSearchParams(encodedState);
						const state: any = {};

						params.forEach((value, key) => {
							try {
								state[key] = JSON.parse(decodeURIComponent(value));
							} catch {
								state[key] = decodeURIComponent(value);
							}
						});

						return {
							...state,
							requiresTokenApproval: false,
							isWebapp: true
						};
					} catch (decodeError) {
						console.error('Failed to parse URL state:', decodeError);
					}
				}
			}
		}
		return null;
	};

	useEffect(() => {
		const lastBindingValue = Object.values(currentState.bindings).slice(-1)[0] || '';
		const lastDepositValue = currentState.deposits.slice(-1)[0]?.amount || '';
		setCurrentState((prevState) => ({
			...prevState,
			previousCustomInputValue: String(lastDepositValue || lastBindingValue || '')
		}));

		const updateUrlWithState = async () => {
			try {
				const { bindings, deposits, currentStep } = currentState;

				const stateToSerialize = {
					bindings,
					deposits,
					currentStep,
					isWebapp: true
				};

				const serializedState = Object.entries(stateToSerialize)
					.map(
						([key, value]) =>
							`${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`
					)
					.join('&');
				const url = new URL(window.location.href);
				url.searchParams.set('currentState', serializedState);
				router.replace(url.toString(), undefined);
			} catch (e) {
				console.error('Failed to update URL with state:', e);
			}
		};
		updateUrlWithState();
	}, [
		JSON.stringify(currentState.bindings),
		JSON.stringify(currentState.deposits),
		JSON.stringify(currentState.currentStep),
		JSON.stringify(currentState.textInputLabel)
	]); // Run only when bindings, deposits or currentStep change

	useEffect(() => {
		const initializeState = async () => {
			try {
				const urlState = await getUrlState();
				if (urlState) setCurrentState((prev) => ({ ...prev, ...urlState }));
			} catch (e) {
				console.error('Error decoding state:', e);
			} finally {
				setLoading((prev) => ({ ...prev, decodingState: false }));
			}
		};
		initializeState();
	}, [searchParams]); // Run only when searchParams change

	useEffect(() => {
		const fetchTokenInfos = async () => {
			if (currentState.tokenInfos.length === 0 && !loading.fetchingTokens) {
				try {
					setLoading((prev) => ({ ...prev, fetchingTokens: true }));
					const tokenInfos = await getTokenInfos(yamlData);

					setCurrentState((prevState) => ({
						...prevState,
						tokenInfos
					}));
				} catch (e) {
					console.error(e);
					setError('Failed to fetch token information');
				} finally {
					setLoading((prev) => ({ ...prev, fetchingTokens: false }));
				}
			}
		};

		if (!loading.decodingState) {
			fetchTokenInfos();
		}
	}, [yamlData, currentState.tokenInfos.length, loading.decodingState]); // Dependent on decodingState to ensure token fetch happens after decoding

	const handleButtonClick = async (buttonData: any) => {
		setError(null);
		// Handle page navigation
		if (buttonData.buttonTarget === 'textInputLabel') {
			setCurrentState((prevState) => ({
				...prevState,
				textInputLabel: buttonData.buttonValue
			}));
			return;
		} else if (buttonData.buttonTarget === 'buttonPage') {
			setCurrentState((prevState) => ({
				...prevState,
				buttonPage: buttonData.buttonValue,
				textInputLabel: ''
			}));
			return;
		} else if (buttonData.buttonTarget === 'buttonValue' && buttonData.buttonValue === 'back') {
			setInputText(currentState.previousCustomInputValue || '');
			setCurrentState((prevState) => ({
				...prevState,
				textInputLabel: ''
			}));
		}

		const updatedState = getUpdatedFrameState(
			yamlData,
			currentState,
			buttonData.buttonValue,
			inputText
		);

		setCurrentState({ ...updatedState });

		if (inputText) {
			setInputText('');
		}
	};

	useEffect(() => {
		const filteredButtons = buttonsData.filter(
			(buttonData) => buttonData.buttonValue !== 'back' && buttonData.buttonValue !== 'finalSubmit'
		);
		if (filteredButtons.length === 1 && filteredButtons[0].buttonText === 'Custom') {
			setCurrentState((prevState) => ({
				...prevState,
				textInputLabel: filteredButtons[0].buttonValue
			}));
		}
	}, [JSON.stringify(buttonsData)]);

	return loading.decodingState || loading.fetchingTokens ? (
		<div className="flex-grow flex items-center justify-center">
			<Spinner />
		</div>
	) : (
		<div className="flex-grow flex-col flex w-full pb-safe">
			<div className="w-full top-0">
				<ProgressBar currentState={currentState} />
			</div>
			<FrameImage currentState={currentState} />
			{currentState.textInputLabel && (
				<div className="flex justify-center mb-4">
					<input
						data-testid="input"
						className="border-gray-200 rounded-lg border p-2 w-full max-w-96"
						type="number"
						placeholder={currentState.textInputLabel}
						value={inputText}
						onChange={(e) => setInputText(e.target.value)}
					/>
					<br />
				</div>
			)}
			<div className="flex flex-wrap gap-2 justify-center md:pb-20 pb-8 px-8 pt-10">
				{buttonsData.map((buttonData) => {
					return buttonData.buttonValue === 'finalSubmit' ? (
						<div key={buttonData} className="flex gap-2 flex-wrap justify-center">
							<SubmissionModal
								key={buttonData.buttonText}
								buttonText={buttonData.buttonText}
								yamlData={yamlData}
								currentState={currentState}
								dotrainText={dotrainText}
								setError={setError}
							/>
							<ShareStateAsUrl currentState={currentState} />
						</div>
					) : (
						<Button
							color="primary"
							size="sm"
							key={buttonData.buttonText}
							onClick={async () => {
								await handleButtonClick(buttonData);
							}}>
							{buttonData.buttonText}
						</Button>
					);
				})}
				<div className="flex w-full justify-center">
					{currentState.error ? (
						<div style={{ display: 'flex', justifyContent: 'center' }}>
							<span className="text-red-600">{currentState.error}</span>
						</div>
					) : (
						''
					)}
				</div>
			</div>
			<Dialog open={!!error}>
				<DialogContent className="bg-white flex flex-col items-center">
					<TriangleAlert color="red" />
					<div className="w-full text-center">{error}</div>
					<DialogClose asChild>
						<button
							className="bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-xl transition-colors"
							onClick={() => setError(null)}>
							Close
						</button>
					</DialogClose>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default WebappFrame;
