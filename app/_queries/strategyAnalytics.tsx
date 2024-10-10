import { getNetworkSubgraphs } from './subgraphs';

export const transactionAnalytics = (transactionId: string) => `
{
  addOrders (sortBy: transaction__timestamp, where: {transaction: "${transactionId}"}) {
    transaction {
      id
      timestamp
    }
    id
    order {
      active
      owner
      orderHash
      orderBytes
      orderbook {
        id
      }
      inputs {
        orderbook {
          id
        }
        vaultId
        token {
          name
          decimals
          address
          symbol
        }
        balance
      }
      outputs {
        orderbook {
          id
        }
        vaultId
        token {
          name
          decimals
          address
          symbol
        }
        balance
      }
      trades {
        tradeEvent {
          sender
          transaction {
            id
            timestamp
          }
        }
        inputVaultBalanceChange {
          amount
          vault {
            token {
              name
              symbol
              decimals
            }
          }
        }
        outputVaultBalanceChange {
          amount
          vault {
            token {
              name
              symbol
              decimals
            }
          }
        }
      }
    }
  }
}`;

export const getTransactionAnalyticsData = async (transactionId: string, network: string) => {
	const subgraphUrl =
		getNetworkSubgraphs()[network as keyof ReturnType<typeof getNetworkSubgraphs>];
	if (subgraphUrl) {
		try {
			const response = await fetch(subgraphUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					query: transactionAnalytics(transactionId)
				})
			});
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
			const result = await response.json();
			if (result.errors) {
				throw new Error(result.errors[0].message);
			} else if (result.data?.addOrders.length) {
				return {
					...result.data.addOrders[0],
					order: { ...result.data.addOrders[0].order, network, subgraphUrl }
				};
			}
			return {
				...result.data.addOrders[0],
				order: { ...result.data.addOrders[0].order, network, subgraphUrl }
			};
		} catch (error: unknown) {
			if (error instanceof Error) {
				throw new Error(
					`Error fetching transaction data from ${network} subgraph: ${error.message || ''}`
				);
			} else throw new Error('Unknown error fetching transaction data from subgraph');
		}
	} else {
		throw new Error(`Found no subgraph for ${network} network`);
	}
};
