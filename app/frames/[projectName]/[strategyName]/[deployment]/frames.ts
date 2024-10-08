import { YamlData } from '@/app/_types/yamlData';
import { farcasterHubContext } from 'frames.js/middleware';
import { createFrames, types } from 'frames.js/next';
import { FrameState } from 'frames.js/next/types';
import path from 'path';
import yaml from 'js-yaml';
import fs from 'fs';
import { FailsafeSchemaWithNumbers } from '@/app/_schemas/failsafeWithNumbers';

const dotrainContext: types.FramesMiddleware<
	{ url: { pathname: string } },
	{ dotrainText: string; yamlData: YamlData }
> = async (ctx, next) => {
	const projectName = ctx.url.pathname.split('/')[2];
	const strategyName = ctx.url.pathname.split('/')[3];

	const allDirs = fs.readdirSync(path.join(process.cwd(), 'public', '_strategies', projectName));

	const strategyDir = allDirs.find((dir) => dir.endsWith(strategyName));

	if (!strategyDir) {
		throw new Error(`No directory found for strategy: ${strategyName} in project: ${projectName}`);
	}

	const filePath = path.join(
		process.cwd(),
		'public',
		'_strategies',
		projectName,
		strategyDir,
		`${strategyName}.rain`
	);
	const dotrainText = fs.readFileSync(filePath, 'utf8');
	const yamlData = yaml.load(dotrainText.split('---')[0], {
		schema: FailsafeSchemaWithNumbers
	}) as YamlData;

	return next({ dotrainText, yamlData });
};

export const frames = createFrames<FrameState>({
	basePath: '',
	middleware: [
		farcasterHubContext({
			// remove if you aren't using @frames.js/debugger or you just don't want to use the debugger hub
			...(process.env.NODE_ENV === 'production'
				? {}
				: {
						hubHttpUrl: 'http://localhost:3010/hub'
					})
		}),
		dotrainContext
	],
	initialState: {
		strategyName: null,
		strategyDescription: null,
		currentStep: 'start',
		deploymentOption: null,
		bindings: {},
		deposits: [],
		buttonPage: 0,
		textInputLabel: '',
		error: null,
		requiresTokenApproval: true,
		tokensApproved: false,
		tokenInfos: []
	}
});
