export const mockYamlData = {
	'raindex-version': '8898591f3bcaa21dc91dc3b8584330fc405eadfa',
	networks: {
		base: {
			rpc: 'https://mainnet.base.org',
			'chain-id': 8453,
			'network-id': 8453,
			currency: 'ETH'
		},
		flare: {
			rpc: 'https://rpc.ankr.com/flare',
			'chain-id': 14,
			'network-id': 14,
			currency: 'FLR'
		}
	},
	metaboards: {
		base: 'https://api.goldsky.com/api/public/project_clv14x04y9kzi01saerx7bxpg/subgraphs/mb-base-0x59401C93/0.1/gn',
		flare:
			'https://api.goldsky.com/api/public/project_clv14x04y9kzi01saerx7bxpg/subgraphs/mb-flare-0x893BBFB7/0.1/gn'
	},
	subgraphs: {
		base: 'https://api.goldsky.com/api/public/project_clv14x04y9kzi01saerx7bxpg/subgraphs/ob4-base/0.7/gn',
		flare:
			'https://api.goldsky.com/api/public/project_clv14x04y9kzi01saerx7bxpg/subgraphs/ob4-flare/0.2/gn'
	},
	orderbooks: {
		base: {
			address: '0xd2938e7c9fe3597f78832ce780feb61945c377d7',
			network: 'base',
			subgraph: 'base'
		},
		flare: {
			address: '0xCEe8Cd002F151A536394E564b84076c41bBBcD4d',
			network: 'flare',
			subgraph: 'flare'
		}
	},
	deployers: {
		base: {
			address: '0xC1A14cE2fd58A3A2f99deCb8eDd866204eE07f8D',
			network: 'base'
		},
		flare: {
			address: '0xE3989Ea7486c0F418C764e6c511e86f6E8830FAb',
			network: 'flare'
		}
	},
	tokens: {
		'base-weth': {
			network: 'base',
			address: '0x4200000000000000000000000000000000000006',
			decimals: 18
		},
		'base-usdc': {
			network: 'base',
			address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
			decimals: 6
		},
		'flare-wflr': {
			network: 'flare',
			address: '0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d',
			decimals: 18
		},
		'flare-sflr': {
			network: 'flare',
			address: '0x12e605bc104e93B45e1aD99F9e555f659051c2BB',
			decimals: 18
		},
		'flare-eusdt': {
			network: 'flare',
			address: '0x96B41289D90444B8adD57e6F265DB5aE8651DF29',
			decimals: 6
		}
	},
	orders: {
		'base-weth-usdc': {
			orderbook: 'base',
			network: 'base',
			inputs: [
				{
					token: 'base-weth'
				}
			],
			outputs: [
				{
					token: 'base-usdc'
				}
			]
		},
		'flare-wflr-eusdt': {
			orderbook: 'flare',
			network: 'flare',
			inputs: [
				{
					token: 'flare-wflr'
				}
			],
			outputs: [
				{
					token: 'flare-eusdt'
				}
			]
		},
		'flare-slfr-wflr': {
			orderbook: 'flare',
			network: 'flare',
			inputs: [
				{
					token: 'flare-sflr'
				}
			],
			outputs: [
				{
					token: 'flare-wflr'
				}
			]
		}
	},
	scenarios: {
		base: {
			orderbook: 'base',
			runs: 1,
			bindings: {
				'raindex-subparser': '0x662dFd6d5B6DF94E07A60954901D3001c24F856a'
			},
			scenarios: {
				'weth-usdc': {
					runs: 1,
					bindings: {
						'fixed-io-output-token': '0x4200000000000000000000000000000000000006'
					}
				}
			}
		},
		flare: {
			orderbook: 'flare',
			runs: 1,
			bindings: {
				'raindex-subparser': '0xFe2411CDa193D9E4e83A5c234C7Fd320101883aC'
			},
			scenarios: {
				'wflr-eusdt': {
					runs: 1,
					bindings: {
						'fixed-io-output-token': '0x1D80c49BbBCd1C0911346656B529DF9E5c2F783d'
					}
				},
				'sflr-wflr': {
					runs: 1,
					bindings: {
						'fixed-io-output-token': '0x12e605bc104e93B45e1aD99F9e555f659051c2BB'
					}
				}
			}
		}
	},
	deployments: {
		'base-weth-usdc': {
			order: 'base-weth-usdc',
			scenario: 'base.weth-usdc'
		},
		'flare-wflr-eusdt': {
			order: 'flare-wflr-eusdt',
			scenario: 'flare.wflr-eusdt'
		},
		'flare-slfr-wflr': {
			order: 'flare-slfr-wflr',
			scenario: 'flare.sflr-wflr'
		}
	},
	gui: {
		name: 'Fixed limit',
		description: 'Fixed limit order strategy\n',
		deployments: [
			{
				deployment: 'base-weth-usdc',
				name: 'Buy WETH with USDC on Base.',
				description: 'Buy WETH with USDC for fixed price on Base network.',
				deposits: [
					{
						token: 'base-usdc',
						min: 0,
						presets: [0, 10, 100, 1000, 10000]
					}
				],
				fields: [
					{
						binding: 'fixed-io',
						name: 'WETH price in USDC ($ per ETH)',
						min: 1000
					}
				]
			},
			{
				deployment: 'flare-wflr-eusdt',
				name: 'Buy WFLR with eUSDT on Flare.',
				description: 'Buy WFLR with eUSDT (Enosys USDT) for fixed price on Flare network.',
				deposits: [
					{
						token: 'flare-eusdt',
						min: 0,
						presets: [0, 10, 100, 1000, 10000]
					}
				],
				fields: [
					{
						binding: 'fixed-io',
						name: 'WFLR price in eUSDT ($ per WFLR)',
						min: 0
					}
				]
			},
			{
				deployment: 'flare-slfr-wflr',
				name: 'Buy SFLR with WFLR on Flare.',
				description: 'Buy SFLR with WFLR for fixed price on Flare network.',
				deposits: [
					{
						token: 'flare-wflr',
						min: 0,
						presets: [0, 100, 1000, 10000, 100000]
					}
				],
				fields: [
					{
						binding: 'fixed-io',
						name: 'SFLR price in WFLR (WFLR per SFLR)',
						min: 1
					}
				]
			}
		]
	}
};
