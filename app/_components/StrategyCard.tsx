import Markdown from 'react-markdown';
import { StrategyFile } from '../_services/buildProjectHome';
import { DeploymentCard } from './DeploymentCard';
import rehypeRaw from 'rehype-raw';

export const StrategyCard = ({ data }: { data: StrategyFile }) => {
	return (
		<div className="flex flex-col gap-y-8 mb-8">
			<div className="font-bold text-3xl">{data.yamlData.gui.name}</div>
			<div className="prose text-gray-500">
				<Markdown rehypePlugins={[rehypeRaw]}>{data.descriptionMD}</Markdown>
			</div>
			<div className="flex flex-col xl:grid xl:grid-cols-2 2xl:grid-cols-3 gap-4">
				{data.yamlData.gui.deployments.map((deployment, i: number) => (
					<DeploymentCard key={i} deployment={deployment} slug={data.fileName} />
				))}
			</div>
		</div>
	);
};
