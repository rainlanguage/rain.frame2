export type Network = {
	name: string;
	chainId: number;
	subgraphUrl: string;
};

export const getNetworkSubgraphs = (): Network[] => {
	return [
		{
			name: 'Flare',
			chainId: 14,
			subgraphUrl:
				'https://api.goldsky.com/api/public/project_clv14x04y9kzi01saerx7bxpg/subgraphs/ob4-flare/0.2/gn'
		},
		{
			name: 'Base',
			chainId: 8453,
			subgraphUrl:
				'https://api.goldsky.com/api/public/project_clv14x04y9kzi01saerx7bxpg/subgraphs/ob4-base/0.7/gn'
		},
		{
			name: 'Linea',
			chainId: 59144,
			subgraphUrl:
				'https://api.goldsky.com/api/public/project_clv14x04y9kzi01saerx7bxpg/subgraphs/ob4-linea/0.1/gn'
		},
		{
			name: 'Arbitrum',
			chainId: 42161,
			subgraphUrl:
				'https://api.goldsky.com/api/public/project_clv14x04y9kzi01saerx7bxpg/subgraphs/ob4-arbitrum/0.1/gn'
		}
	];
};
