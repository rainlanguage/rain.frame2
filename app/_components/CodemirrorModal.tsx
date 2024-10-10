import React, { SetStateAction, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/dialog';
import { YamlData } from '../_types/yamlData';
import { FrameState } from '../_types/frame';
import { Button } from 'flowbite-react';
import { DotrainOrder } from '@rainlanguage/orderbook/common';
import CodeMirror from '@uiw/react-codemirror';
import { DialogClose, DialogTrigger } from '@radix-ui/react-dialog';
import { RainlangLR } from 'codemirror-rainlang';
import scroll from '@uiw/react-codemirror/';

interface CodemirrorModalProps {
	yamlData: YamlData;
	currentState: FrameState;
	dotrainText: string;
	setError: React.Dispatch<SetStateAction<string | React.ReactElement | null>>;
}

export const CodemirrorModal = ({
	yamlData,
	currentState,
	dotrainText,
	setError
}: CodemirrorModalProps) => {
	const [composedDotrainText, setComposedDotrainText] = useState<string>('');

	const getComposedDotrainText = async () => {
		const dotrainOrder = await DotrainOrder.create(dotrainText);
		setComposedDotrainText(
			await dotrainOrder.composeDeploymentToRainlang(
				currentState.deploymentOption?.deployment || ''
			)
		);
	};
	getComposedDotrainText();

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					color="primary"
					size="sm"
					className=" from-blue-600 to-violet-600 bg-gradient-to-br"
				>
					Show Rainlang
				</Button>
			</DialogTrigger>
			<DialogContent className="bg-white flex flex-col justify-center w-full font-light gap-y-8">
				<DialogHeader>Generated Rainlang</DialogHeader>
				<CodeMirror height="50vh" value={composedDotrainText} extensions={[RainlangLR]} />
				<DialogFooter className="sm:justify-start">
					<DialogClose asChild>
						<Button type="button">Close</Button>
					</DialogClose>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
