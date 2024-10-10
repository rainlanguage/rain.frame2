'use client';

import { useEffect, useState } from 'react';
import { generateButtonsData } from '../_services/buttonsData';
import { YamlData } from '../_types/yamlData';
import { FrameImage } from './FrameImage';
import { getUpdatedFrameState } from '../_services/frameState';
import { FrameState } from '../_types/frame';
import yaml from 'js-yaml';
import { ProgressBar } from './ProgressBar';
import { FailsafeSchemaWithNumbers } from '../_schemas/failsafeWithNumbers';
import { SubmissionModal } from './SubmissionModal';
import { useSearchParams } from 'next/navigation';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog';
import { TriangleAlert } from 'lucide-react';
import { TokenInfo, getTokenInfos } from '../_services/getTokenInfo';
import { Button, Spinner } from 'flowbite-react';
import ShareStateAsUrl from './ShareStateAsUrl';
import { decompress } from '../_services/compress';
import { Button as ButtonType } from '../types';

interface props {
	dotrainText: string;
	deploymentOption: string | null;
}

const WebappFrame = ({ dotrainText, deploymentOption }: props) => {
	const yamlData = yaml.load(dotrainText.split('---')[0], {
		schema: FailsafeSchemaWithNumbers
	}) as YamlData;

	const defaultState: FrameState = {
		strategyName: yamlData.gui.name,
		strategyDescription: yamlData.gui.description,
		currentStep: deploymentOption ? 'fields' : 'start',
		deploymentOption:
			yamlData.gui.deployments.find((deployment) => deployment.deployment === deploymentOption) ||
			undefined,
		bindings: {},
		deposits: [],
		buttonPage: 0,
		buttonMax: 10,
		textInputLabel: (() => {
			const deployment =
				yamlData.gui.deployments.find((deployment) => deployment.deployment === deploymentOption) ||
				undefined;
			if (!deployment) {
				return '';
			}
			const fields = deployment.fields;
			const currentField = fields[0];
			if (currentField.min !== undefined && !currentField.presets) {
				return `Enter a number greater than ${currentField.min}`;
			}
			return '';
		})(),
		error: null,
		isWebapp: true,
		tokenInfos: [] as TokenInfo[]
	};

	const [currentState, setCurrentState] = useState<FrameState>(defaultState);

	const [loading, setLoading] = useState({
		fetchingTokens: false,
		decodingState: true
	});

	const [error, setError] = useState<string | React.ReactElement | null>(null);
	const [inputText, setInputText] = useState<string>('');

	const searchParams = useSearchParams();

	const getUrlState = async () => {
		const encodedState = searchParams.get('currentState');
		if (encodedState) {
			try {
				const decompressedState = await decompress(encodedState);

				return {
					...JSON.parse(decompressedState),
					requiresTokenApproval: false,
					isWebapp: true
				};
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch (e: any) {
				// If decompression fails, try decoding the state without decompression
				if (e.message.includes('not correctly encoded')) {
					const decodedState = decodeURI(encodedState);
					return {
						...JSON.parse(decodedState),
						requiresTokenApproval: false,
						isWebapp: true
					};
				}
			}
		}
		return null;
	};

	useEffect(() => {
		const initializeState = async () => {
			try {
				const urlState = await getUrlState();
				if (urlState) setCurrentState((prev) => ({ ...prev, ...urlState }));
			} catch {
				throw new Error('Error decoding state:');
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
				} catch {
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

	const handleButtonClick = async (buttonData: ButtonType) => {
		setError(null);

		if (buttonData.buttonTarget === 'textInputLabel') {
			setCurrentState((prevState) => ({
				...prevState,
				textInputLabel: buttonData.toString()
			}));
			return;
		} else if (buttonData.buttonTarget === 'buttonPage') {
			setCurrentState((prevState) => ({
				...prevState,
				buttonPage: Number(buttonData)
			}));
			return;
		} else if (buttonData.buttonTarget === 'buttonValue' && buttonData.buttonValue === 'back') {
			setCurrentState((prevState) => ({
				...prevState,
				textInputLabel: ''
			}));
		}

		const updatedState = getUpdatedFrameState(
			yamlData,
			currentState,
			buttonData.buttonValue.toString(),
			inputText
		);

		setCurrentState({ ...updatedState });

		if (inputText) {
			setInputText('');
		}
	};

	const buttonsData = generateButtonsData(yamlData, currentState);

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
	}, [buttonsData]);

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
				{buttonsData.map((buttonData, i: number) => {
					return buttonData.buttonValue === 'finalSubmit' ? (
						<div key={i} className="flex gap-2 flex-wrap justify-center">
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
