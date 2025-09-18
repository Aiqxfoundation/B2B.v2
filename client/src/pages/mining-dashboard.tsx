import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { 
  Activity, 
  BarChart3, 
  Cpu, 
  Hash, 
  Zap, 
  TrendingUp, 
  Target, 
  Timer, 
  Award, 
  Coins, 
  Percent,
  Settings,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Gauge,
  Lightning,
  Rocket
} from "lucide-react";

interface SupplyMetrics {
  totalMined: string;
  circulating: string;
  maxSupply: string;
  percentageMined: string;
  currentBlockReward: string;
  totalBlocks: number;
  halvingProgress: {
    current: number;
    nextHalving: number;
    blocksRemaining: number;
  };
}

export default function MiningDashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [blockTimer, setBlockTimer] = useState(3600); // 1 hour in seconds
  const [lastClaimed, setLastClaimed] = useState<Date | null>(null);
  const [currentHash, setCurrentHash] = useState<string>('');  
  const [miningActive, setMiningActive] = useState(true);
  const [blockProgress, setBlockProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('mining'); // Tab state
  const [coins, setCoins] = useState<number[]>([]);
  const [isBlockAnimating, setIsBlockAnimating] = useState(false);
  
  // Enhanced Analytics State
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
  const [selectedMiningMode, setSelectedMiningMode] = useState('balanced');
  const [performanceMetrics, setPerformanceMetrics] = useState({
    avgHashrate: 0,
    efficiency: 100,
    uptimePercentage: 98.5,
    blocksFound: 0,
    totalRewards: 0
  });

  // Mining Modes Configuration
  const miningModes = {
    eco: {
      name: 'Eco Mode',
      icon: Timer,
      efficiency: 85,
      color: 'text-chart-2',
      description: 'Power-efficient mining with lower consumption',
      hashMultiplier: 0.85,
      powerCost: 0.005
    },
    balanced: {
      name: 'Balanced',
      icon: Gauge,
      efficiency: 100,
      color: 'text-chart-1',
      description: 'Optimal balance between performance and efficiency',
      hashMultiplier: 1.0,
      powerCost: 0.008
    },
    performance: {
      name: 'High Performance',
      icon: Rocket,
      efficiency: 115,
      color: 'text-chart-4',
      description: 'Maximum hashrate for competitive mining',
      hashMultiplier: 1.15,
      powerCost: 0.012
    }
  };
  
  // Fetch supply metrics
  const { data: supplyMetrics } = useQuery<SupplyMetrics>({
    queryKey: ['/api/supply-metrics'],
    staleTime: Infinity,
    gcTime: Infinity // Cache permanently
  });

  // Calculate hours since last claim
  const getHoursSinceLastClaim = () => {
    if (!lastClaimed) return 0;
    const diff = Date.now() - lastClaimed.getTime();
    return Math.floor(diff / (1000 * 60 * 60));
  };

  const hoursSinceLastClaim = getHoursSinceLastClaim();
  const showClaimWarning = hoursSinceLastClaim > 18;
  const isInactive = hoursSinceLastClaim >= 24;
  
  // Enhanced Mining Calculations with Modes
  const baseHashrate = parseFloat(user?.hashPower || '0');
  const currentMode = miningModes[selectedMiningMode];
  const myHashrate = baseHashrate * currentMode.hashMultiplier;
  const baseGlobalHashrate = 584732.50; // Base global hashrate in GH/s
  const networkGrowthRate = 1.0012; // 0.12% hourly growth to simulate network expansion
  const currentHour = new Date().getHours();
  const globalHashrate = Math.round(baseGlobalHashrate * Math.pow(networkGrowthRate, currentHour) * 100) / 100;

  // Memoized reward calculations for performance
  const rewardCalculations = useMemo(() => {
    const currentBlockReward = 50; // GBTC per block
    const myMiningShare = myHashrate > 0 ? Math.round((myHashrate / globalHashrate) * 100 * 1000000) / 1000000 : 0; // Percentage with 6 decimals precision
    const myEstimatedReward = Math.round((myHashrate / globalHashrate) * currentBlockReward * 100000000) / 100000000; // GBTC per block with 8 decimals
    const dailyEstimatedRewards = Math.round(myEstimatedReward * 24 * 10000) / 10000; // 24 blocks per day with 4 decimals
    const unclaimedGBTC = parseFloat(user?.unclaimedBalance || '0');
    const isNewUser = myHashrate === 0;
    
    return {
      currentBlockReward,
      myMiningShare,
      myEstimatedReward,
      dailyEstimatedRewards,
      unclaimedGBTC,
      isNewUser
    };
  }, [myHashrate, globalHashrate, user?.unclaimedBalance]);
  
  // Destructure for backward compatibility
  const { currentBlockReward, myMiningShare, myEstimatedReward, dailyEstimatedRewards, unclaimedGBTC, isNewUser } = rewardCalculations;

  // Memoized advanced analytics calculations
  const analyticsCalculations = useMemo(() => {
    const effectiveHashrate = myHashrate * (currentMode.efficiency / 100);
    const powerCostPerHour = myHashrate * currentMode.powerCost;
    const dailyPowerCost = powerCostPerHour * 24;
    const profitabilityRatio = dailyEstimatedRewards > 0 ? dailyPowerCost / dailyEstimatedRewards : 0;
    
    return {
      effectiveHashrate,
      powerCostPerHour,
      dailyPowerCost,
      profitabilityRatio
    };
  }, [myHashrate, currentMode.efficiency, currentMode.powerCost, dailyEstimatedRewards]);
  
  // Destructure for backward compatibility
  const { effectiveHashrate, powerCostPerHour, dailyPowerCost, profitabilityRatio } = analyticsCalculations;

  // Update performance metrics
  useEffect(() => {
    setPerformanceMetrics(prev => ({
      ...prev,
      avgHashrate: myHashrate,
      efficiency: currentMode.efficiency,
      blocksFound: coins.length,
      totalRewards: parseFloat(user?.gbtcBalance || '0')
    }));
  }, [myHashrate, currentMode.efficiency, coins.length, user?.gbtcBalance]);

  // Block timer countdown and coin generation
  useEffect(() => {
    const timer = setInterval(() => {
      setBlockTimer(prev => {
        if (prev <= 1) {
          // Generate a coin when block completes
          if (myHashrate > 0) {
            setCoins(c => [...c, Date.now()]);
            setIsBlockAnimating(true);
            setTimeout(() => setIsBlockAnimating(false), 100); // Faster animation
          }
          return 3600; // Reset to 1 hour
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [myHashrate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    setBlockProgress(((3600 - blockTimer) / 3600) * 100);
  }, [blockTimer]);
  
  // Memoized hashrate display function
  const getHashrateDisplay = useMemo(() => (hashrate: number) => {
    if (hashrate >= 1000000) return `${(hashrate / 1000000).toFixed(3)} PH/s`;
    if (hashrate >= 1000) return `${(hashrate / 1000).toFixed(3)} TH/s`;
    if (hashrate >= 1) return `${hashrate.toFixed(2)} GH/s`;
    return `${(hashrate * 1000).toFixed(0)} MH/s`;
  }, []);

  // Generate random hash (throttled for performance)
  useEffect(() => {
    const generateHash = () => {
      const chars = '0123456789abcdef';
      let hash = '0000';
      for (let i = 0; i < 60; i++) {
        hash += chars[Math.floor(Math.random() * chars.length)];
      }
      setCurrentHash(hash);
    };
    // Throttled to 300ms for better performance
    const interval = setInterval(generateHash, 300);
    return () => clearInterval(interval);
  }, []);

  const claimRewardsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/claim-rewards");
      return res.json();
    },
    onSuccess: () => {
      setLastClaimed(new Date());
      toast({ 
        title: "Rewards Claimed!", 
        description: "Your mining rewards have been added to your balance." 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Claim Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const handleClaim = () => {
    claimRewardsMutation.mutate();
  };
  
  const handleClaimCoins = () => {
    if (coins.length > 0) {
      const coinCount = coins.length;
      setCoins([]);
      toast({ 
        title: `Visual Mining Complete!`, 
        description: `Cleared ${coinCount} block animations. Check your actual rewards in Account page.` 
      });
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
          <p className="text-sm text-muted-foreground">Loading Mining Factory...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    setLocation('/auth');
    return null;
  }

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="fixed inset-0 bitcoin-grid opacity-20"></div>
      
      {/* Advanced Hash Rain Effect */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute font-mono text-xs text-primary/30"
            style={{
              left: `${8.33 * i}%`,
              animation: `hash-stream ${12 + i * 1.5}s linear infinite`,
              animationDelay: `${i * 0.3}s`
            }}
          >
            {currentHash.substring(i * 4, (i * 4) + 8)}
          </div>
        ))}
      </div>

      {/* Professional Header */}
      <div className="relative z-10">
        <div className="mobile-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-chart-4 rounded-xl flex items-center justify-center">
                <Cpu className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-heading font-bold text-gradient">Mining Operations</h1>
                <p className="text-xs text-muted-foreground font-mono">Professional Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="hashrate-indicator">
                <Hash className="w-4 h-4 mr-1" />
                <span className="font-mono font-bold">{getHashrateDisplay(myHashrate)}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedAnalytics(!showAdvancedAnalytics)}
                className="text-chart-3 hover:text-chart-3/80"
                data-testid="button-toggle-analytics"
              >
                {showAdvancedAnalytics ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          {/* Mining Mode Selector */}
          <div className="mt-4 p-3 bg-card/50 border border-border rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-heading font-semibold text-foreground">Active Mode</span>
              <div className="flex items-center text-xs text-muted-foreground font-mono">
                <Target className="w-3 h-3 mr-1" />
                {currentMode.efficiency}% Efficiency
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(miningModes).map(([key, mode]) => {
                const IconComponent = mode.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedMiningMode(key)}
                    className={`p-2 rounded-lg border transition-all ${
                      selectedMiningMode === key
                        ? 'border-primary bg-primary/10 shadow-lg'
                        : 'border-border bg-muted/50 hover:border-primary/50'
                    }`}
                    data-testid={`button-mode-${key}`}
                  >
                    <div className="text-center">
                      <IconComponent className={`w-4 h-4 mx-auto mb-1 ${mode.color}`} />
                      <div className="text-xs font-medium">{mode.name}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mobile-content space-y-6">{/* Content continues here */}
        
        {/* Enhanced 3D Mining Visualization */}
        <div className="analytics-card relative">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-bold text-gradient">Mining Engine</h3>
            <div className={`flex items-center px-3 py-1 rounded-full text-xs font-mono ${
              miningActive && !isNewUser ? 'bg-chart-2/20 text-chart-2' : 'bg-destructive/20 text-destructive'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                miningActive && !isNewUser ? 'bg-chart-2' : 'bg-destructive'
              } animate-pulse`}></div>
              {isNewUser ? 'INACTIVE' : miningActive ? 'OPERATIONAL' : 'MAINTENANCE'}
            </div>
          </div>
          
          <div className="relative h-48 flex flex-col items-center justify-center">
            <div className="relative">
              {/* Enhanced 3D Block */}
              <div className={`mining-block-3d ${isBlockAnimating ? 'block-pulse' : ''}`}>
                <div className="block-face block-front"></div>
                <div className="block-face block-back"></div>
                <div className="block-face block-left"></div>
                <div className="block-face block-right"></div>
                <div className="block-face block-top"></div>
                <div className="block-face block-bottom"></div>
              </div>
              
              {/* Block Progress */}
              {!isNewUser && (
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-center">
                  <div className="text-xs text-muted-foreground mb-2">Block #871235 Progress</div>
                  <div className="text-lg font-mono font-bold text-primary mb-2">{formatTime(blockTimer)}</div>
                  <div className="w-40 h-2 bg-background rounded-full overflow-hidden border border-border">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-chart-4 transition-all duration-1000 relative"
                      style={{ width: `${blockProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Est. Reward: {myEstimatedReward.toFixed(8)} GBTC
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {isNewUser && (
            <div className="mt-4 p-4 bg-warning/10 border border-warning/30 rounded-lg text-center">
              <Activity className="w-8 h-8 text-warning mx-auto mb-2" />
              <p className="text-sm font-bold text-warning">Mining Engine Offline</p>
              <p className="text-xs text-muted-foreground mt-1">Purchase hashrate to activate mining operations</p>
            </div>
          )}
        </div>
        
        {/* Enhanced Coins Collection Area */}
        <div className="analytics-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading font-bold text-gradient">Block Rewards</h3>
            <div className="flex items-center text-xs text-muted-foreground font-mono">
              <Coins className="w-3 h-3 mr-1" />
              {coins.length} Visual Blocks
            </div>
          </div>
          
          <div className="relative min-h-[120px]">
            {coins.length > 0 ? (
              <div>
                <div className="flex flex-wrap gap-2 mb-4 justify-center p-3 bg-gradient-to-br from-chart-4/10 to-chart-2/10 rounded-lg border border-border">
                  {coins.slice(-15).map((coin, index) => (
                    <div 
                      key={coin} 
                      className="coin-3d"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <Coins className="w-6 h-6 text-chart-4" />
                    </div>
                  ))}
                  {coins.length > 15 && (
                    <div className="flex items-center justify-center w-8 h-8 text-xs font-mono font-bold text-muted-foreground bg-muted rounded-full">
                      +{coins.length - 15}
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="data-card p-3">
                    <div className="text-xs text-muted-foreground mb-1">Visual Blocks</div>
                    <div className="text-lg font-mono font-bold text-chart-4">{coins.length}</div>
                  </div>
                  <div className="data-card p-3">
                    <div className="text-xs text-muted-foreground mb-1">Est. Value</div>
                    <div className="text-lg font-mono font-bold text-chart-2">
                      {(coins.length * myEstimatedReward).toFixed(6)} GBTC
                    </div>
                  </div>
                </div>
                
                <Button
                  className="w-full btn-primary"
                  onClick={handleClaimCoins}
                  data-testid="button-claim-coins"
                >
                  <Award className="w-4 h-4 mr-2" />
                  CLEAR ANIMATIONS ({coins.length} blocks)
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center mb-3">
                  <Coins className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {isNewUser ? 'Activate mining to see visual feedback' : 'Visual block animations will appear here'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Visual feedback only - Real rewards tracked in Account page
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Personal Mining Stats */}
        <div className="analytics-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-chart-1 to-chart-1/80 rounded-lg flex items-center justify-center">
                <Hash className="w-5 h-5 text-black" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-bold text-gradient">Mining Performance</h2>
                <p className="text-xs text-muted-foreground font-mono">Personal Analytics</p>
              </div>
            </div>
            <div className="performance-indicator">
              <TrendingUp className="w-4 h-4 mr-1" />
              {performanceMetrics.efficiency}%
            </div>
          </div>

          {/* Enhanced Hashrate Display */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="data-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Effective Hashrate</span>
                <Hash className="w-4 h-4 text-chart-1" />
              </div>
              <div className="text-2xl font-mono font-bold text-gradient">
                {getHashrateDisplay(effectiveHashrate)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Base: {getHashrateDisplay(baseHashrate)} • Mode: {currentMode.name}
              </div>
            </div>

            <div className="data-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Network Share</span>
                <Percent className="w-4 h-4 text-chart-3" />
              </div>
              <div className="text-2xl font-mono font-bold text-chart-3">
                {myMiningShare.toFixed(6)}%
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                of {getHashrateDisplay(globalHashrate)} global
              </div>
            </div>
          </div>

          {/* Performance Metrics Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="data-card p-3">
              <div className="text-xs text-muted-foreground mb-1">Efficiency</div>
              <div className="text-lg font-mono font-bold text-chart-2">
                {performanceMetrics.efficiency}%
              </div>
            </div>
            <div className="data-card p-3">
              <div className="text-xs text-muted-foreground mb-1">Uptime</div>
              <div className="text-lg font-mono font-bold text-chart-4">
                {performanceMetrics.uptimePercentage}%
              </div>
            </div>
            <div className="data-card p-3">
              <div className="text-xs text-muted-foreground mb-1">Blocks</div>
              <div className="text-lg font-mono font-bold text-chart-1">
                {performanceMetrics.blocksFound}
              </div>
            </div>
          </div>

          {/* Current Block Progress */}
          {isNewUser ? (
            <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg text-center">
              <Activity className="w-8 h-8 text-warning mx-auto mb-2" />
              <p className="text-sm font-bold text-warning">Mining Operations Inactive</p>
              <p className="text-xs text-muted-foreground mt-1">Purchase hashrate to begin professional mining</p>
            </div>
          ) : (
            <div className="hashrate-efficiency mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-heading font-semibold text-foreground">Current Block Mining</span>
                <span className="text-xs font-mono text-primary">{formatTime(blockTimer)}</span>
              </div>
              <div className="h-4 bg-background rounded-full overflow-hidden border border-border">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-chart-4 transition-all duration-1000 relative"
                  style={{ width: `${blockProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Block #871235</span>
                <span>Estimated: {myEstimatedReward.toFixed(8)} GBTC</span>
              </div>
            </div>
          )}

          {/* Earnings Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="data-card p-3">
              <div className="text-xs text-muted-foreground mb-1">Per Block</div>
              <div className="text-lg font-mono font-bold text-chart-3">{myEstimatedReward.toFixed(6)}</div>
              <div className="text-xs text-muted-foreground">GBTC</div>
            </div>
            <div className="data-card p-3">
              <div className="text-xs text-muted-foreground mb-1">Daily Est.</div>
              <div className="text-lg font-mono font-bold text-chart-4">{dailyEstimatedRewards.toFixed(4)}</div>
              <div className="text-xs text-muted-foreground">GBTC</div>
            </div>
            <div className="data-card p-3">
              <div className="text-xs text-muted-foreground mb-1">Power Cost</div>
              <div className="text-lg font-mono font-bold text-chart-5">${dailyPowerCost.toFixed(4)}</div>
              <div className="text-xs text-muted-foreground">Daily</div>
            </div>
          </div>
        </div>

        {/* Advanced Analytics (when toggled) */}
        {showAdvancedAnalytics && (
          <div className="analytics-card border-chart-3/30">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-heading font-bold text-chart-3 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Advanced Analytics
              </h3>
              <div className="roi-indicator">
                <Gauge className="w-4 h-4 mr-1" />
                DETAILED
              </div>
            </div>
            
            <div className="space-y-4">
              {/* Profitability Analysis */}
              <div className="hashrate-efficiency">
                <h4 className="text-md font-heading font-semibold text-foreground mb-3">Profitability Analysis</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="data-card p-4">
                    <div className="text-xs text-muted-foreground mb-2">Net Daily Profit</div>
                    <div className="text-xl font-mono font-bold text-chart-2">
                      ${(dailyEstimatedRewards - dailyPowerCost).toFixed(4)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Profit Margin: {(((dailyEstimatedRewards - dailyPowerCost) / dailyEstimatedRewards) * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="data-card p-4">
                    <div className="text-xs text-muted-foreground mb-2">ROI Timeline</div>
                    <div className="text-xl font-mono font-bold text-chart-4">
                      {dailyEstimatedRewards > dailyPowerCost ? Math.ceil(baseHashrate / (dailyEstimatedRewards - dailyPowerCost)) : '∞'} days
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Break-even estimate
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Optimization */}
              <div className="hashrate-efficiency">
                <h4 className="text-md font-heading font-semibold text-foreground mb-3">Mode Comparison</h4>
                <div className="space-y-2">
                  {Object.entries(miningModes).map(([key, mode]) => {
                    const modeHashrate = baseHashrate * mode.hashMultiplier;
                    const modePowerCost = modeHashrate * mode.powerCost * 24;
                    const modeRewards = (modeHashrate / globalHashrate) * currentBlockReward * 24;
                    const modeProfit = modeRewards - modePowerCost;
                    
                    return (
                      <div 
                        key={key} 
                        className={`p-3 rounded-lg border transition-all ${
                          selectedMiningMode === key 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <mode.icon className={`w-4 h-4 ${mode.color}`} />
                            <span className="text-sm font-medium">{mode.name}</span>
                          </div>
                          <div className="flex items-center space-x-4 text-xs font-mono">
                            <span className="text-chart-1">{getHashrateDisplay(modeHashrate)}</span>
                            <span className="text-chart-2">${modeProfit.toFixed(4)}/day</span>
                            <span className={modeProfit > 0 ? 'text-chart-2' : 'text-destructive'}>
                              {modeProfit > 0 ? '+' : ''}{((modeProfit / modeRewards) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Network Analytics */}
              <div className="hashrate-efficiency">
                <h4 className="text-md font-heading font-semibold text-foreground mb-3">Network Status</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="data-card p-3">
                    <div className="text-xs text-muted-foreground mb-1">Global Hashrate</div>
                    <div className="text-sm font-mono font-bold text-chart-1">
                      {getHashrateDisplay(globalHashrate)}
                    </div>
                  </div>
                  <div className="data-card p-3">
                    <div className="text-xs text-muted-foreground mb-1">Network Growth</div>
                    <div className="text-sm font-mono font-bold text-chart-4">
                      +{((networkGrowthRate - 1) * 100).toFixed(2)}%/hr
                    </div>
                  </div>
                  <div className="data-card p-3">
                    <div className="text-xs text-muted-foreground mb-1">Difficulty</div>
                    <div className="text-sm font-mono font-bold text-chart-3">
                      {Math.round(globalHashrate / 1000)}K
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Supply Metrics Card */}
        {supplyMetrics && (
          <Card className="mining-block relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-2xl"></div>
            
            <h3 className="text-lg font-heading font-bold mb-4">Network Supply Metrics</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="data-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase">Total Mined</span>
                  <i className="fas fa-coins text-primary"></i>
                </div>
                <div className="text-xl font-mono font-bold text-gradient">
                  {parseFloat(supplyMetrics.totalMined).toLocaleString()}
                </div>
                <div className="text-xs text-accent mt-1">
                  {supplyMetrics.percentageMined}% of max supply
                </div>
              </div>
              
              <div className="data-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground uppercase">Circulating</span>
                  <i className="fas fa-sync text-chart-3"></i>
                </div>
                <div className="text-xl font-mono font-bold text-chart-3">
                  {parseFloat(supplyMetrics.circulating).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  In wallets
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-lg bg-background">
                <div className="text-lg font-mono font-bold text-chart-2">{supplyMetrics.currentBlockReward}</div>
                <div className="text-xs text-muted-foreground">Block Reward</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-background">
                <div className="text-lg font-mono font-bold text-chart-4">{supplyMetrics.totalBlocks}</div>
                <div className="text-xs text-muted-foreground">Total Blocks</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-background">
                <div className="text-lg font-mono font-bold text-warning">{supplyMetrics.halvingProgress.blocksRemaining}</div>
                <div className="text-xs text-muted-foreground">Until Halving</div>
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-primary/5 rounded-lg border border-primary/20">
              <div className="text-xs text-muted-foreground text-center">
                <span className="font-semibold">Max Supply:</span>
                <span className="font-mono ml-2 text-primary">2,100,000 GBTC</span>
              </div>
            </div>
          </Card>
        )}
        
        {/* Rewards Section */}
        <Card className="mining-block relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/20 to-transparent rounded-full blur-2xl"></div>
          
          <h3 className="text-lg font-heading font-bold mb-4">Mining Rewards</h3>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase mb-1">Unclaimed Rewards</div>
                <div className="text-3xl font-mono font-bold text-gradient-green">
                  {unclaimedGBTC.toFixed(8)} GBTC
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Daily Est.: {dailyEstimatedRewards.toFixed(4)} GBTC
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-warning mb-1">⚠️ Claim within 24h</div>
                <div className="text-xs text-muted-foreground">or lose 50%</div>
              </div>
            </div>

            <Button 
              className="w-full btn-primary"
              onClick={handleClaim}
              disabled={unclaimedGBTC === 0 || claimRewardsMutation.isPending}
              data-testid="button-claim-rewards"
            >
              {claimRewardsMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-coins mr-2"></i>
                  CLAIM {unclaimedGBTC.toFixed(4)} GBTC
                </>
              )}
            </Button>

            {unclaimedGBTC > 0 && showClaimWarning && (
              <div className="mt-3 p-2 rounded-lg bg-warning/10 border border-warning/30">
                <div className="text-xs text-warning">
                  <i className="fas fa-exclamation-triangle mr-1"></i>
                  Rewards expire in {24 - hoursSinceLastClaim} hours
                </div>
              </div>
            )}
          </div>
        </Card>
        
        {/* My Miners Tab */}
        {activeTab === 'miners' && (
          <Card className="mining-block">
            <h3 className="text-lg font-heading font-bold mb-4">My Mining Equipment</h3>
            <div className="space-y-4">
              <div className="data-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-heading">Total Hashrate</span>
                  <i className="fas fa-microchip text-primary"></i>
                </div>
                <div className="text-2xl font-mono font-bold text-gradient">
                  {getHashrateDisplay(myHashrate)}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Network Share: {myMiningShare.toFixed(6)}%
                </div>
              </div>
              
              <Button 
                className="btn-primary w-full"
                onClick={() => setLocation('/power')}
                data-testid="button-purchase-hashrate"
              >
                <i className="fas fa-bolt mr-2"></i>
                Purchase More Hashrate
              </Button>
              
              <div className="text-xs text-muted-foreground text-center">
                Upgrade your mining power to earn more GBTC rewards
              </div>
            </div>
          </Card>
        )}
        
        {/* My Wallet Tab */}
        {activeTab === 'wallet' && (
          <div className="space-y-4">
            <Card className="mining-block">
              <div className="text-center mb-4">
                <i className="fas fa-user-circle text-4xl text-primary mb-2"></i>
                <h3 className="text-lg font-heading font-bold">{user?.username}</h3>
                <p className="text-xs text-muted-foreground">Wallet Overview</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Button 
                  className="btn-secondary h-auto py-3"
                  onClick={() => setLocation('/deposit')}
                  data-testid="button-deposit"
                >
                  <div className="text-center">
                    <i className="fas fa-download text-xl mb-1"></i>
                    <div className="text-sm font-heading">Deposit</div>
                  </div>
                </Button>
                <Button 
                  className="btn-secondary h-auto py-3"
                  onClick={() => setLocation('/withdraw')}
                  data-testid="button-withdraw"
                >
                  <div className="text-center">
                    <i className="fas fa-upload text-xl mb-1"></i>
                    <div className="text-sm font-heading">Withdraw</div>
                  </div>
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="data-card">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground uppercase">GBTC Balance</span>
                    <i className="fas fa-coins text-primary"></i>
                  </div>
                  <div className="text-2xl font-mono font-bold text-gradient">
                    {parseFloat(user?.gbtcBalance || '0').toFixed(4)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Mined tokens</div>
                </div>
                
                <div className="data-card">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground uppercase">USDT Balance</span>
                    <i className="fas fa-dollar-sign text-accent"></i>
                  </div>
                  <div className="text-2xl font-mono font-bold text-accent">
                    ${parseFloat(user?.usdtBalance || '0').toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Ready for investment</div>
                </div>
                
                <div className="data-card">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground uppercase">Unclaimed Rewards</span>
                    <i className="fas fa-gift text-chart-3"></i>
                  </div>
                  <div className="text-2xl font-mono font-bold text-chart-3">
                    {unclaimedGBTC.toFixed(4)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Pending GBTC</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button 
                  onClick={() => setLocation('/transfer')}
                  className="data-card text-center py-2 transition-all hover:scale-105"
                  data-testid="button-transfer"
                >
                  <i className="fas fa-exchange-alt text-lg text-chart-4 mb-1"></i>
                  <div className="text-xs font-heading uppercase">Transfer</div>
                </button>
                <button 
                  onClick={() => setLocation('/referral')}
                  className="data-card text-center py-2 transition-all hover:scale-105"
                  data-testid="button-referral"
                >
                  <i className="fas fa-users text-lg text-chart-3 mb-1"></i>
                  <div className="text-xs font-heading uppercase">Referral</div>
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* Mining History */}
        <Card className="mining-block">
          <h3 className="text-lg font-heading font-bold mb-4">Recent Blocks</h3>
          <div className="space-y-2">
            {[
              { block: 871234, reward: 0.0234, time: '2 mins ago', status: 'confirmed' },
              { block: 871233, reward: 0.0229, time: '12 mins ago', status: 'confirmed' },
              { block: 871232, reward: 0.0241, time: '22 mins ago', status: 'confirmed' },
              { block: 871231, reward: 0.0218, time: '32 mins ago', status: 'confirmed' },
              { block: 871230, reward: 0.0236, time: '42 mins ago', status: 'confirmed' },
            ].map((item) => (
              <div key={item.block} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                    <i className="fas fa-cube text-primary text-xs"></i>
                  </div>
                  <div>
                    <div className="text-sm font-mono">Block #{item.block}</div>
                    <div className="text-xs text-muted-foreground">{item.time}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-accent">+{item.reward} GBTC</div>
                  <div className="text-xs text-green-500">
                    <i className="fas fa-check-circle mr-1"></i>
                    {item.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Performance Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="data-card">
            <div className="text-xs text-muted-foreground mb-1">24h Earnings</div>
            <div className="text-xl font-mono font-bold text-gradient-green">0.5432 GBTC</div>
            <div className="text-xs text-accent">+12.5%</div>
          </Card>
          <Card className="data-card">
            <div className="text-xs text-muted-foreground mb-1">Total Mined</div>
            <div className="text-xl font-mono font-bold text-gradient">127.384 GBTC</div>
            <div className="text-xs text-muted-foreground">All time</div>
          </Card>
        </div>
      </div>
    </div>
  );
}