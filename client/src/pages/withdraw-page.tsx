import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock } from "lucide-react";

export default function WithdrawPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [cooldownEndTime, setCooldownEndTime] = useState<number | null>(null);
  
  const usdtBalance = parseFloat(user?.usdtBalance || '0');
  const withdrawFee = 1; // 1 USDT flat fee
  const maxWithdraw = Math.max(0, usdtBalance - withdrawFee);

  // Check cooldown status
  const { data: cooldownData, refetch: refetchCooldown } = useQuery({
    queryKey: ['/api/withdrawals/cooldown'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/withdrawals/cooldown');
      const data = await res.json();
      // Calculate end time for countdown
      if (!data.canWithdraw && data.hoursRemaining > 0) {
        const endTime = Date.now() + (data.hoursRemaining * 60 * 60 * 1000);
        setCooldownEndTime(endTime);
      } else {
        setCooldownEndTime(null);
      }
      return data;
    },
    staleTime: 60000 // Consider data fresh for 1 minute
  });

  // Update countdown timer with seconds precision
  useEffect(() => {
    if (cooldownEndTime && cooldownEndTime > Date.now()) {
      const updateTimer = () => {
        const remaining = cooldownEndTime - Date.now();
        
        if (remaining <= 0) {
          setTimeRemaining('');
          setCooldownEndTime(null);
          refetchCooldown();
          return;
        }
        
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        
        if (hours > 0) {
          setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setTimeRemaining(`${minutes}m ${seconds}s`);
        } else {
          setTimeRemaining(`${seconds}s`);
        }
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 1000); // Update every second
      
      return () => clearInterval(interval);
    } else {
      setTimeRemaining('');
    }
  }, [cooldownEndTime, refetchCooldown]);

  const createWithdrawalMutation = useMutation({
    mutationFn: async (data: { amount: string; address: string }) => {
      const res = await apiRequest("POST", "/api/withdrawals", { ...data, network: 'ERC20' });
      return res.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Withdrawal Requested!", 
        description: "Your withdrawal is pending system verification" 
      });
      setAmount('');
      setAddress('');
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals"] });
      refetchCooldown(); // Refresh cooldown status after successful withdrawal
    },
    onError: (error: Error) => {
      toast({ 
        title: "Request Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const handleWithdraw = () => {
    const withdrawAmount = parseFloat(amount);
    
    if (!amount || !address) {
      toast({ 
        title: "Missing Information", 
        description: "Please enter amount and address", 
        variant: "destructive" 
      });
      return;
    }
    
    if (withdrawAmount > maxWithdraw) {
      toast({ 
        title: "Insufficient Balance", 
        description: "Amount exceeds available balance", 
        variant: "destructive" 
      });
      return;
    }
    
    createWithdrawalMutation.mutate({
      amount: withdrawAmount.toString(), // Send as string
      address
    });
  };

  // Query pending withdrawals
  const { data: pendingWithdrawals } = useQuery<any[]>({
    queryKey: ["/api/withdrawals/pending"]
  });

  return (
    <div className="mobile-page">
      {/* Header */}
      <div className="mobile-header">
        <div>
          <h1 className="text-lg font-display font-bold text-primary">WITHDRAW USDT</h1>
          <p className="text-xs text-muted-foreground font-mono">Fee: {withdrawFee} USDT</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground font-mono">AVAILABLE</p>
          <p className="text-sm font-display font-bold text-accent">
            ${usdtBalance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mobile-content">
        {/* Balance Overview */}
        <Card className="mobile-card bg-gradient-to-br from-accent/10 to-chart-3/10">
          <div>
            <p className="text-xs text-muted-foreground font-mono mb-1">USDT BALANCE</p>
            <p className="text-3xl font-display font-black text-accent">
              ${usdtBalance.toFixed(2)}
            </p>
          </div>
        </Card>

        {/* Withdrawal Form */}
        <Card className="mobile-card">
          <p className="text-sm font-mono text-muted-foreground mb-3">WITHDRAWAL REQUEST</p>
          
          <div className="space-y-3">
            {/* ERC20 Address Input */}
            <div>
              <label className="text-xs text-muted-foreground font-mono mb-1 block">
                ERC20 ADDRESS *
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your ERC20 wallet address"
                className="font-mono text-xs"
                data-testid="input-withdraw-address"
              />
            </div>

            {/* Amount Input */}
            <div>
              <label className="text-xs text-muted-foreground font-mono mb-1 block">
                AMOUNT (USDT) *
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="10"
                max={maxWithdraw}
                step="0.01"
                data-testid="input-withdraw-amount"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Min: 50 USDT | Max: {maxWithdraw.toFixed(2)} USDT
              </p>
            </div>

            {/* Fee Display */}
            <div className="p-3 bg-background rounded-lg">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Withdrawal Amount</span>
                <span>{amount || '0.00'} USDT</span>
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className="text-muted-foreground">Network Fee</span>
                <span>{withdrawFee} USDT</span>
              </div>
              <div className="h-px bg-border my-2"></div>
              <div className="flex justify-between text-sm font-bold">
                <span>You will receive</span>
                <span className="text-primary">
                  {amount ? Math.max(0, parseFloat(amount) - withdrawFee).toFixed(2) : '0.00'} USDT
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Simple Notice */}
        <div className="text-xs text-muted-foreground text-center">
          <p>• Minimum: 50 USDT • Fee: {withdrawFee} USDT</p>
        </div>

        {/* Submit Button with Timer */}
        <Button
          onClick={handleWithdraw}
          disabled={createWithdrawalMutation.isPending || !amount || !address || parseFloat(amount) > maxWithdraw || (cooldownData && !cooldownData.canWithdraw)}
          className={`mobile-btn-primary text-lg ${cooldownData && !cooldownData.canWithdraw ? 'bg-orange-900/50 hover:bg-orange-900/50 border-orange-500/30 cursor-not-allowed' : ''}`}
          data-testid="button-submit-withdrawal"
        >
          {createWithdrawalMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Processing...
            </>
          ) : cooldownData && !cooldownData.canWithdraw && timeRemaining ? (
            <>
              <Clock className="w-5 h-5 mr-2 text-orange-500" />
              <span className="text-orange-500 font-semibold">Cooldown: {timeRemaining}</span>
            </>
          ) : (
            <>
              <i className="fas fa-money-bill-wave mr-3"></i>
              REQUEST WITHDRAWAL
            </>
          )}
        </Button>

        {/* Pending Withdrawals */}
        {pendingWithdrawals && pendingWithdrawals.length > 0 && (
          <Card className="mobile-card">
            <p className="text-sm font-mono text-muted-foreground mb-3">PENDING WITHDRAWALS</p>
            <div className="space-y-2">
              {pendingWithdrawals.map((withdrawal: any) => (
                <div key={withdrawal.id} className="p-2 bg-background rounded-lg">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-mono">{withdrawal.amount} USDT</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-muted-foreground">Status</span>
                    <span className="text-yellow-500">Pending</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}