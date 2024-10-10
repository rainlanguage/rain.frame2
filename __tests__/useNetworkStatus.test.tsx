import { renderHook } from '@testing-library/react';
import useNetworkStatus from '@/app/_services/useNetworkStatus';
import { vi } from 'vitest';

vi.mock('@/app/_queries/subgraphs', () => ({
	getNetworkSubgraphs: () => [
		{ name: 'Flare', chainId: 14, subgraphUrl: 'https://example.com/flare' },
		{ name: 'Base', chainId: 8453, subgraphUrl: 'https://example.com/base' },
		{ name: 'Linea', chainId: 59144, subgraphUrl: 'https://example.com/linea' },
		{ name: 'Arbitrum', chainId: 42161, subgraphUrl: 'https://example.com/arbitrum' }
	]
}));

describe('useNetworkStatus', () => {
	it('should return the correct target network name when chain IDs match', () => {
		const { result } = renderHook(() => useNetworkStatus(8453, 8453));
		expect(result.current.wrongNetwork).toBe(false);
		expect(result.current.targetNetworkName).toBe('Base');
	});

	it('should set wrongNetwork to true when chain IDs do not match', () => {
		const { result } = renderHook(() => useNetworkStatus(14, 8453));
		expect(result.current.wrongNetwork).toBe(true);
		expect(result.current.targetNetworkName).toBe('Base');
	});

	it('should update when connectedChainId changes', () => {
		const { result, rerender } = renderHook(
			({ connectedChainId, targetChainId }) => useNetworkStatus(connectedChainId, targetChainId),
			{ initialProps: { connectedChainId: 14, targetChainId: 14 } }
		);

		expect(result.current.wrongNetwork).toBe(false);
		expect(result.current.targetNetworkName).toBe('Flare');

		rerender({ connectedChainId: 8453, targetChainId: 14 });
		expect(result.current.wrongNetwork).toBe(true);
		expect(result.current.targetNetworkName).toBe('Flare');
	});
});
