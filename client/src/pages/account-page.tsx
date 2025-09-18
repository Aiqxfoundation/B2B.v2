import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Copy, LogOut, Users, Activity } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function AccountPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [showReferralsDialog, setShowReferralsDialog] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  // Fetch referral data
  const { data: referralData } = useQuery<{
    referralCode: string;
    totalReferrals: number;
    activeReferrals: number;
    totalEarnings: string;
    referrals: Array<{
      id: string;
      username: string;
      joinedAt: string;
      status: 'mining' | 'inactive';
      hashPower: string;
      earned: string;
    }>;
  }>({
    queryKey: ["/api/referrals"],
    enabled: !!user,
  });

  // Change PIN mutation
  const changePinMutation = useMutation({
    mutationFn: async (data: { currentPin: string; newPin: string }) => {
      const res = await apiRequest("POST", "/api/change-pin", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ 
        title: "PIN Updated", 
        description: "Your security PIN has been changed" 
      });
      setShowPinDialog(false);
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Update Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const handlePinChange = () => {
    if (!currentPin || !newPin || !confirmPin) {
      toast({ 
        title: "Invalid Input", 
        description: "Please fill all fields", 
        variant: "destructive" 
      });
      return;
    }

    if (newPin !== confirmPin) {
      toast({ 
        title: "PIN Mismatch", 
        description: "New PIN and confirmation don't match", 
        variant: "destructive" 
      });
      return;
    }

    if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      toast({ 
        title: "Invalid PIN", 
        description: "PIN must be exactly 6 digits", 
        variant: "destructive" 
      });
      return;
    }

    changePinMutation.mutate({ currentPin, newPin });
  };

  const copyReferralCode = () => {
    if (referralData?.referralCode) {
      navigator.clipboard.writeText(referralData.referralCode);
      toast({ 
        title: "Copied", 
        description: "Referral code copied" 
      });
    }
  };

  return (
    <div className="mobile-page">
      {/* Header */}
      <div className="mobile-header">
        <h1 className="text-lg font-display font-bold text-primary">ACCOUNT</h1>
      </div>

      {/* Content */}
      <div className="mobile-content">
        {/* User Info */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-3">
            <span className="text-2xl font-display font-bold text-primary">
              {user?.username?.[0]?.toUpperCase()}
            </span>
          </div>
          <p className="text-xl font-display font-bold">@{user?.username}</p>
          {user?.isAdmin && (
            <p className="text-xs text-yellow-500 mt-1">ADMIN</p>
          )}
        </div>

        {/* Referral Code Card */}
        <Card className="mobile-card bg-gradient-to-br from-primary/5 to-transparent mb-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-2">YOUR REFERRAL CODE</p>
            
            {/* Referral Code */}
            <div className="inline-flex items-center gap-2 bg-background rounded-lg px-4 py-2 border border-primary/20 mb-3">
              <span className="font-mono text-base font-bold text-primary">
                {referralData?.referralCode || '------'}
              </span>
              <button
                onClick={copyReferralCode}
                className="text-primary hover:text-primary/80 transition-colors"
                data-testid="button-copy-code"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>

            {/* Stats Row */}
            <div className="flex justify-around text-xs">
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="font-bold text-base">{referralData?.totalReferrals || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Active</p>
                <p className="font-bold text-base text-primary">{referralData?.activeReferrals || 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Earned</p>
                <p className="font-bold text-base text-accent">${referralData?.totalEarnings || '0'}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Options */}
        <div className="space-y-3">
          {/* View Referrals */}
          <Card 
            className="mobile-card cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setShowReferralsDialog(true)}
            data-testid="button-view-referrals"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold">My Referrals</p>
                  <p className="text-xs text-muted-foreground">View referred users</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">›</span>
            </div>
          </Card>

          {/* Security PIN */}
          <Card 
            className="mobile-card cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setShowPinDialog(true)}
            data-testid="button-change-pin"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-semibold">Security PIN</p>
                  <p className="text-xs text-muted-foreground">Change your 6-digit PIN</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">›</span>
            </div>
          </Card>

          {/* Logout */}
          <Card 
            className="mobile-card cursor-pointer hover:border-destructive/50 transition-colors"
            onClick={() => logoutMutation.mutate()}
            data-testid="button-logout"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-destructive" />
              <p className="font-semibold text-destructive">Sign Out</p>
            </div>
          </Card>
        </div>
      </div>

      {/* Referrals Dialog */}
      <Dialog open={showReferralsDialog} onOpenChange={setShowReferralsDialog}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>My Referrals</DialogTitle>
            <DialogDescription>
              Users who joined using your referral code
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            {referralData?.referrals && referralData.referrals.length > 0 ? (
              referralData.referrals.map(ref => (
                <div key={ref.id} className="p-3 bg-background rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">@{ref.username}</p>
                    <Badge 
                      variant={ref.status === 'mining' ? 'default' : 'secondary'}
                      className={ref.status === 'mining' ? 'bg-primary/20 text-primary' : ''}
                    >
                      {ref.status === 'mining' ? (
                        <>
                          <Activity className="w-3 h-3 mr-1" />
                          Mining
                        </>
                      ) : (
                        'Inactive'
                      )}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Joined: {new Date(ref.joinedAt).toLocaleDateString()}</p>
                    {ref.status === 'mining' && (
                      <p>Hash Power: {ref.hashPower} TH/s</p>
                    )}
                    <p>Commission Earned: ${ref.earned}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No referrals yet</p>
                <p className="text-xs mt-2">Share your code to earn commissions</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Change PIN Dialog */}
      <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Security PIN</DialogTitle>
            <DialogDescription>
              Update your 6-digit security PIN
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="current-pin">Current PIN</Label>
              <Input
                id="current-pin"
                type="password"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="Enter current PIN"
                maxLength={6}
                data-testid="input-current-pin"
              />
            </div>
            <div>
              <Label htmlFor="new-pin">New PIN</Label>
              <Input
                id="new-pin"
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Enter new 6-digit PIN"
                maxLength={6}
                data-testid="input-new-pin"
              />
            </div>
            <div>
              <Label htmlFor="confirm-pin">Confirm New PIN</Label>
              <Input
                id="confirm-pin"
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Confirm new PIN"
                maxLength={6}
                data-testid="input-confirm-pin"
              />
            </div>
            <Button
              onClick={handlePinChange}
              disabled={changePinMutation.isPending}
              className="w-full"
              data-testid="button-confirm-pin-change"
            >
              {changePinMutation.isPending ? 'Updating...' : 'Update PIN'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}