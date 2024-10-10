export const mockFixedLimit = `raindex-version: 8898591f3bcaa21dc91dc3b8584330fc405eadfa

networks:
  base:
    rpc: https://mainnet.base.org
    chain-id: 8453
    network-id: 8453
    currency: ETH

orderbooks:
  base:
    address: 0xd2938e7c9fe3597f78832ce780feb61945c377d7
    network: base
    subgraph: base


tokens:
  base-weth:
    network: base
    address: 0x4200000000000000000000000000000000000006
    decimals: 18


deployments:
  base-weth-usdc:
    order: base-weth-usdc
    scenario: base.weth-usdc


gui:
  name: Fixed limit
  description: >
    Fixed limit order strategy
  deployments:
    - deployment: base-weth-usdc
      name: Buy WETH with USDC on Base.
      description:
        Buy WETH with USDC for fixed price on Base network.
      deposits:
        - token: base-usdc
          min: 0
          presets:
            - 0
            - 10
            - 100
            - 1000
            - 10000

      fields:
        - binding: fixed-io
          name: WETH price in USDC ($ per ETH)
          min: 1000

---
#raindex-subparser !The subparser to use.

#fixed-io !The io ratio for the limit order.
#fixed-io-output-token !The output token that the fixed io is for. If this doesn't match the runtime output then the fixed-io will be inverted.

#calculate-io
using-words-from raindex-subparser
max-output: max-value(),
io: if(
  equal-to(
    output-token()
    fixed-io-output-token
  )
  fixed-io
  inv(fixed-io)
);

#handle-io
:;

#handle-add-order
:;`;
