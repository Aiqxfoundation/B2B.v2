import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Loader2, Cpu, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function PurchasePowerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [amount, setAmount] = useState("");
  
  const usdtBalance = parseFloat(user?.usdtBalance || '0');
  const currentHashPower = parseFloat(user?.hashPower || '0');
  const selectedAmount = parseFloat(amount) || 0;

  const purchasePowerMutation = useMutation({
    mutationFn: async (amount: number) => {
      const res = await apiRequest("POST", "/api/purchase-power", { amount });
      return res.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Hash Power Purchased", 
        description: `Added ${selectedAmount} GH/s to your GBTC mining power` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/global-stats"] });
      setLocation("/mining");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Purchase Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const handlePurchase = () => {
    if (selectedAmount > usdtBalance) {
      toast({ 
        title: "Insufficient Balance", 
        description: `You need ${selectedAmount} USDT but only have ${usdtBalance.toFixed(2)} USDT`, 
        variant: "destructive" 
      });
      return;
    }
    if (selectedAmount < 1) {
      toast({ 
        title: "Invalid Amount", 
        description: "Minimum purchase is 1 USDT", 
        variant: "destructive" 
      });
      return;
    }
    purchasePowerMutation.mutate(selectedAmount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-orange-950/30 to-black p-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Hashrate Header - Matches Navigation Design */}
        <div className="text-center mb-8">
          <motion.div 
            className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full"
            animate={{
              scale: [1, 1.05, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              background: `radial-gradient(ellipse at center, 
                hsl(30, 100%, 50%, 0.1) 0%, 
                transparent 70%)`
            }}
          >
            <motion.i 
              className="fas fa-microchip text-4xl text-chart-4"
              animate={{
                filter: [
                  "drop-shadow(0 0 8px hsl(30, 100%, 50%, 0.6))",
                  "drop-shadow(0 0 16px hsl(30, 100%, 50%, 0.8))",
                  "drop-shadow(0 0 8px hsl(30, 100%, 50%, 0.6))"
                ]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-500 to-orange-600 mb-3">
            Purchase Hash Power
          </h1>
          <p className="text-orange-200/80 text-lg">
            Buy mining power to earn <span className="text-orange-400 font-semibold">GBTC</span> rewards
          </p>
        </div>

        {/* Bitcoin Balance Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <Card className="mb-6 bg-gradient-to-r from-orange-950/60 to-yellow-950/40 border-orange-500/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-3 text-orange-200">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                  <Cpu className="w-6 h-6 text-orange-400" />
                </motion.div>
                Account Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-orange-200/70 font-medium">Available Balance:</span>
                <span className="font-mono font-bold text-orange-300 text-lg">${usdtBalance.toFixed(2)} USDT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-orange-200/70 font-medium">Current Hash Power:</span>
                <span className="font-mono font-bold text-yellow-400 text-lg">{currentHashPower.toFixed(0)} GH/s</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bitcoin Purchase Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <Card className="mb-6 bg-gradient-to-r from-orange-950/60 to-yellow-950/40 border-orange-500/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-orange-200 flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-400" />
                Purchase Mining Power
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              
              {/* Amount Input */}
              <div className="space-y-4">
                <label className="text-lg font-semibold text-orange-200">
                  Purchase Amount (USDT)
                </label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="h-14 text-lg font-mono bg-gradient-to-r from-orange-950/60 to-yellow-950/40 border-2 border-orange-500/60 text-orange-200 focus:border-orange-300 focus:ring-2 focus:ring-orange-400/30 rounded-xl backdrop-blur-sm"
                  min={1}
                  max={Math.floor(usdtBalance)}
                  data-testid="input-amount"
                />
                <motion.p 
                  className="text-orange-300/80 font-medium flex items-center gap-2"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Zap className="w-4 h-4" />
                  Exchange rate: 1 USDT = 1 GH/s
                </motion.p>
              </div>

              {/* Bitcoin Hash Power Preview */}
              {selectedAmount > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: "backOut" }}
                >
                  <Card className="bg-gradient-to-r from-yellow-950/40 to-orange-950/40 border-2 border-orange-400/60 relative overflow-hidden">
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-yellow-500/20 to-orange-500/10"
                      animate={{ 
                        background: [
                          "linear-gradient(90deg, rgba(251,146,60,0.1), rgba(234,179,8,0.2), rgba(251,146,60,0.1))",
                          "linear-gradient(90deg, rgba(234,179,8,0.1), rgba(251,146,60,0.2), rgba(234,179,8,0.1))",
                          "linear-gradient(90deg, rgba(251,146,60,0.1), rgba(234,179,8,0.2), rgba(251,146,60,0.1))"
                        ]
                      }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <CardContent className="pt-6 relative z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <motion.div
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <Zap className="w-6 h-6 text-yellow-400" />
                          </motion.div>
                          <span className="font-semibold text-orange-200 text-lg">Mining Power to Receive:</span>
                        </div>
                        <motion.span 
                          className="text-3xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-yellow-400"
                          animate={{ 
                            textShadow: [
                              "0 0 10px rgba(251, 146, 60, 0.3)",
                              "0 0 20px rgba(251, 146, 60, 0.6)",
                              "0 0 10px rgba(251, 146, 60, 0.3)"
                            ]
                          }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          {selectedAmount.toLocaleString()} GH/s
                        </motion.span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Bitcoin Purchase Button */}
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  onClick={handlePurchase}
                  disabled={purchasePowerMutation.isPending || selectedAmount > usdtBalance || selectedAmount < 1}
                  className="w-full h-16 bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-600 hover:from-orange-600 hover:via-yellow-600 hover:to-orange-700 text-black font-bold text-lg rounded-xl relative overflow-hidden"
                  data-testid="button-purchase"
                >
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
                  />
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    {purchasePowerMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="font-bold">Processing...</span>
                      </>
                    ) : selectedAmount > 0 ? (
                      <>
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Zap className="w-5 h-5" />
                        </motion.div>
                        <span className="font-bold">Purchase {selectedAmount} GH/s</span>
                      </>
                    ) : (
                      <span className="font-bold">Select Amount to Purchase</span>
                    )}
                  </div>
                </Button>
              </motion.div>

              {/* Error Display */}
              {selectedAmount > usdtBalance && (
                <motion.div 
                  className="text-red-300 text-sm text-center p-4 bg-red-950/40 border border-red-500/50 rounded-xl"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  Insufficient balance. You need ${(selectedAmount - usdtBalance).toFixed(2)} more USDT.
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Bitcoin Mining Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <Card className="bg-gradient-to-r from-orange-950/60 to-yellow-950/40 border-orange-500/40 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-orange-200 flex items-center gap-2">
                <Cpu className="w-6 h-6 text-orange-400" />
                Mining Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div 
                className="mb-6 p-4 bg-gradient-to-r from-orange-950/60 to-yellow-950/60 border border-orange-400/30 rounded-xl"
                animate={{
                  boxShadow: [
                    "0 0 0 rgba(251, 146, 60, 0)",
                    "0 0 15px rgba(251, 146, 60, 0.3)",
                    "0 0 0 rgba(251, 146, 60, 0)"
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <p className="text-sm font-mono text-center text-orange-300 font-semibold">
                  Mining Rewards = (Your Hash Power ÷ Network Hash Power) × Block Reward
                </p>
              </motion.div>
              
              <div className="space-y-4 text-sm text-orange-200/80">
                <p>• <span className="font-semibold text-orange-300">Distributed Hash Power:</span> Purchase computational power directly with USDT to begin mining immediately</p>
                <p>• <span className="font-semibold text-orange-300">Proportional Rewards:</span> Your hash power determines your share of block rewards with real-time adjustments</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}