import { useState, useEffect } from 'react';
import { colors } from '../config/colors';
import { supabase, type Badge, type Test, type Attempt } from '../config/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { mintNFTViaBackend } from '../utils/backendApi';
import { getContractExplorerUrl, CONTRACT_IDS } from '../utils/sorobanSimple';

interface BadgeWithTest extends Badge {
  test?: Test;
}

interface PracticeAttempt extends Attempt {
  test?: Test;
}

interface BadgesTabProps {
  walletAddress: string;
  onViewTest: (testId: string) => void;
  onSwitchTab?: (tab: string) => void;
}

interface GroupedBadges {
  company: string;
  badges: BadgeWithTest[];
  practiceAttempts: PracticeAttempt[];
}

const BadgesTab = ({ walletAddress, onViewTest, onSwitchTab }: BadgesTabProps) => {
  const [groupedBadges, setGroupedBadges] = useState<GroupedBadges[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filterByCompany, setFilterByCompany] = useState<Record<string, 'all' | 'active' | 'practice'>>({});
  const [mintingBadgeId, setMintingBadgeId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserBadgesAndAttempts();
  }, [walletAddress]);

  const fetchUserBadgesAndAttempts = async () => {
    try {
      setLoading(true);

      // Fetch badges
      const { data: badgesData, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('created_at', { ascending: false });

      if (badgesError) throw badgesError;

      // Fetch ALL attempts (both passed and failed) - we'll determine which are practice later
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('attempts')
        .select('*')
        .eq('candidate_wallet', walletAddress)
        .order('created_at', { ascending: false });

      if (attemptsError) throw attemptsError;

      console.log('=== DEBUG: Fetching Badges and Attempts ===');
      console.log('Wallet Address:', walletAddress);
      console.log('All attempts fetched:', attemptsData?.length);
      console.log('Attempts data:', attemptsData);
      console.log('Badges data:', badgesData?.length);
      console.log('Badges:', badgesData);
      
      // Log detailed badge information
      badgesData?.forEach((badge, index) => {
        console.log(`Badge ${index + 1}:`, {
          id: badge.id,
          test_id: badge.test_id,
          nft_token_id: badge.nft_token_id,
          mint_tx_hash: badge.mint_tx_hash,
          metadata_url: badge.metadata_url,
          created_at: badge.created_at,
          has_nft: !!badge.nft_token_id
        });
      });

      // Get unique test IDs from both badges and attempts
      const badgeTestIds = badgesData?.map(b => b.test_id) || [];
      const attemptTestIds = attemptsData?.map(a => a.test_id) || [];
      const allTestIds = [...new Set([...badgeTestIds, ...attemptTestIds])];

      if (allTestIds.length > 0) {
        // Fetch all test data
        const { data: testsData, error: testsError } = await supabase
          .from('tests')
          .select('*')
          .in('id', allTestIds);

        if (testsError) throw testsError;

        // Map badges with test data
        const badgesWithTests: BadgeWithTest[] = (badgesData || []).map(badge => ({
          ...badge,
          test: testsData?.find(t => t.id === badge.test_id)
        }));

        // Show ALL attempts (including those that earned badges)
        const practiceAttemptsWithTests: PracticeAttempt[] = (attemptsData || [])
          .map(attempt => ({
            ...attempt,
            test: testsData?.find(t => t.id === attempt.test_id)
          }));

        console.log('Total attempts:', attemptsData?.length);
        console.log('All attempts shown:', practiceAttemptsWithTests.length);
        console.log('Attempts details:', practiceAttemptsWithTests);
        console.log('Badges:', badgesWithTests.length);

        // Group by company
        const grouped = new Map<string, GroupedBadges>();

        // Add badges to groups
        badgesWithTests.forEach(badge => {
          const company = badge.test?.company || 'Independent';
          if (!grouped.has(company)) {
            grouped.set(company, {
              company,
              badges: [],
              practiceAttempts: []
            });
          }
          grouped.get(company)!.badges.push(badge);
        });

        // Add practice attempts to groups
        practiceAttemptsWithTests.forEach(attempt => {
          const company = attempt.test?.company || 'Independent';
          if (!grouped.has(company)) {
            grouped.set(company, {
              company,
              badges: [],
              practiceAttempts: []
            });
          }
          grouped.get(company)!.practiceAttempts.push(attempt);
        });

        // Convert to array and sort by company name
        const groupedArray = Array.from(grouped.values()).sort((a, b) => 
          a.company.localeCompare(b.company)
        );

        console.log('=== FINAL GROUPED DATA ===');
        console.log('Grouped by company:', groupedArray);
        groupedArray.forEach(group => {
          console.log(`Company: ${group.company}`);
          console.log(`  - Badges: ${group.badges.length}`);
          console.log(`  - Practice Attempts: ${group.practiceAttempts.length}`);
        });

        setGroupedBadges(groupedArray);
      } else {
        setGroupedBadges([]);
      }
    } catch (err: any) {
      console.error('Error fetching badges:', err);
      setError(err.message || 'Failed to load badges');
      setGroupedBadges([]);
    } finally {
      setLoading(false);
    }
  };

  const retryMintNFT = async (badge: BadgeWithTest) => {
    try {
      setMintingBadgeId(badge.id);
      console.log('🔄 Retrying NFT mint for badge via backend:', badge.id);

      // Mint the NFT via backend (backend handles metadata generation and upload)
      const mintResult = await mintNFTViaBackend(
        walletAddress,
        badge.test_id,
        badge.test?.title || 'Achievement Badge',
        0, // Score not available here, use 0 or fetch from attempts
        0
      );

      console.log('✅ Badge NFT minted:', mintResult);

      // Update badge record with blockchain data
      const { error: updateError } = await supabase
        .from('badges')
        .update({
          nft_token_id: mintResult.data.tokenId,
          mint_tx_hash: mintResult.data.txHash,
          metadata_url: mintResult.data.metadataUrl,
        })
        .eq('id', badge.id);

      if (updateError) throw updateError;

      console.log(`🎉 Badge successfully minted! Token ID: ${mintResult.data.tokenId}`);
      
      // Refresh badges to show the updated data
      await fetchUserBadgesAndAttempts();
      
      alert(`NFT Badge minted successfully! Token ID: ${mintResult.data.tokenId}`);
    } catch (err: any) {
      console.error('❌ Retry mint failed:', err);
      alert(`Failed to mint NFT: ${err.message || 'Unknown error'}`);
    } finally {
      setMintingBadgeId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading badges...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="p-4 border-l-4"
        style={{
          backgroundColor: colors.pinkLight,
          borderColor: colors.red,
          color: colors.red,
          borderRadius: '6px'
        }}
      >
        {error}
      </div>
    );
  }

  if (groupedBadges.length === 0) {
    return (
      <Card style={{ backgroundColor: colors.blueLight, borderColor: colors.blue }} className="border-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <CardHeader>
          <CardTitle style={{ color: colors.blue }}>No Badges or Completed Tests Yet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/70 mb-4 text-sm">
            You haven't earned any badges or completed any tests yet. Take tests to earn your first badge!
          </p>
          <Button 
            onClick={() => onSwitchTab?.('earn')}
            style={{ backgroundColor: colors.greenLight, borderColor: colors.green, color: colors.green }}
          >
            Start earning badges
          </Button>
        </CardContent>
      </Card>
    );
  }

  const totalBadges = groupedBadges.reduce((sum, group) => sum + group.badges.length, 0);
  const totalPractice = groupedBadges.reduce((sum, group) => sum + group.practiceAttempts.length, 0);

  return (
    <div className="space-y-4">
      <Card
        className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        style={{ backgroundColor: colors.purpleLight }}
      >
        <CardHeader>
          <CardTitle style={{ color: colors.purple }}>
            Your Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div
              className="p-3 text-center border-2 border-black rounded-base"
              style={{ backgroundColor: colors.white }}
            >
              <p className="text-2xl font-bold mb-1" style={{ color: colors.purple }}>
                {totalBadges}
              </p>
              <p className="text-xs text-gray-600">Earned Badges</p>
            </div>
            <div
              className="p-3 text-center border-2 border-black rounded-base"
              style={{ backgroundColor: colors.white }}
            >
              <p className="text-2xl font-bold mb-1" style={{ color: colors.purple }}>
                {totalPractice}
              </p>
              <p className="text-xs text-gray-600">Practice Tests</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grouped by Company */}
      {groupedBadges.map((group) => {
        const filter = filterByCompany[group.company] || 'all';
        const filteredBadges = filter === 'practice' ? [] : group.badges;
        const filteredPractice = filter === 'active' ? [] : group.practiceAttempts;
        
        return (
          <Card
            key={group.company}
            className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150"
            style={{ backgroundColor: colors.yellowLight }}
          >
            {/* Company Header */}
            <CardHeader
              className="flex-row items-center justify-between"
              style={{
                backgroundColor: colors.yellow,
                color: colors.white,
              }}
            >
              <div>
                <h3 className="text-lg font-bold text-white">
                  {group.company}
                </h3>
                <p className="text-xs text-white opacity-90">
                  {group.badges.length} badge{group.badges.length !== 1 ? 's' : ''} earned
                  {group.practiceAttempts.length > 0 && ` • ${group.practiceAttempts.length} practice test${group.practiceAttempts.length !== 1 ? 's' : ''} passed`}
                </p>
              </div>
              
              {/* Filter Dropdown */}
              <select
                value={filter}
                onChange={(e) => setFilterByCompany({
                  ...filterByCompany,
                  [group.company]: e.target.value as 'all' | 'active' | 'practice'
                })}
                className="px-3 py-2 font-bold cursor-pointer border-2 border-black rounded-base shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-150"
                style={{
                  backgroundColor: 'white',
                  color: colors.yellow
                }}
              >
                <option value="all">All Tests</option>
                <option value="active">Active Only</option>
                <option value="practice">Practice Only</option>
              </select>
            </CardHeader>

            {/* Badges Grid - Horizontal Scroll */}
            <div className="flex gap-4 p-4 overflow-x-auto">
              {/* Earned Badges */}
              {filteredBadges.map((badge) => (
              <Card
                key={badge.id}
                className="flex-shrink-0 w-64 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-150"
                style={{ backgroundColor: colors.cyanLight }}
              >
                <CardHeader
                  className="flex items-center justify-center h-24"
                  style={{ backgroundColor: colors.cyan }}
                >
                  {badge.test?.custom_badge ? (
                    <div className="flex items-center gap-2 text-white">
                      <img 
                        src={badge.test.custom_badge.svg_url} 
                        alt={badge.test.custom_badge.badge_name || 'Badge'} 
                        className="w-12 h-12 object-cover rounded-base border-2 border-white"
                      />
                      <div className="text-left">
                        <div className="text-sm font-bold">{badge.test.custom_badge.badge_name || 'NFT BADGE'}</div>
                        <p className="font-semibold text-xs">Certified Achievement</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-white text-center">
                      <div className="text-2xl font-bold mb-0.5">NFT BADGE</div>
                      <p className="font-semibold text-xs">Certified Achievement</p>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="p-3 space-y-2">
                  <h4 className="font-bold text-base" style={{ color: colors.cyan }}>
                    {badge.test?.title || 'Test Badge'}
                  </h4>

                  <div
                    className="p-1.5 border-2 border-black rounded-base"
                    style={{ backgroundColor: colors.white }}
                  >
                    <p className="text-xs text-gray-600">Earned On</p>
                    <p className="font-mono text-xs font-bold" style={{ color: colors.cyan }}>
                      {new Date(badge.created_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  {badge.nft_token_id ? (
                    <div
                      className="p-1.5 border-2 border-black rounded-base"
                      style={{ backgroundColor: colors.white }}
                    >
                      <p className="text-xs text-gray-600">NFT Token ID</p>
                      <p className="font-mono text-xs break-all font-bold" style={{ color: colors.cyan }}>
                        {badge.nft_token_id}
                      </p>
                    </div>
                  ) : (
                    <div
                      className="p-1.5 border-2 border-black rounded-base"
                      style={{ backgroundColor: colors.redLight }}
                    >
                      <p className="text-xs text-gray-600">NFT Status</p>
                      <p className="text-xs font-bold" style={{ color: colors.red }}>
                        ❌ Minting Failed
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Click below to retry
                      </p>
                      <Button
                        onClick={() => retryMintNFT(badge)}
                        disabled={mintingBadgeId === badge.id}
                        className="w-full mt-2 text-xs py-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        style={{ backgroundColor: colors.yellow, color: 'black' }}
                      >
                        {mintingBadgeId === badge.id ? '⏳ Minting...' : '🔄 Retry Mint NFT'}
                      </Button>
                    </div>
                  )}

                  {badge.mint_tx_hash && (
                    <Button
                      className="w-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[-2px_-2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] transition-all duration-150"
                      style={{ backgroundColor: colors.cyan, color: 'white' }}
                      onClick={() => {
                        window.open(`https://stellar.expert/explorer/testnet/tx/${badge.mint_tx_hash}`, '_blank');
                      }}
                    >
                      View on Explorer
                    </Button>
                  )}

                  {badge.nft_token_id && CONTRACT_IDS.BADGE_NFT && (
                    <Button
                      className="w-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[-2px_-2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] transition-all duration-150"
                      style={{ backgroundColor: colors.green, color: 'white' }}
                      onClick={() => {
                        window.open(getContractExplorerUrl(CONTRACT_IDS.BADGE_NFT!), '_blank');
                      }}
                    >
                      📜 View NFT Contract
                    </Button>
                  )}

                  {badge.metadata_url && (
                    <Button
                      variant="reverse"
                      className="w-full"
                      onClick={() => {
                        window.open(badge.metadata_url!, '_blank');
                      }}
                    >
                      View Metadata
                    </Button>
                  )}

                  {badge.test_id && (
                    <Button
                      className="w-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[-2px_-2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] transition-all duration-150"
                      style={{ backgroundColor: colors.purple, color: 'white' }}
                      onClick={() => onViewTest(badge.test_id)}
                    >
                      View Test in Earn Tab
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Practice Attempts */}
            {filteredPractice.map((attempt) => (
              <Card
                key={attempt.id}
                className="flex-shrink-0 w-64 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-150"
                style={{ backgroundColor: colors.pinkLight }}
              >
                <CardHeader
                  className="flex items-center justify-center h-24"
                  style={{ backgroundColor: colors.pink }}
                >
                  <div className="text-white text-center">
                    <div className="text-2xl font-bold mb-0.5">PRACTICE</div>
                    <p className="font-semibold text-xs">Test Completed</p>
                  </div>
                </CardHeader>

                <CardContent className="p-3 space-y-2">
                  <h4 className="font-bold text-base" style={{ color: colors.pink }}>
                    {attempt.test?.title || 'Practice Test'}
                  </h4>

                  <div
                    className="p-1.5 border-2 border-black rounded-base"
                    style={{ backgroundColor: colors.white }}
                  >
                    <p className="text-xs text-gray-600">Completed On</p>
                    <p className="font-mono text-xs font-bold" style={{ color: colors.pink }}>
                      {new Date(attempt.created_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  <div
                    className="p-1.5 border-2 border-black rounded-base"
                    style={{ backgroundColor: colors.white }}
                  >
                    <p className="text-xs text-gray-600">Score</p>
                    <p className="font-mono text-xs font-bold" style={{ color: colors.pink }}>
                      {attempt.percentage}%
                    </p>
                  </div>

                  <div
                    className="p-2 border-2 border-black rounded-base"
                    style={{ backgroundColor: colors.white }}
                  >
                    <p className="text-xs text-gray-700">
                      <strong>Practice Mode:</strong> No NFT badge awarded for practice attempts.
                    </p>
                  </div>

                  {attempt.test_id && (
                    <Button
                      className="w-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-[-2px_-2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] transition-all duration-150"
                      style={{ backgroundColor: colors.pink, color: 'white' }}
                      onClick={() => onViewTest(attempt.test_id)}
                    >
                      Retake Test
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </Card>
      );
      })}
    </div>
  );
};

export default BadgesTab;
