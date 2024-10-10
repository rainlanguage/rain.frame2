import StrategyAnalytics from '@/app/_components/StrategyAnalytics';

interface props {
	params: {
		transactionId: string;
	};
}

const Home = ({ params: { transactionId } }: props) => {
	const [id, network] = transactionId.split('-');
	return <StrategyAnalytics transactionId={id} network={network} />;
};

export default Home;
