import { useState, useEffect } from 'react';
import { getNetworkSubgraphs } from '../_queries/subgraphs';

const compatibleNetworks = getNetworkSubgraphs();

const useNetworkStatus = (connectedChainId?: number, targetChainId?: number) => {
	const [wrongNetwork, setWrongNetwork] = useState(false);
	const [targetNetworkName, setTargetNetworkName] = useState<string | undefined>(undefined);

	useEffect(() => {
		if (connectedChainId !== targetChainId) {
			setWrongNetwork(true);
		} else {
			setWrongNetwork(false);
		}
		setTargetNetworkName(compatibleNetworks.find((net) => net.chainId === targetChainId)?.name);
	}, [connectedChainId, targetChainId]);

	return { wrongNetwork, targetNetworkName };
};

export default useNetworkStatus;
