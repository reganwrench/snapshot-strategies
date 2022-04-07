import { BigNumberish } from '@ethersproject/bignumber';
import { formatUnits } from '@ethersproject/units';
import { Multicaller } from '../../utils';
import { strategy as erc20BalanceOf } from '../erc20-balance-of';
export const author = 'regan';
export const version = '0.1.1';

const abi = [
  'function balanceOf(address account) external view returns (uint256)'
];

const iApeTokenAddress = '';

async function getScores(provider, addresses, options, blockTag) {
  return erc20BalanceOf(
    'ironBank',
    '1',
    provider,
    addresses,
    {
      address: iApeTokenAddress,
      decimals: 18
    },
    blockTag
  );
}

export async function strategy(
  space,
  network,
  provider,
  addresses,
  options,
  snapshot
) {
  const blockTag = typeof snapshot === 'number' ? snapshot : 'latest';
  const iTokenBalanceScores = await Promise.all([getScores(provider, addresses, options, blockTag)]);

  const multi = new Multicaller(network, provider, abi, { blockTag });
  multi.call('totalSupply', iApeTokenAddress, 'totalSupply');
  multi.call('totalCash', iApeTokenAddress, 'getCash');
  const {totalSupply,totalCash} = await multi.execute();
  
  const totalScore = {};
  addresses.forEach((address) => {
    const userScore = iTokenBalanceScores
      .map((score) => score[address])
      .reduce((accumulator, score) => (accumulator += score), 0);
    totalScore[address] = userScore / totalSupply * totalCash;
  });
  return Object.fromEntries(
    Array(addresses.length)
      .fill('')
      .map((_, i) => {
        const score = totalScore[addresses[i]];
        return [addresses[i], score];
      })
  );



  




}
