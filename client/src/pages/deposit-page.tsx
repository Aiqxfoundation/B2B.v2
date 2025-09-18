import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock } from "lucide-react";

const networkAddresses = {
  BEP20: '0xc1de03ab9892b9eb1deed8a2dd453b7fcefea9e9',
  ERC20: '0xc1de03ab9892b9eb1deed8a2dd453b7fcefea9e9'
};

export default function DepositPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedNetwork, setSelectedNetwork] = useState<string>('BEP20');
  const [txid, setTxid] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Check cooldown status
  const { data: cooldownData, refetch: refetchCooldown } = useQuery({
    queryKey: ['/api/deposits/cooldown'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/deposits/cooldown');
      return res.json();
    },
    staleTime: 60000 // Consider data fresh for 1 minute
  });

  // Update countdown timer
  useEffect(() => {
    if (cooldownData && !cooldownData.canDeposit && cooldownData.hoursRemaining > 0) {
      const updateTimer = () => {
        const hours = Math.floor(cooldownData.hoursRemaining);
        const minutes = Math.floor((cooldownData.hoursRemaining % 1) * 60);
        
        if (hours > 0) {
          setTimeRemaining(`${hours}h ${minutes}m`);
        } else if (minutes > 0) {
          setTimeRemaining(`${minutes}m`);
        } else {
          setTimeRemaining('Almost ready...');
          refetchCooldown();
        }
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 60000); // Update every minute
      
      return () => clearInterval(interval);
    } else {
      setTimeRemaining('');
    }
  }, [cooldownData, refetchCooldown]);

  const submitDepositMutation = useMutation({
    mutationFn: async (data: { txHash: string; amount: string; network: string; note?: string }) => {
      const res = await apiRequest("POST", "/api/deposits", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ 
        title: "Deposit Submitted!", 
        description: "Your deposit is pending system verification" 
      });
      setTxid('');
      setAmount('');
      setNote('');
      queryClient.invalidateQueries({ queryKey: ["/api/deposits"] });
      refetchCooldown(); // Refresh cooldown status after successful deposit
    },
    onError: (error: Error) => {
      toast({ 
        title: "Submission Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(networkAddresses[selectedNetwork as keyof typeof networkAddresses]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ 
      title: "Address Copied!", 
      description: "Deposit address copied to clipboard" 
    });
  };

  const handleSubmit = () => {
    if (!txid || !amount) {
      toast({ 
        title: "Missing Information", 
        description: "Please enter TXID and amount", 
        variant: "destructive" 
      });
      return;
    }
    
    submitDepositMutation.mutate({
      txHash: txid,
      amount: amount,
      network: selectedNetwork,
      note
    });
  };

  return (
    <div className="mobile-page">
      {/* Header */}
      <div className="mobile-header">
        <div>
          <h1 className="text-lg font-display font-bold text-primary">DEPOSIT USDT</h1>
          <p className="text-xs text-muted-foreground font-mono">Min deposit: 50 USDT</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground font-mono">BALANCE</p>
          <p className="text-sm font-display font-bold text-accent">
            ${parseFloat(user?.usdtBalance || '0').toFixed(2)}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="mobile-content">
        {/* Cooldown Warning */}
        {cooldownData && !cooldownData.canDeposit && (
          <Card className="mobile-card bg-warning/10 border-warning/30 mb-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-warning" />
              <div className="flex-1">
                <p className="text-sm font-bold text-warning mb-1">Cooldown Active</p>
                <p className="text-xs text-warning/80">
                  You can make another deposit request in {timeRemaining}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Please wait for the cooldown period to end before submitting a new deposit.
                </p>
              </div>
            </div>
          </Card>
        )}
        {/* Network Selection */}
        <Card className="mobile-card">
          <p className="text-sm font-mono text-muted-foreground mb-3">SELECT NETWORK FOR USDT DEPOSIT</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(networkAddresses).map((network) => (
              <button
                key={network}
                onClick={() => setSelectedNetwork(network)}
                className={`p-3 rounded-lg border transition-all ${
                  selectedNetwork === network 
                    ? 'border-primary bg-primary/10 glow-green' 
                    : 'border-border hover:border-primary/50'
                }`}
                data-testid={`network-${network.toLowerCase()}`}
              >
                <p className="font-display font-bold text-sm">
                  {network}
                </p>
                <p className="text-xs text-muted-foreground">
                  {network === 'BEP20' ? 'Binance Smart Chain' : 'Ethereum Network'}
                </p>
              </button>
            ))}
          </div>
        </Card>

        {/* Deposit Address */}
        <Card className="mobile-card bg-gradient-to-br from-primary/10 to-chart-4/10">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-mono text-muted-foreground">SEND USDT TO THIS ADDRESS</p>
            <div className={`w-3 h-3 rounded-full mining-pulse bg-primary glow-green`}></div>
          </div>
          
          <div className="bg-black/40 rounded-lg p-2 mb-2">
            <p className="text-xs text-primary font-bold mb-1">
              {selectedNetwork} Network {selectedNetwork === 'BEP20' ? '(BSC)' : '(Ethereum)'}
            </p>
          </div>
          
          <div className="bg-background rounded-lg p-3 mb-3">
            <p className="text-xs font-mono break-all text-foreground">
              {networkAddresses[selectedNetwork as keyof typeof networkAddresses]}
            </p>
          </div>

          <Button
            onClick={handleCopyAddress}
            className="w-full"
            variant="outline"
            data-testid="button-copy-address"
          >
            <i className={`fas fa-${copied ? 'check' : 'copy'} mr-2`}></i>
            {copied ? 'Copied!' : 'Copy Address'}
          </Button>
          
          <p className="text-xs text-yellow-500 mt-3 text-center">
            ⚠️ Only send USDT on {selectedNetwork} network to this address
          </p>
        </Card>

        {/* TXID Submission Form */}
        <Card className="mobile-card">
          <p className="text-sm font-mono text-muted-foreground mb-3">SUBMIT TRANSACTION</p>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground font-mono mb-1 block">
                TRANSACTION ID (TXID) *
              </label>
              <Input
                value={txid}
                onChange={(e) => setTxid(e.target.value)}
                placeholder="Enter transaction hash"
                className="font-mono text-xs"
                data-testid="input-txid"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-mono mb-1 block">
                AMOUNT (USDT) *
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="50"
                step="0.01"
                data-testid="input-amount"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground font-mono mb-1 block">
                NOTE (Optional)
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Additional information"
                className="min-h-[60px] text-xs"
                data-testid="input-note"
              />
            </div>
          </div>
        </Card>

        {/* Warning */}
        <Card className="mobile-card bg-destructive/10 border-destructive/30">
          <div className="flex items-start space-x-3">
            <i className="fas fa-exclamation-triangle text-destructive mt-1"></i>
            <div className="text-xs text-destructive">
              <p className="font-bold mb-1">⚠️ WARNING</p>
              <p>Fake TXID will lead to account freeze/block. Only submit real transactions sent to the address above.</p>
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={submitDepositMutation.isPending || !txid || !amount || (cooldownData && !cooldownData.canDeposit)}
          className="mobile-btn-primary text-lg"
          data-testid="button-submit-deposit"
        >
          {submitDepositMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane mr-3"></i>
              SUBMIT DEPOSIT
            </>
          )}
        </Button>

        {/* Instructions */}
        <Card className="mobile-card">
          <p className="text-sm font-mono text-muted-foreground mb-3">HOW TO DEPOSIT</p>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start">
              <span className="mr-2">1.</span>
              <p>Select your preferred network above</p>
            </div>
            <div className="flex items-start">
              <span className="mr-2">2.</span>
              <p>Send USDT to the displayed address</p>
            </div>
            <div className="flex items-start">
              <span className="mr-2">3.</span>
              <p>Wait for transaction confirmation</p>
            </div>
            <div className="flex items-start">
              <span className="mr-2">4.</span>
              <p>Submit the TXID and amount here</p>
            </div>
            <div className="flex items-start">
              <span className="mr-2">5.</span>
              <p>System will verify and approve</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}