import { formatUnits } from 'viem';
import { WithdrawalModal } from './WithdrawalModal';
import { DepositModal } from './DepositModal';
import { Network } from '../_queries/subgraphs';
import { useAccount } from 'wagmi';
import useNetworkStatus from '../_services/useNetworkStatus';

export function TokenAndBalance({
	input,
	withdraw,
	deposit,
	network
}: {
	input: any;
	withdraw?: boolean;
	deposit?: boolean;
	network: Network;
}) {
	const account = useAccount();
	const networkStatus = useNetworkStatus(account.chainId, network.chainId);
	return (
		<div className="flex border rounded-xl p-2 gap-x-3 items-center justify-between">
			<div className="flex flex-col gap-y-1">
				<div>{withdraw ? input.token.name : input.token.symbol}</div>
				<div className="text-gray-500">
					Strategy Balance:{' '}
					{Number(Number(formatUnits(input.balance, input.token.decimals)).toFixed(8))}
				</div>
			</div>
			<div className="flex gap-2">
				{deposit && <DepositModal vault={input} networkStatus={networkStatus} />}
				{withdraw && <WithdrawalModal vault={input} networkStatus={networkStatus} />}
			</div>
		</div>
	);
}
