import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Cpu, TrendingUp, Clock, Zap, Award, Hash, Activity, Blocks, Binary, Shield, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

export default function MiningFactory() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isMining, setIsMining] = useState(false);
  const [currentHash, setCurrentHash] = useState("");
  const [hashPool, setHashPool] = useState<string[]>([]);
  const [nextBlockTime, setNextBlockTime] = useState("00:00");
  const [miningProgress, setMiningProgress] = useState(0);
  const [blockAnimations, setBlockAnimations] = useState<number[]>([]);
  const [showNewBlock, setShowNewBlock] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [isBlockForm, setIsBlockForm] = useState(false);

  const hashPower = parseFloat(user?.hashPower || '0');
  const gbtcBalance = parseFloat(user?.gbtcBalance || '0');
  
  // Derived mining active state - combines local mining state with server-side started flag
  const miningActive = isMining || (!!user?.hasStartedMining && hashPower > 0);
  
  // Start mining mutation 
  const startMiningMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/start-mining");
    },
    onSuccess: () => {
      // Set local mining state to true for immediate UI feedback
      setIsMining(true);
      // Invalidate user cache to get updated hasStartedMining flag
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Mining Activated!",
        description: `Your ${formatHashrate(hashPower)} hash power is now earning B2B rewards`,
        className: "bg-green-800 text-white",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Mining Error",
        description: error.message || "Failed to start mining",
        variant: "destructive"
      });
    }
  });

  // Start Mining function
  const handleStartMining = () => {
    if (hashPower > 0) {
      startMiningMutation.mutate();
    } else {
      toast({
        title: "No Mining Power",
        description: "You need hash power to start mining",
        variant: "destructive"
      });
    }
  };

  // Stop Mining function
  const handleStopMining = () => {
    setIsMining(false);
    setMiningProgress(0);
    setCurrentHash("");
    setHashPool([]);
    toast({
      title: "Mining Stopped",
      description: "Mining operations have been halted",
    });
  };

  // Sync local mining state with server state when user returns
  useEffect(() => {
    if (user?.hasStartedMining && hashPower > 0) {
      setIsMining(true);
    }
  }, [user?.hasStartedMining, hashPower]);

  // Fetch global mining stats
  const { data: globalStats } = useQuery<{
    totalHashrate: number;
    blockHeight: number;
    totalBlocksMined: number;
    circulation: number;
    currentBlockReward: number;
    activeMiners: number;
  }>({
    queryKey: ["/api/global-stats"],
    staleTime: Infinity,
    gcTime: Infinity // Cache permanently
  });

  // Fetch unclaimed blocks
  const { data: unclaimedBlocks, isLoading: blocksLoading } = useQuery<Array<{
    id: string;
    blockNumber: number;
    reward: string;
    txHash: string;
    expiresAt: string;
    claimed: boolean;
  }>>({
    queryKey: ["/api/unclaimed-blocks"],
    staleTime: 300000, // Cache for 5 minutes
    gcTime: 600000,
    enabled: !!user,
  });

  // Mining animation effect - remove auto-start, now controlled by user
  // No longer auto-starts mining based on hash power

  // Transform to block form every 3-4 seconds
  useEffect(() => {
    if (!isMining) return;
    
    const interval = setInterval(() => {
      setIsBlockForm(true);
      setTimeout(() => {
        setIsBlockForm(false);
      }, 500); // Faster transform animation
    }, 2000); // More frequent transforms
    
    return () => clearInterval(interval);
  }, [isMining]);

  // Mining progress animation
  useEffect(() => {
    if (!isMining) {
      setMiningProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setMiningProgress(prev => {
        if (prev >= 100) {
          // Show block found animation
          setShowNewBlock(true);
          setTimeout(() => setShowNewBlock(false), 500); // Faster block animation
          
          // Add new block animation
          setBlockAnimations(prev => [...prev, Date.now()]);
          setTimeout(() => {
            setBlockAnimations(prev => prev.slice(1));
          }, 1000); // Faster block removal
          
          return 0;
        }
        return prev + (hashPower / 1000); // Progress based on hash power
      });
    }, 50); // Faster progress updates

    return () => clearInterval(interval);
  }, [isMining, hashPower]);

  // Nonce counter for mining simulation
  useEffect(() => {
    if (!isMining) return;
    
    const interval = setInterval(() => {
      setNonce(prev => prev + Math.floor(Math.random() * 100000));
    }, 100);
    
    return () => clearInterval(interval);
  }, [isMining]);

  // Generate realistic hash strings
  useEffect(() => {
    if (!isMining) return;

    const generateHash = () => {
      const chars = '0123456789abcdef';
      let hash = '0x';
      for (let i = 0; i < 64; i++) {
        hash += chars[Math.floor(Math.random() * chars.length)];
      }
      return hash;
    };

    const interval = setInterval(() => {
      const newHash = generateHash();
      setCurrentHash(newHash);
      setHashPool(prev => {
        const updated = [newHash, ...prev.slice(0, 4)];
        return updated;
      });
    }, 100); // Fast hash generation for visual effect

    return () => clearInterval(interval);
  }, [isMining]);

  // Countdown timer for next block (24-hour UTC cycles)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      
      // Calculate next 00:00 UTC
      const nextMidnightUTC = new Date(now);
      nextMidnightUTC.setUTCDate(now.getUTCDate() + 1);
      nextMidnightUTC.setUTCHours(0, 0, 0, 0);
      
      // Calculate time remaining until next 00:00 UTC
      const timeUntilNextBlock = nextMidnightUTC.getTime() - now.getTime();
      const hoursRemaining = Math.floor(timeUntilNextBlock / (1000 * 60 * 60));
      const minutesRemaining = Math.floor((timeUntilNextBlock % (1000 * 60 * 60)) / (1000 * 60));
      const secondsRemaining = Math.floor((timeUntilNextBlock % (1000 * 60)) / 1000);
      
      setNextBlockTime(`${hoursRemaining.toString().padStart(2, '0')}:${minutesRemaining.toString().padStart(2, '0')}:${secondsRemaining.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Claim single block mutation
  const claimBlockMutation = useMutation({
    mutationFn: async (blockId: string) => {
      const res = await apiRequest("POST", `/api/claim-block/${blockId}`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Block Claimed!", 
        description: `Successfully claimed ${data.reward} B2B` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/unclaimed-blocks"] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Claim Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Claim all blocks mutation
  const claimAllMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/claim-all-blocks");
      return res.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "All Blocks Claimed!", 
        description: `Successfully claimed ${data.totalReward} B2B from ${data.count} blocks` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/unclaimed-blocks"] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Claim Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  // Calculate mining stats
  const totalSupply = 2100000; // 2.1M max supply from whitepaper
  const blockHeight = globalStats?.blockHeight || 1;
  const globalHashrate = globalStats?.totalHashrate || 0;
  const circulation = globalStats?.circulation || 0;
  const currentBlockReward = globalStats?.currentBlockReward || 6.25;
  const networkShare = globalHashrate > 0 ? ((hashPower / globalHashrate) * 100) : 0;
  const estimatedDaily = globalHashrate > 0 ? ((24 * currentBlockReward) * (hashPower / globalHashrate)) : 0; // 24 blocks per day (1 hour block time)

  const formatHashrate = (rate: number) => {
    if (rate >= 1000000) return `${(rate / 1000000).toFixed(2)} PH/s`;
    if (rate >= 1000) return `${(rate / 1000).toFixed(2)} TH/s`;
    return `${rate.toFixed(2)} GH/s`;
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime();
    const expires = new Date(expiresAt).getTime();
    const diff = expires - now;
    
    if (diff <= 0) return "EXPIRED";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const totalUnclaimedReward = unclaimedBlocks?.reduce((sum: number, block: any) => 
    sum + parseFloat(block.reward), 0
  ) || 0;

  return (
    <div className="mobile-page bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Header */}
      <div className="mobile-header bg-black/90 backdrop-blur-lg border-b border-orange-500/20">
        <div>
          <h1 className="text-lg font-display font-black text-orange-500">
            MINING FACTORY
          </h1>
          <p className="text-[10px] text-gray-500 font-mono">
            B2B BLOCKCHAIN NETWORK
          </p>
        </div>
      </div>

      <div className="mobile-content">
        {/* Mining Animation Section */}
        <Card className="mobile-card bg-black/90 border-orange-500/30 overflow-hidden relative p-3">
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-end mb-4">
              <span className="text-[10px] font-mono text-orange-400">
                {formatHashrate(hashPower)}
              </span>
            </div>

            {/* Energy Core Mining Animation */}
            <div className="flex justify-center my-6 relative">
              <div className="relative w-48 h-48 flex items-center justify-center">
                
                {/* Central Energy Core */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Outer hexagon frame */}
                  <motion.div
                    className="absolute w-36 h-36"
                    animate={isMining ? {
                      rotate: [0, 360],
                    } : {}}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <svg className="w-full h-full" viewBox="0 0 144 144">
                      <polygon
                        points="72,12 122,42 122,102 72,132 22,102 22,42"
                        fill="none"
                        stroke={isMining ? "#f97316" : "#374151"}
                        strokeWidth="2"
                        opacity={isMining ? 1 : 0.3}
                      />
                      <polygon
                        points="72,24 110,48 110,96 72,120 34,96 34,48"
                        fill="none"
                        stroke={isMining ? "#fbbf24" : "#374151"}
                        strokeWidth="1"
                        opacity={isMining ? 0.8 : 0.2}
                      />
                    </svg>
                  </motion.div>

                  {/* Energy core center - transforms to block */}
                  <motion.div
                    className="absolute w-20 h-20"
                    animate={isBlockForm ? {
                      scale: [1, 0.8, 1],
                      borderRadius: ["50%", "20%", "10%", "20%", "50%"],
                    } : isMining ? {
                      scale: [1, 1.2, 1],
                    } : {}}
                    transition={isBlockForm ? {
                      duration: 1,
                      ease: "easeInOut",
                    } : {
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <motion.div 
                      className={`w-full h-full relative ${isMining ? 'bg-gradient-to-br from-orange-500 via-yellow-500 to-orange-600' : 'bg-gray-800'}`}
                      animate={{
                        borderRadius: isBlockForm ? "10%" : "50%",
                      }}
                      transition={{
                        duration: 0.5,
                      }}
                    >
                      {/* Inner core */}
                      {!isBlockForm && (
                        <motion.div
                          className="absolute inset-2 rounded-full bg-gradient-to-br from-white via-yellow-200 to-orange-300"
                          animate={isMining ? {
                            opacity: [0.6, 1, 0.6],
                          } : {}}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                          }}
                        />
                      )}
                      
                      {/* Digital block pattern when transformed */}
                      {isBlockForm && (
                        <div className="absolute inset-0 overflow-hidden rounded-sm">
                          <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-yellow-600">
                            <div className="absolute inset-0 opacity-30">
                              {[...Array(4)].map((_, i) => (
                                <div key={i} className={`absolute w-full h-0.5 bg-orange-800`} style={{ top: `${25 * (i + 1)}%` }} />
                              ))}
                              {[...Array(4)].map((_, i) => (
                                <div key={i} className={`absolute h-full w-0.5 bg-orange-800`} style={{ left: `${25 * (i + 1)}%` }} />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Bitcoin symbol */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-orange-900">₿</span>
                      </div>
                    </motion.div>

                    {/* Pulsing glow */}
                    {miningActive && (
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{
                          boxShadow: [
                            '0 0 20px rgba(251, 146, 60, 0.5)',
                            '0 0 40px rgba(251, 146, 60, 0.8)',
                            '0 0 20px rgba(251, 146, 60, 0.5)',
                          ],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                      />
                    )}
                  </motion.div>

                  {/* Energy rings */}
                  {miningActive && !isBlockForm && (
                    <>
                      {[0, 1, 2].map((ring) => (
                        <motion.div
                          key={`ring-${ring}`}
                          className="absolute rounded-full border-2 border-orange-400"
                          initial={{
                            width: 80,
                            height: 80,
                            opacity: 1,
                          }}
                          animate={{
                            width: [80, 160, 200],
                            height: [80, 160, 200],
                            opacity: [1, 0.5, 0],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: ring * 1,
                          }}
                        />
                      ))}
                    </>
                  )}


                  {/* Lightning bolts */}
                  {miningActive && !isBlockForm && (
                    <>
                      {[0, 1, 2, 3].map((bolt) => (
                        <motion.div
                          key={`bolt-${bolt}`}
                          className="absolute"
                          style={{
                            left: '50%',
                            top: '50%',
                            transform: `rotate(${bolt * 90}deg)`,
                          }}
                          animate={{
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            delay: bolt * 0.5,
                            repeatDelay: 2,
                          }}
                        >
                          <svg width="80" height="20" viewBox="0 0 80 20" className="-ml-10 -mt-2">
                            <path
                              d="M 20 10 L 30 5 L 35 10 L 45 5 L 50 10 L 60 5 L 65 10 L 75 5"
                              stroke="#fbbf24"
                              strokeWidth="2"
                              fill="none"
                            />
                          </svg>
                        </motion.div>
                      ))}
                    </>
                  )}


                </div>
              </div>
            </div>

            {/* Global Hashrate Display */}
            {miningActive && (
              <div className="bg-black/50 rounded-lg p-4">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Activity className="w-5 h-5 text-primary animate-pulse" />
                    <span className="text-sm font-mono text-primary uppercase">Total Global Hashrate</span>
                    <Activity className="w-5 h-5 text-primary animate-pulse" />
                  </div>
                  <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                    {formatHashrate(globalHashrate)}
                  </div>
                  <div className="mt-3 w-full bg-black/50 rounded-full h-2 overflow-hidden">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-primary to-accent"
                      style={{ width: `${miningProgress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Hash Display */}
            {miningActive && (
              <div className="bg-black/60 rounded-lg p-2 mt-3">
                <div className="flex items-center space-x-1.5 mb-1.5">
                  <Hash className="w-3 h-3 text-orange-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-orange-500">CALCULATING HASHES</span>
                  <Activity className="w-2.5 h-2.5 text-orange-400 animate-pulse" />
                </div>
                <div className="font-mono text-[9px] text-orange-400 break-all">
                  {currentHash}
                </div>
                <div className="mt-1.5 space-y-0.5">
                  {hashPool.map((hash, index) => (
                    <motion.div
                      key={`${hash}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1 - (index * 0.2), x: 0 }}
                      className="font-mono text-[8px] text-orange-400/40 truncate"
                    >
                      {hash}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Start Mining Button - Only show for first-time users */}
        {hashPower > 0 && !user?.hasStartedMining && (
          <Card className="mobile-card bg-black/90 border-orange-500/30 mt-3">
            <div className="text-center">
              <Button
                onClick={handleStartMining}
                className="bg-transparent border-2 border-[#f7931a] text-[#f7931a] hover:bg-[#f7931a] hover:text-black font-medium text-sm px-6 py-2 transition-all duration-200"
                data-testid="button-start-mining"
              >
                Start Mining
              </Button>
            </div>
          </Card>
        )}


        {/* Network Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Card className="bg-black/80 border-orange-500/20">
            <div className="p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-gray-400 uppercase">Total Supply</span>
                <Award className="w-3 h-3 text-orange-500/50" />
              </div>
              <p className="text-sm font-bold text-orange-500">{(totalSupply / 1000000).toFixed(1)}M</p>
              <p className="text-[9px] text-gray-500">B2B</p>
            </div>
          </Card>

          <Card className="bg-black/80 border-orange-500/20">
            <div className="p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-gray-400 uppercase">Circulation</span>
                <TrendingUp className="w-3 h-3 text-orange-500/50" />
              </div>
              <p className="text-sm font-bold text-orange-500">{circulation.toFixed(2)}</p>
              <p className="text-[9px] text-gray-500">B2B</p>
            </div>
          </Card>

          <Card className="bg-black/80 border-orange-500/20">
            <div className="p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-gray-400 uppercase">Block Height</span>
                <Cpu className="w-3 h-3 text-orange-500/50" />
              </div>
              <p className="text-sm font-bold text-orange-500">#{blockHeight}</p>
              <p className="text-[9px] text-gray-500">CURRENT</p>
            </div>
          </Card>

          <Card className="bg-black/80 border-orange-500/20">
            <div className="p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-gray-400 uppercase">Next Block</span>
                <Clock className="w-3 h-3 text-orange-500/50 animate-pulse" />
              </div>
              <p className="text-sm font-bold text-orange-500">{nextBlockTime}</p>
              <p className="text-[9px] text-gray-500">COUNTDOWN</p>
            </div>
          </Card>
        </div>

        {/* Personal Mining Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Card className="bg-black/80 border-orange-500/20">
            <div className="p-1.5 text-center">
              <Zap className="w-3 h-3 text-orange-500 mx-auto mb-0.5" />
              <p className="text-[8px] text-gray-400">Network Share</p>
              <p className="text-xs font-bold text-orange-500">{networkShare.toFixed(2)}%</p>
            </div>
          </Card>

          <Card className="bg-black/80 border-orange-500/20">
            <div className="p-1.5 text-center">
              <Cpu className="w-3 h-3 text-orange-500 mx-auto mb-0.5" />
              <p className="text-[8px] text-gray-400">Your Hashrate</p>
              <p className="text-xs font-bold text-orange-500">{formatHashrate(hashPower)}</p>
            </div>
          </Card>

          <Card className="bg-black/80 border-orange-500/20">
            <div className="p-1.5 text-center">
              <TrendingUp className="w-3 h-3 text-orange-500 mx-auto mb-0.5" />
              <p className="text-[8px] text-gray-400">Est. Daily</p>
              <p className="text-xs font-bold text-orange-500">{estimatedDaily.toFixed(4)}</p>
            </div>
          </Card>
        </div>

        {/* Unclaimed Blocks Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono text-orange-500">UNCLAIMED BLOCKS</p>
            {unclaimedBlocks && unclaimedBlocks.length > 0 && (
              <Button
                onClick={() => claimBlockMutation.mutate(unclaimedBlocks[0].id)}
                disabled={claimBlockMutation.isPending}
                size="sm"
                className="btn-primary text-xs px-4 py-2"
                data-testid="button-claim"
              >
                {claimBlockMutation.isPending ? (
                  <Loader2 className="w-3 h-3 animate-spin mr-1" />
                ) : (
                  <Award className="w-3 h-3 mr-1" />
                )}
                CLAIM
              </Button>
            )}
          </div>

          {blocksLoading ? (
            <Card className="bg-black/80 border-orange-500/20">
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
              </div>
            </Card>
          ) : unclaimedBlocks && unclaimedBlocks.length > 0 ? (
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {unclaimedBlocks.map((block: any, index: number) => (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-black/80 border-orange-500/20 overflow-hidden">
                    <div className="p-2 relative">
                      {/* Block pattern background */}
                      <div className="absolute inset-0 opacity-5">
                        <div className="grid grid-cols-8 h-full">
                          {[...Array(8)].map((_, i) => (
                            <div key={i} className="border-r border-primary/20"></div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center space-x-1.5">
                            <motion.div 
                              className="w-8 h-8 bg-orange-500/20 rounded flex items-center justify-center"
                              animate={{ rotate: [0, 5, -5, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Blocks className="w-4 h-4 text-orange-500" />
                            </motion.div>
                            <div>
                              <p className="text-xs font-bold text-orange-500">BLOCK #{block.blockNumber}</p>
                              <p className="text-[8px] font-mono text-gray-500 truncate max-w-[100px]">
                                {block.txHash}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <motion.p 
                              className="text-sm font-bold text-orange-500"
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              {parseFloat(block.reward).toFixed(6)}
                            </motion.p>
                            <p className="text-[9px] text-orange-400">B2B</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            getTimeRemaining(block.expiresAt) === 'EXPIRED' 
                              ? 'bg-red-900/50 text-red-400' 
                              : 'bg-orange-900/30 text-orange-400'
                          }`}>
                            <Clock className="w-2 h-2 inline mr-0.5" />
                            {getTimeRemaining(block.expiresAt)}
                          </div>
                          
                          <Button
                            onClick={() => claimBlockMutation.mutate(block.id)}
                            disabled={
                              claimBlockMutation.isPending || 
                              getTimeRemaining(block.expiresAt) === 'EXPIRED'
                            }
                            className="bg-orange-500 text-black hover:bg-orange-400 px-2 py-0.5 h-6 text-[10px]"
                            size="sm"
                            data-testid={`button-claim-${block.id}`}
                          >
                            {claimBlockMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <>
                                <Award className="w-2.5 h-2.5 mr-0.5" />
                                CLAIM
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="bg-black/80 border-orange-500/20">
              <div className="text-center py-6">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-block"
                >
                  <Blocks className="w-8 h-8 text-gray-600 mb-2 mx-auto" />
                </motion.div>
                <p className="text-xs text-gray-400">No blocks to claim</p>
                <p className="text-[10px] text-gray-500 mt-1">
                  {hashPower > 0 
                    ? "New blocks appear every 1 hour" 
                    : "Purchase hashrate to start mining"}
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* No Hashrate Warning */}
        {hashPower <= 0 && (
          <Card className="bg-black/80 border-orange-500/30 mt-3">
            <div className="flex items-center space-x-2 p-2">
              <Zap className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs font-semibold text-orange-500">Mining Power Required</p>
                <p className="text-[10px] text-gray-400">
                  Purchase hashrate to start mining and earning B2B rewards
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}