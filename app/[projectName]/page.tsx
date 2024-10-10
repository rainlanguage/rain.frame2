import { retrieveProjectData } from '../_services/buildProjectHome';
import { StrategyCard } from '../_components/StrategyCard';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface homeProps {
	params: {
		projectName: string;
	};
}

export default async function ProjectHome({ params }: homeProps) {
	const projectData = await retrieveProjectData(params.projectName);

	return (
		<div className="flex flex-col lg:grid grid-cols-4 xl:grid-cols-5 flex-grow w-full">
			<div className="col-span-2 prose p-8 h-full">
				<Markdown rehypePlugins={[rehypeRaw]}>{projectData.webappMDText}</Markdown>
			</div>
			<div className="flex flex-col gap-y-4 col-span-2 xl:col-span-3 justify-start bg-gray-50 p-8 border-lg border-gray-100">
				{projectData.yamlDatas.map((data, i: number) => (
					<StrategyCard data={data} key={i} />
				))}
			</div>
		</div>
	);
}
