import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bitcoin, Activity, Users, Cpu, Zap, TrendingUp, Server, HardDrive, CircuitBoard } from "lucide-react";
import { motion } from "framer-motion";

export default function MyMiners() {
  // Fetch miners data
  const { data: minersData, isLoading } = useQuery({
    queryKey: ["/api/my-miners"],
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000 // Consider data fresh for 30 seconds
  });

  const activeMiners = minersData?.miners?.filter((m: any) => m.isActive) || [];
  const inactiveMiners = minersData?.miners?.filter((m: any) => !m.isActive) || [];
  const totalHashPower = minersData?.totalHashPower || 0;

  const getHashrateDisplay = (hashrate: number) => {
    if (hashrate >= 1000000) return `${(hashrate / 1000000).toFixed(2)} PH/s`;
    if (hashrate >= 1000) return `${(hashrate / 1000).toFixed(2)} TH/s`;
    return `${hashrate.toFixed(2)} GH/s`;
  };

  const getLastActiveTime = (lastClaim: string | null) => {
    if (!lastClaim) return "Never";
    
    const now = new Date().getTime();
    const last = new Date(lastClaim).getTime();
    const diff = now - last;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Recently";
  };

  const activeRate = activeMiners.length + inactiveMiners.length > 0 
    ? ((activeMiners.length / (activeMiners.length + inactiveMiners.length)) * 100)
    : 0;

  return (
    <div className="mobile-page bg-gradient-to-b from-black via-gray-900 to-black">
      {/* Bitcoin Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" 
          style={{ 
            backgroundImage: `repeating-linear-gradient(45deg, #f7931a 0, #f7931a 1px, transparent 1px, transparent 15px),
                             repeating-linear-gradient(-45deg, #f7931a 0, #f7931a 1px, transparent 1px, transparent 15px)`,
            backgroundSize: '20px 20px'
          }}>
        </div>
      </div>

      {/* Header with Bitcoin Theme */}
      <div className="mobile-header bg-gradient-to-r from-black via-gray-900 to-black backdrop-blur-lg border-b border-[#f7931a]/30 relative z-10">
        <div className="flex items-center space-x-2">
          <CircuitBoard className="w-5 h-5 text-[#f7931a]" />
          <div>
            <h1 className="text-xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-[#f7931a] to-[#ff9416]">
              MY MINERS
            </h1>
            <p className="text-xs text-[#f7931a]/60 font-mono">Mining Network</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center justify-end space-x-1 mb-1">
            <Zap className="w-3 h-3 text-[#f7931a]" />
            <p className="text-xs text-[#f7931a]/60 font-mono">TOTAL POWER</p>
          </div>
          <p className="text-lg font-display font-bold text-[#f7931a]">
            {getHashrateDisplay(totalHashPower)}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mobile-content relative z-10">
        {/* Compact Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-3 bg-gradient-to-br from-emerald-500/20 to-black border-emerald-500/30 text-center">
              <div className="w-8 h-8 mx-auto mb-1 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <p className="text-xl font-display font-black text-emerald-500">
                {activeMiners.length}
              </p>
              <p className="text-[10px] text-emerald-500/60 uppercase">Active</p>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="p-3 bg-gradient-to-br from-amber-500/20 to-black border-amber-500/30 text-center">
              <div className="w-8 h-8 mx-auto mb-1 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
                <Server className="w-4 h-4 text-white" />
              </div>
              <p className="text-xl font-display font-black text-amber-500">
                {inactiveMiners.length}
              </p>
              <p className="text-[10px] text-amber-500/60 uppercase">Inactive</p>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="p-3 bg-gradient-to-br from-[#f7931a]/20 to-black border-[#f7931a]/30 text-center">
              <div className="w-8 h-8 mx-auto mb-1 bg-gradient-to-br from-[#f7931a] to-[#ff9416] rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-black" />
              </div>
              <p className="text-xl font-display font-black text-[#f7931a]">
                {activeMiners.length + inactiveMiners.length}
              </p>
              <p className="text-[10px] text-[#f7931a]/60 uppercase">Total</p>
            </Card>
          </motion.div>
        </div>

        {/* Quick Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="p-3 mb-3 bg-black/50 border-[#f7931a]/20">
            <div className="flex items-center space-x-2">
              <Bitcoin className="w-4 h-4 text-[#f7931a] animate-pulse" />
              <div className="text-[11px] text-[#f7931a]/70 font-mono">
                <span>Active miners earn GBTC • </span>
                <span>48h inactivity = inactive status</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Miners List - Compact */}
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-mono text-[#f7931a] uppercase tracking-wider">Miner Status</p>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-emerald-500/60">{activeRate.toFixed(0)}% Active</span>
            </div>
          </div>
          
          {isLoading ? (
            <Card className="p-6 bg-black/50 border-[#f7931a]/20">
              <div className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-[#f7931a]" />
              </div>
            </Card>
          ) : (activeMiners.length + inactiveMiners.length) > 0 ? (
            <div className="space-y-1.5">
              {/* Active Miners - Compact */}
              {activeMiners.map((miner: any, index: number) => (
                <motion.div
                  key={miner.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card className="p-2.5 bg-gradient-to-r from-emerald-500/10 to-black border-emerald-500/30 hover:border-emerald-500/50 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                            <Cpu className="w-4 h-4 text-white" />
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        </div>
                        <div>
                          <p className="text-xs font-display font-bold text-white">
                            {miner.username}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            ID: {miner.id.slice(0, 6)}...
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="text-[9px] px-1.5 py-0 bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
                          ACTIVE
                        </Badge>
                        <p className="text-[11px] font-display font-bold text-emerald-500 mt-0.5">
                          {getHashrateDisplay(miner.hashPower)}
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          {getLastActiveTime(miner.lastClaimTime)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
              
              {/* Inactive Miners - Compact */}
              {inactiveMiners.map((miner: any, index: number) => (
                <motion.div
                  key={miner.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: (activeMiners.length + index) * 0.05 }}
                >
                  <Card className="p-2.5 bg-gradient-to-r from-gray-600/10 to-black border-gray-600/30 hover:border-gray-600/50 transition-all opacity-75">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
                          <HardDrive className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-xs font-display font-bold text-gray-400">
                            {miner.username}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            ID: {miner.id.slice(0, 6)}...
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className="text-[9px] px-1.5 py-0 bg-gray-600/20 text-gray-500 border-gray-600/30">
                          INACTIVE
                        </Badge>
                        <p className="text-[11px] font-display font-bold text-gray-500 mt-0.5">
                          {getHashrateDisplay(miner.hashPower)}
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          {getLastActiveTime(miner.lastClaimTime)}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="p-6 bg-black/50 border-[#f7931a]/20">
              <div className="text-center">
                <Users className="w-8 h-8 text-[#f7931a]/30 mx-auto mb-2" />
                <p className="text-xs text-[#f7931a]/50">No miners in your network</p>
                <p className="text-[10px] text-[#f7931a]/30 mt-1">
                  Invite others to join
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Network Stats - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="p-3 mt-3 bg-black/50 border-[#f7931a]/20">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-3 h-3 text-[#f7931a]" />
              <p className="text-[10px] font-mono text-[#f7931a] uppercase tracking-wider">Network Stats</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-[#f7931a]/5 rounded">
                <p className="text-[9px] text-[#f7931a]/60 mb-0.5">Total Hash</p>
                <p className="text-xs font-display font-bold text-[#f7931a]">
                  {getHashrateDisplay(totalHashPower)}
                </p>
              </div>
              <div className="p-2 bg-emerald-500/5 rounded">
                <p className="text-[9px] text-emerald-500/60 mb-0.5">Active Rate</p>
                <p className="text-xs font-display font-bold text-emerald-500">
                  {activeRate.toFixed(0)}%
                </p>
              </div>
              <div className="p-2 bg-purple-500/5 rounded">
                <p className="text-[9px] text-purple-500/60 mb-0.5">Avg Hash</p>
                <p className="text-xs font-display font-bold text-purple-500">
                  {activeMiners.length + inactiveMiners.length > 0 
                    ? getHashrateDisplay(totalHashPower / (activeMiners.length + inactiveMiners.length))
                    : '0 GH/s'}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}