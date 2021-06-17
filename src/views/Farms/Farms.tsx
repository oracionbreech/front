import React, { useEffect, useCallback, useState, useRef } from 'react'
import { Route, useRouteMatch, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import BigNumber from 'bignumber.js'
import { useWeb3React } from '@web3-react/core'
import { Image, Heading, RowType, Toggle, Text, HelpIcon, Link } from '@pancakeswap-libs/uikit'
import styled from 'styled-components'
import { BLOCKS_PER_YEAR, CAKE_PER_BLOCK, CAKE_POOL_PID } from 'config'
import FlexLayout from 'components/layout/Flex'
import Page from 'components/layout/Page'
import { useFarms, usePriceBnbBusd, usePriceCakeBusd, usePriceEthBusd } from 'state/hooks'
import useRefresh from 'hooks/useRefresh'
import { fetchFarmUserDataAsync } from 'state/actions'
import { QuoteToken } from 'config/constants/types'
import useI18n from 'hooks/useI18n'
import { getBalanceNumber } from 'utils/formatBalance'
import { orderBy } from 'lodash'
import Faq from 'react-faq-component'

import useTheme from 'hooks/useTheme'
import FarmCard, { FarmWithStakedValue } from './components/FarmCard/FarmCard'
import Table from './components/FarmTable/FarmTable'
import FarmTabButtons from './components/FarmTabButtons'
import SearchInput from './components/SearchInput'
import { RowProps } from './components/FarmTable/Row'
import ToggleView from './components/ToggleView/ToggleView'
import { DesktopColumnSchema, ViewMode } from './components/types'
import Select, { OptionProps } from './components/Select/Select'
import useApePrice from '../../hooks/useApePrice'

const ControlContainer = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  position: relative;

  justify-content: space-between;
  flex-direction: column;

  ${({ theme }) => theme.mediaQueries.sm} {
    flex-direction: row;
    flex-wrap: wrap;
    padding: 16px 32px;
  }
`

const AddressLink = styled(Link)`
  display: inline-block;
  font-weight: 400;
  font-size: 12px;
  white-space: nowrap;

  ${({ theme }) => theme.mediaQueries.sm} {
    font-size: 16px;
    width: auto;
  }
`

const ToggleWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-left: 10px;

  ${Text} {
    margin-left: 8px;
  }
`

const LabelWrapper = styled.div`
  > ${Text} {
    font-size: 12px;
  }
`

const FilterContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 0px;

  ${({ theme }) => theme.mediaQueries.sm} {
    width: auto;
    padding: 0;
  }
`

const ViewControls = styled.div`
  flex-wrap: wrap;
  justify-content: space-between;
  display: flex;
  align-items: center;
  width: 100%;

  > div {
    padding: 8px 0px;
  }

  ${({ theme }) => theme.mediaQueries.sm} {
    justify-content: flex-start;
    width: auto;

    > div {
      padding: 0;
    }
  }
`

const StyledImage = styled(Image)`
  margin-left: auto;
  margin-right: auto;
  margin-top: 58px;
`

const Header = styled.div`
  padding: 32px 0px;
  background: ${({ theme }) => theme.colors.gradients.bubblegum};

  padding-left: 16px;
  padding-right: 16px;

  ${({ theme }) => theme.mediaQueries.sm} {
    padding-left: 24px;
    padding-right: 24px;
  }
`

const data = {
  title: 'FAQ (How it works)',
  rows: [
    // {
    //   title: `What means APE LP ribbon on farms ?`,
    //   content: `These farms use liquidities from the ApeSwap DEX. To provide LP to these farms, you need to use ApeSwap DEX interface by following <a href="https://swape.tapswap.finance/#/swap?inputCurrency=0xe9e7cea3dedca5984780bafc599bd69add087d56&outputCurrency=0x56eab07247e3e6404ac90140F20bba61375d5C3C" target="_blank" style="color: orange;font-weight: bold">this link</a>. Read more about the TapSwap & ApeSwap partnership in this <a href="https://tapswapmoneydex.medium.com/partnership-with-apeswap-finance-c1dd2dd44eee" target="_blank" style="color: orange;font-weight: bold">blog post</a>.`,
    // },
    {
      title: 'What means PCS LP ribbon on farms ?',
      content: `These farms use liquidities from the <strong>P</strong>an<strong>C</strong>ake<strong>S</strong>wap DEX. TapSwap keep these farms available to be fair with users who paid deposit fees to enter into. To provide LP to these farms, you need to use PanCakeSwap DEX interface by following <a href="https://swape.tapswap.finance/#/swap?inputCurrency=0xe9e7cea3dedca5984780bafc599bd69add087d56&outputCurrency=0x56eab07247e3e6404ac90140F20bba61375d5C3C" target="_blank" style="color: orange;font-weight: bold">this link</a>. All futures farms created on TapSwap will use APE LP. Read more about the TapSwap & ApeSwap partnership in this <a href="https://tapswapmoneydex.medium.com/partnership-with-apeswap-finance-c1dd2dd44eee" target="_blank" style="color: orange;font-weight: bold">blog post</a>.`,
    },
    {
      title: 'What means OLD ribbon on farms ?',
      content: `These legacy farms use liquidities from the <strong>P</strong>an<strong>C</strong>ake<strong>S</strong>wap DEX. They are still active and keep rewarding users inside but the new APE LP farms have better APRs and we invite all your users to move to these farms. Here is a step by step guide to help users moving there liquidities. (<a href="https://tapswapmoneydex.medium.com/step-by-step-guide-to-move-lp-from-pancakeswap-to-apeswap-c28cff9105ac" target="_blank" style="color: orange;font-weight: bold">https://medium.com/@tapswapfinance/step-by-step-guide-to-move-lp-from-pancakeswap-to-apeswap-c28cff9105ac</a>) Read more about the TapSwap & ApeSwap partnership in this <a href="https://tapswapmoneydex.medium.com/partnership-with-apeswap-finance-c1dd2dd44eee" target="_blank" style="color: orange;font-weight: bold">blog post</a>.`,
    },
    {
      title: 'What will happens to my liquidities if I stay in OLD farms ?',
      content: `Your liquidities will always be available for withdrawal. Your funds are SAFU. When all liquidities (or a large amount of at least 80%) will be moved from Pancakeswap to ApeSwap, the actual 2 farms using Pancakeswap will be deactivated. You will always be able to find these farms into the inactive tab and withdraw your funds. When these farms will be deactivated, no more $TAPS rewards will be distributed (APR = 0%). Read more about the TapSwap & ApeSwap partnership in this <a href="https://tapswapmoneydex.medium.com/partnership-with-apeswap-finance-c1dd2dd44eee" target="_blank" style="color: orange;font-weight: bold">blog post</a>.`,
    },
    // {
    //   title: 'What are the risks of using ApeSawp LP vs PanCakeSwap LP ?',
    //   content: `<strong>Contract risks</strong> : Apeswap use copies of PanCakeSwap contracts and is audited : <a href="https://github.com/ApeSwapFinance/apeswap-banana-farm/blob/master/audits/ApeSwap_GEMZ_Audit_Report_21.03.05.pdf" target="_blank" style="color: orange;font-weight: bold">https://github.com/ApeSwapFinance/apeswap-banana-farm/blob/master/audits/ApeSwap_GEMZ_Audit_Report_21.03.05.pdf</a> <br><br><strong>Liquidities risks</strong> : Same as using PanCakeSwap pairs : TapSwap is a young project and our liquidities are still low and volatility is still high. But having liquidities in another place don’t change this “risk”.`,
    // },
  ],
}

