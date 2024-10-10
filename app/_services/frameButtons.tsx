import { Button } from 'frames.js/next';
import { FrameState } from 'frames.js/next/types';

export const getFrameButtons = (buttonsData: any[], currentState: FrameState, urlContext: any) => {
	return buttonsData.map((button, i: number) => {
		if (button.buttonAction === 'link') {
			const projectName = urlContext.pathname.split('/')[2];
			const strategyName = urlContext.pathname.split('/')[3];
			const deployment = urlContext.pathname.split('/')[4];
			return (
				<Button
					key={i}
					action="link"
					target={`${urlContext.origin}/${projectName}/${strategyName}/${deployment}/?${button.buttonTarget}=${button.buttonValue}`}
				>
					{button.buttonText}
				</Button>
			);
		} else if (button.buttonValue === 'approve' || button.buttonValue === 'submit') {
			// Update state after tokens have been approved or submission has been made
			const updatedState = {
				...(currentState as object),
				...(button.buttonValue === 'approve' ? { tokensApproved: true } : {}),
				...(button.buttonValue === 'submit' ? { currentStep: 'done' } : {})
			};
			return (
				<Button
					key={i}
					action="tx"
					target={{ query: { [button.buttonTarget]: button.buttonValue } }}
					post_url={{
						query: { currentState: encodeURI(JSON.stringify(updatedState)) }
					}}
				>
					{button.buttonText}
				</Button>
			);
		}
		return (
			<Button
				key={i}
				action="post"
				target={{ query: { [button.buttonTarget]: button.buttonValue } }}
			>
				{button.buttonText}
			</Button>
		);
	});
};