const styles = {
  bgColor: ({ theme }) => (theme.isDark ? '#36343c' : '#fbfbfb'),
  titleTextColor: '#4e4e4e',
  rowTitleColor: '#4e4e4e',
  rowContentColor: '#6b6b6b',
}
export interface FarmsProps {
  tokenMode?: boolean
}

const Farms: React.FC<FarmsProps> = (farmsProps) => {
  const { path } = useRouteMatch()
  const { pathname } = useLocation()
  const TranslateString = useI18n()
  const farmsLP = useFarms()
  const cakePrice = usePriceCakeBusd()
  const bnbPrice = usePriceBnbBusd()
  const [query, setQuery] = useState('')
  const [viewMode, setViewMode] = useState(ViewMode.CARD) // ViewMode.CARD / TABLE
  const ethPriceUsd = usePriceEthBusd()
  const { account } = useWeb3React()
  const [sortOption, setSortOption] = useState('hot')
  const { tokenMode } = farmsProps
  const [apePrice, setApePrice] = useState(0)
  const apeReserve = useApePrice()
  apeReserve.then(setApePrice)

  const { isDark } = useTheme()

  const dispatch = useDispatch()
  const { fastRefresh } = useRefresh()
  useEffect(() => {
    if (account) {
      dispatch(fetchFarmUserDataAsync(account))
    }
  }, [account, dispatch, fastRefresh])

  const [stackedOnly, setStackedOnly] = useState(false)

  const activeFarms = farmsLP.filter((farm) => !!farm.isTokenOnly === !!tokenMode && farm.multiplier !== '0X')
  const inactiveFarms = farmsLP.filter((farm) => !!farm.isTokenOnly === !!tokenMode && farm.multiplier === '0X')

  const tableRef = useRef(null)

  const stackedOnlyFarms = activeFarms.filter(
    (farm) => farm.userData && new BigNumber(farm.userData.stakedBalance).isGreaterThan(0),
  )

  const sortFarms = (farms: FarmWithStakedValue[]): FarmWithStakedValue[] => {
    switch (sortOption) {
      case 'apr':
        return orderBy(farms, 'apy', 'desc')
      case 'multiplier':
        return orderBy(farms, (farm: FarmWithStakedValue) => Number(farm.multiplier.slice(0, -1)), 'desc')
      case 'earned':
        return orderBy(farms, (farm: FarmWithStakedValue) => (farm.userData ? farm.userData.earnings : 0), 'desc')
      case 'liquidity':
        return orderBy(farms, (farm: FarmWithStakedValue) => Number(farm.liquidity), 'desc')
      default:
        return farms
    }
  }

  // /!\ This function will be removed soon
  // This function compute the APY for each farm and will be replaced when we have a reliable API
  // to retrieve assets prices against USD
  const farmsList = useCallback(
    (farmsToDisplay): FarmWithStakedValue[] => {
      let farmsToDisplayWithAPY: FarmWithStakedValue[] = farmsToDisplay.map((farm) => {
        const cakeRewardPerBlock = new BigNumber(farm.tapsPerBlock || 1)
          .times(new BigNumber(farm.poolWeight))
          .div(new BigNumber(10).pow(18))
        const cakeRewardPerYear = cakeRewardPerBlock.times(BLOCKS_PER_YEAR)

        // cakePriceInQuote * cakeRewardPerYear / lpTotalInQuoteToken
        let apy = cakePrice.times(cakeRewardPerYear)

        let totalValue = new BigNumber(farm.lpTotalInQuoteToken || 0)

        if (farm.quoteTokenSymbol === QuoteToken.BNB) {
          totalValue = totalValue.times(bnbPrice)
        }
        if (farm.quoteTokenSymbol === QuoteToken.BANANA) {
          totalValue = totalValue.times(apePrice)
        }

        if (totalValue.comparedTo(0) > 0) {
          apy = apy.div(totalValue)
        }

        let liquidity = farm.lpTotalInQuoteToken

        if (!farm.lpTotalInQuoteToken) {
          liquidity = null
        }
        if (farm.quoteTokenSymbol === QuoteToken.BNB) {
          liquidity = bnbPrice.times(farm.lpTotalInQuoteToken)
        }
        if (farm.quoteTokenSymbol === QuoteToken.CAKE) {
          liquidity = cakePrice.times(farm.lpTotalInQuoteToken)
        }

        // console.table({
        //   'tapsPerBlock': farm.tapsPerBlock,
        //   'quoteTokenSymbol': farm.quoteTokenSymbol,
        //   'pid': farm.pid,
        //   'lpSymbol': farm.lpSymbol,
        //   'lpAddresses': farm.lpAddresses,
        //   'tokenSymbol': farm.tokenSymbol,
        //   'tokenAddresses': farm.tokenAddresses,
        //   'quoteTokenAdresses': farm.quoteTokenAdresses,
        //   'multiplier': farm.multiplier,
        //   'lpTotalInQuoteToken': farm.lpTotalInQuoteToken,
        //   'cakeRewardPerBlock': cakeRewardPerBlock.toJSON(),
        //   'totalValue': totalValue.toJSON(),
        //   'apy': apy.times(new BigNumber(100)).toNumber().toLocaleString('en-US').slice(0, -1),
        //   'liquidity': new BigNumber(liquidity).toJSON()
        // })

        return { ...farm, apy, liquidity }
      })

      if (query) {
        const lowercaseQuery = query.toLowerCase()
        farmsToDisplayWithAPY = farmsToDisplayWithAPY.filter((farm: FarmWithStakedValue) => {
          if (farm.lpSymbol.toLowerCase().includes(lowercaseQuery)) {
            return true
          }

          return false
        })
      }
      return farmsToDisplayWithAPY
    },
    [bnbPrice, query, cakePrice, apePrice],
  )

  const handleChangeQuery = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value)
  }

  const isActive = !pathname.includes('history')
  let farmsStaked = []
  if (isActive) {
    farmsStaked = stackedOnly ? farmsList(stackedOnlyFarms) : farmsList(activeFarms)
  } else {
    farmsStaked = farmsList(inactiveFarms)
  }

  farmsStaked = sortFarms(farmsStaked)

  const rowData = farmsStaked.map((farm) => {
    const { quoteTokenAdresses, quoteTokenSymbol, tokenAddresses } = farm
    const lpLabel = farm.lpSymbol && farm.lpSymbol.toUpperCase().replace('PANCAKE', '')

    const row: RowProps = {
      apr: {
        value: farm.apy
          ? farm.apy && farm.apy.times(new BigNumber(100)).toNumber().toLocaleString('en-US').slice(0, -1)
          : null,
        multiplier: farm.multiplier,
        lpLabel,
        quoteTokenAdresses,
        quoteTokenSymbol,
        tokenAddresses,
        cakePrice,
        originalValue: farm.apy,
        farm,
      },
      farm: {
        image: farm.lpSymbol.split(' ')[0].toLocaleLowerCase(),
        label: lpLabel,
        pid: farm.pid,
      },
      earned: {
        earnings: farm.userData ? getBalanceNumber(new BigNumber(farm.userData.earnings)) : null,
        pid: farm.pid,
      },
      liquidity: {
        liquidity: farm.liquidity,
      },
      fee: {
        fee: farm.depositFeeBP,
      },
      multiplier: {
        multiplier: farm.multiplier,
      },
      details: farm,
    }

    return row
  })

  const renderContent = (): JSX.Element => {
    if (viewMode === ViewMode.TABLE && rowData.length) {
      const columnSchema = DesktopColumnSchema

      const columns = columnSchema.map((column) => ({
        id: column.id,
        name: column.name,
        label: column.normal,
        sort: (a: RowType<RowProps>, b: RowType<RowProps>) => {
          switch (column.name) {
            case 'farm':
              return b.id - a.id
            case 'apr':
              if (a.original.apr.value && b.original.apr.value) {
                return Number(a.original.apr.value) - Number(b.original.apr.value)
              }

              return 0
            case 'earned':
              return a.original.earned.earnings - b.original.earned.earnings
            default:
              return 1
          }
        },
        sortable: column.sortable,
      }))

      return <Table data={rowData} ref={tableRef} columns={columns} />
    }

    return (
      <div>
        <FlexLayout>
          <Route exact path={`${path}`}>
            {farmsStaked.map((farm) => (
              <FarmCard
                key={farm.pid}
                farm={farm}
                bnbPrice={bnbPrice}
                cakePrice={cakePrice}
                ethPrice={ethPriceUsd}
                account={account}
                removed={false}
              />
            ))}
          </Route>
          <Route exact path={`${path}/history`}>
            {farmsStaked.map((farm) => (
              <FarmCard
                key={farm.pid}
                farm={farm}
                bnbPrice={bnbPrice}
                cakePrice={cakePrice}
                ethPrice={ethPriceUsd}
                account={account}
                removed
              />
            ))}
          </Route>
        </FlexLayout>
      </div>
    )
  }

  const handleSortOptionChange = (option: OptionProps): void => {
    setSortOption(option.value)
  }

  return (
    <>
      <Header>
        <Heading
          as="h1"
          size="xxl"
          color="secondary"
          mb="24px"
          textAlign="center"
          style={{
            fontWeight: 'lighter',
            letterSpacing: '1.5px',
            textShadow: isDark ? 'aqua 0 0 5px' : '#d2004c 0 0 6px',
          }}
        >
          {tokenMode
            ? TranslateString(10002, 'Stake tokens to earn TAPS')
            : TranslateString(320, 'Stake LP tokens to earn $TAPS')}
        </Heading>
        <Heading size="lg" color="text" textAlign="center">
          {TranslateString(10000, 'Maximize Yield by Farming')}
        </Heading>
        {/* <Text>
          <AddressLink
            href="https://doc.tapswap.finance/tokennomics/burn-mechanism-and-fee-farming"
            color="text"
            external
          >
            <HelpIcon color="textSubtle" />{' '}
            {TranslateString(10006, 'Learn more about our Burn mechanism and fee farming')}
          </AddressLink>
        </Text> */}
      </Header>
      <Page>
        <ControlContainer>
          <ViewControls>
            <ToggleView viewMode={viewMode} onToggle={(mode: ViewMode) => setViewMode(mode)} />
            <ToggleWrapper>
              <Toggle checked={stackedOnly} onChange={() => setStackedOnly(!stackedOnly)} scale="sm" />
              <Text> {TranslateString(1116, 'Staked only')}</Text>
            </ToggleWrapper>
            <FarmTabButtons />
          </ViewControls>
          <FilterContainer>
            <LabelWrapper>
              <Text>SORT BY</Text>
              <Select
                options={[
                  // {
                  //   label: 'Hot',
                  //   value: 'hot',
                  // },
                  {
                    label: 'APR',
                    value: 'apr',
                  },
                  {
                    label: 'Multiplier',
                    value: 'multiplier',
                  },
                  {
                    label: 'Earned',
                    value: 'earned',
                  },
                  {
                    label: 'Liquidity',
                    value: 'liquidity',
                  },
                  {
                    label: 'Fees',
                    value: 'fees',
                  },
                ]}
                onChange={handleSortOptionChange}
              />
            </LabelWrapper>
            <LabelWrapper style={{ marginLeft: 16 }}>
              <Text>SEARCH</Text>
              <SearchInput onChange={handleChangeQuery} value={query} />
            </LabelWrapper>
          </FilterContainer>
        </ControlContainer>
        {renderContent()}
        {/* <Image
          src="https://cdn.discordapp.com/attachments/847731075640066048/851708900708712478/New.png"
          alt="illustration"
          width={1920}
          height={1080}
          responsive
        /> */}
      </Page>
      <img
        src={
          isDark
            ? `https://cdn.discordapp.com/attachments/847731075640066048/852086584102617098/Space.png`
            : `https://cdn.discordapp.com/attachments/847731075640066048/851737644463554580/Oasis.png`
        }
        alt=""
        style={{
          position: 'absolute',
          width: '100vw',
        }}
      />
    </>
  )
}

export default Farms
