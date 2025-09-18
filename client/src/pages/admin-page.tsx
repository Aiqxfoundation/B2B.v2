import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Check, Shield, Users, Settings, DollarSign, Activity, ArrowDown, ArrowUp, User, Ban, CheckCircle, XCircle, Wallet, Hash, Edit2, AlertCircle, TrendingUp, ArrowLeft, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SiEthereum, SiTether } from "react-icons/si";

export default function AdminPage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<'overview' | 'deposits' | 'withdrawals' | 'users' | 'mining' | 'addresses'>('overview');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [editingDeposit, setEditingDeposit] = useState<any>(null);
  const [editingWithdrawal, setEditingWithdrawal] = useState<any>(null);
  const [actualAmount, setActualAmount] = useState("");
  const [txHashInput, setTxHashInput] = useState("");
  const [blockRewardInput, setBlockRewardInput] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userBalanceEdit, setUserBalanceEdit] = useState({ usdt: "", eth: "", gbtc: "", hashPower: "" });
  const [usdtAddress, setUsdtAddress] = useState("");
  const [ethAddress, setEthAddress] = useState("");
  const [btcAddress, setBtcAddress] = useState("");
  const [addressEditMode, setAddressEditMode] = useState<'usdt' | 'eth' | 'btc' | null>(null);
  
  const handleCopyHash = (hash: string, depositId: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(depositId);
    setTimeout(() => setCopiedHash(null), 500);
    toast({ title: "Copied!", description: "Transaction hash copied" });
  };

  const { data: pendingDeposits = [], isLoading: depositsLoading } = useQuery<any[]>({
    queryKey: ["/api/deposits/pending"],
    enabled: !!user?.isAdmin
  });

  const { data: pendingWithdrawals = [], isLoading: withdrawalsLoading } = useQuery<any[]>({
    queryKey: ["/api/withdrawals/pending"],
    enabled: !!user?.isAdmin
  });

  const { data: adminStats = { userCount: 0, totalDeposits: "0", totalWithdrawals: "0", totalHashPower: "0" } } = useQuery<{
    userCount: number;
    totalDeposits: string;
    totalWithdrawals: string;
    totalHashPower: string;
  }>({
    queryKey: ["/api/admin/stats"],
    enabled: !!user?.isAdmin
  });

  const { data: allUsers = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    enabled: !!user?.isAdmin
  });

  const { data: blockRewardSetting = { value: "50" } } = useQuery<{ value: string }>({
    queryKey: ["/api/settings/blockReward"],
    enabled: !!user?.isAdmin
  });

  const { data: globalAddresses = { usdt: '', eth: '', btc: '' } } = useQuery<{ usdt: string; eth: string; btc: string }>({
    queryKey: ["/api/admin/deposit-addresses"],
    enabled: !!user?.isAdmin
  });

  // Separate deposits by currency
  const usdtDeposits = pendingDeposits.filter(d => d.currency === 'USDT');
  const ethDeposits = pendingDeposits.filter(d => d.currency === 'ETH');

  const approveDepositMutation = useMutation({
    mutationFn: async ({ id, actualAmount }: { id: string; actualAmount: string }) => {
      const res = await apiRequest("PATCH", `/api/deposits/${id}/approve`, { actualAmount });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Approved", description: "Deposit approved successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/deposits/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setEditingDeposit(null);
      setActualAmount("");
    },
    onError: (error: Error) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    }
  });

  const rejectDepositMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await apiRequest("PATCH", `/api/deposits/${id}/reject`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Rejected", description: "Deposit rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/deposits/pending"] });
      setEditingDeposit(null);
    },
    onError: (error: Error) => {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    }
  });

  const freezeUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/freeze`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "User Frozen", variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    }
  });

  const unfreezeUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/unfreeze`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "User Unfrozen" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    }
  });

  const banUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/ban`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "User Banned", variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    }
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}/unban`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "User Unbanned" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    }
  });

  const updateUserBalanceMutation = useMutation({
    mutationFn: async ({ userId, balances }: { userId: string; balances: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}/balances`, balances);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Updated", description: "Balances updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUser(null);
      setUserBalanceEdit({ usdt: "", eth: "", gbtc: "", hashPower: "" });
    }
  });

  const approveWithdrawalMutation = useMutation({
    mutationFn: async ({ id, txHash }: { id: string; txHash?: string }) => {
      const res = await apiRequest("PATCH", `/api/withdrawals/${id}/approve`, { txHash });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Approved", description: "Withdrawal processed" });
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setEditingWithdrawal(null);
      setTxHashInput("");
    }
  });

  const rejectWithdrawalMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/withdrawals/${id}/reject`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Rejected", description: "Withdrawal rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawals/pending"] });
      setEditingWithdrawal(null);
    }
  });

  const updateBlockRewardMutation = useMutation({
    mutationFn: async (newReward: string) => {
      const res = await apiRequest("POST", "/api/settings", { key: "blockReward", value: newReward });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Updated", description: "Block reward updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/blockReward"] });
      setBlockRewardInput("");
    }
  });

  const halveRewardMutation = useMutation({
    mutationFn: async () => {
      const currentReward = parseFloat(blockRewardSetting?.value || "50");
      const newReward = (currentReward / 2).toString();
      const res = await apiRequest("POST", "/api/settings", { key: "blockReward", value: newReward });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Halved", description: "Block reward halved" });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/blockReward"] });
    }
  });

  const updateGlobalAddressMutation = useMutation({
    mutationFn: async ({ currency, address }: { currency: 'USDT' | 'ETH' | 'BTC'; address: string }) => {
      const res = await apiRequest("POST", "/api/admin/deposit-address", { currency, address });
      return res.json();
    },
    onSuccess: (_, variables) => {
      toast({ title: "Updated", description: `${variables.currency} address updated` });
      // Invalidate all address queries across the app
      queryClient.invalidateQueries({ queryKey: ["/api/admin/deposit-addresses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deposit-addresses"] });
      setAddressEditMode(null);
      setUsdtAddress("");
      setEthAddress("");
      setBtcAddress("");
    }
  });

  if (!user?.isAdmin) {
    return (
      <div className="mobile-page bg-background">
        <div className="flex items-center justify-center min-h-screen px-4">
          <Card className="w-full max-w-sm p-6 text-center">
            <Shield className="w-12 h-12 text-destructive mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-2">Access Denied</h2>
            <p className="text-sm text-muted-foreground mb-4">Admin privileges required</p>
            <Link href="/dashboard">
              <Button size="sm" className="w-full">Return to Dashboard</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-page bg-background">
      {/* Header */}
      <div className="mobile-header">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setLocation("/dashboard")}
            size="sm"
            variant="ghost"
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold">Admin Panel</h1>
        </div>
        <Button
          onClick={() => logoutMutation.mutate()}
          size="sm"
          variant="destructive"
          data-testid="button-logout"
        >
          Logout
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3 bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Users</p>
                <p className="text-lg font-bold">{adminStats.userCount}</p>
              </div>
              <Users className="w-5 h-5 text-primary opacity-50" />
            </div>
          </Card>
          
          <Card className="p-3 bg-gradient-to-br from-green-500/5 to-green-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Deposits</p>
                <p className="text-lg font-bold text-green-500">
                  ${parseFloat(adminStats.totalDeposits).toFixed(0)}
                </p>
              </div>
              <ArrowDown className="w-5 h-5 text-green-500 opacity-50" />
            </div>
          </Card>
          
          <Card className="p-3 bg-gradient-to-br from-orange-500/5 to-orange-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Hash Power</p>
                <p className="text-lg font-bold text-orange-500">
                  {parseFloat(adminStats.totalHashPower).toFixed(0)} TH/s
                </p>
              </div>
              <Activity className="w-5 h-5 text-orange-500 opacity-50" />
            </div>
          </Card>
          
          <Card className="p-3 bg-gradient-to-br from-red-500/5 to-red-500/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Withdrawals</p>
                <p className="text-lg font-bold text-red-500">
                  ${parseFloat(adminStats.totalWithdrawals).toFixed(0)}
                </p>
              </div>
              <ArrowUp className="w-5 h-5 text-red-500 opacity-50" />
            </div>
          </Card>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 pb-2">
        <div className="flex gap-1 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'deposits', label: 'Deposits', icon: ArrowDown, count: pendingDeposits.length },
            { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUp, count: pendingWithdrawals.length },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'mining', label: 'Mining', icon: Hash },
            { id: 'addresses', label: 'Addresses', icon: Wallet }
          ].map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              className="whitespace-nowrap flex-shrink-0 relative"
            >
              <tab.icon className="w-3 h-3 mr-1" />
              {tab.label}
              {tab.count && tab.count > 0 && (
                <Badge className="ml-1 px-1 min-w-[18px] h-[18px] text-[10px]" variant="secondary">
                  {tab.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mobile-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <Card className="mobile-card">
            <div className="space-y-4">
              <div className="text-center py-4">
                <h2 className="text-2xl font-bold text-primary">Admin Dashboard</h2>
                <p className="text-sm text-muted-foreground mt-1">System Overview</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Pending Deposits</p>
                  <p className="text-xl font-bold text-yellow-500">{pendingDeposits.length}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Pending Withdrawals</p>
                  <p className="text-xl font-bold text-orange-500">{pendingWithdrawals.length}</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500/10 to-orange-500/5 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Current Block Reward</p>
                    <p className="text-xl font-bold text-orange-500">
                      {parseFloat(blockRewardSetting?.value || "50").toFixed(2)} B2B
                    </p>
                  </div>
                  <Hash className="w-8 h-8 text-orange-500 opacity-30" />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Deposits Tab */}
        {activeTab === 'deposits' && (
          <div className="space-y-3">
            {/* USDT Deposits */}
            <Card className="mobile-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <SiTether className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-semibold">USDT Deposits</span>
                </div>
                <Badge className="bg-green-500/10 text-green-500">
                  {usdtDeposits.length}
                </Badge>
              </div>
              
              {depositsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : usdtDeposits.length > 0 ? (
                <div className="space-y-2">
                  {usdtDeposits.map((deposit: any) => (
                    <div key={deposit.id} className="bg-muted/30 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-sm">{deposit.user.username}</p>
                          <p className="text-xs text-muted-foreground">{deposit.network}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          ${parseFloat(deposit.amount).toFixed(2)}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setEditingDeposit(deposit);
                            setActualAmount("");
                          }}
                          size="sm"
                          className="flex-1 h-7 text-xs"
                        >
                          Verify
                        </Button>
                        <Button
                          onClick={() => rejectDepositMutation.mutate({ id: deposit.id })}
                          size="sm"
                          variant="destructive"
                          className="h-7 px-2"
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No pending USDT deposits
                </p>
              )}
            </Card>

            {/* ETH Deposits */}
            <Card className="mobile-card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <SiEthereum className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold">ETH Deposits</span>
                </div>
                <Badge className="bg-blue-500/10 text-blue-500">
                  {ethDeposits.length}
                </Badge>
              </div>
              
              {depositsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : ethDeposits.length > 0 ? (
                <div className="space-y-2">
                  {ethDeposits.map((deposit: any) => (
                    <div key={deposit.id} className="bg-muted/30 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-sm">{deposit.user.username}</p>
                          <p className="text-xs text-muted-foreground">ETH Network</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {parseFloat(deposit.amount).toFixed(6)} ETH
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setEditingDeposit(deposit);
                            setActualAmount("");
                          }}
                          size="sm"
                          className="flex-1 h-7 text-xs"
                        >
                          Verify
                        </Button>
                        <Button
                          onClick={() => rejectDepositMutation.mutate({ id: deposit.id })}
                          size="sm"
                          variant="destructive"
                          className="h-7 px-2"
                        >
                          <XCircle className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">
                  No pending ETH deposits
                </p>
              )}
            </Card>
          </div>
        )}

        {/* Withdrawals Tab */}
        {activeTab === 'withdrawals' && (
          <Card className="mobile-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Pending Withdrawals</span>
              <Badge className="bg-red-500/10 text-red-500">
                {pendingWithdrawals.length}
              </Badge>
            </div>
            
            {withdrawalsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : pendingWithdrawals.length > 0 ? (
              <div className="space-y-2">
                {pendingWithdrawals.map((withdrawal: any) => (
                  <div key={withdrawal.id} className="bg-muted/30 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-sm">{withdrawal.user?.username}</p>
                        <p className="text-xs text-muted-foreground">{withdrawal.network}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {withdrawal.currency === 'ETH' ? 
                          `${parseFloat(withdrawal.amount).toFixed(6)} ETH` :
                          withdrawal.currency === 'B2B' ?
                          `${parseFloat(withdrawal.amount).toFixed(6)} B2B` :
                          `${parseFloat(withdrawal.amount).toFixed(2)} USDT`
                        }
                      </Badge>
                    </div>
                    <div className="bg-background/50 rounded p-1 mb-2">
                      <p className="text-xs font-mono truncate">{withdrawal.address}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          setEditingWithdrawal(withdrawal);
                          setTxHashInput("");
                        }}
                        size="sm"
                        className="flex-1 h-7 text-xs"
                      >
                        Process
                      </Button>
                      <Button
                        onClick={() => rejectWithdrawalMutation.mutate(withdrawal.id)}
                        size="sm"
                        variant="destructive"
                        className="h-7 px-2"
                      >
                        <XCircle className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                No pending withdrawals
              </p>
            )}
          </Card>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <Card className="mobile-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">User Management</span>
              <Badge>{allUsers.length}</Badge>
            </div>
            
            <div className="space-y-2">
              {allUsers.map((u: any) => (
                <div key={u.id} className="bg-muted/30 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{u.username}</p>
                        {u.isAdmin && <Badge className="text-xs h-4">Admin</Badge>}
                        {u.isFrozen && <Badge variant="outline" className="text-xs h-4 text-yellow-500">Frozen</Badge>}
                        {u.isBanned && <Badge variant="destructive" className="text-xs h-4">Banned</Badge>}
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 mt-1">
                        <p className="text-xs text-muted-foreground">
                          USDT: ${parseFloat(u.usdtBalance || "0").toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          ETH: {parseFloat(u.ethBalance || "0").toFixed(4)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          B2B: {parseFloat(u.gbtcBalance || "0").toFixed(4)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Hash: {parseFloat(u.hashPower || "0").toFixed(1)} TH/s
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => {
                        setSelectedUser(u);
                        setUserBalanceEdit({
                          usdt: u.usdtBalance || "",
                          eth: u.ethBalance || "",
                          gbtc: u.gbtcBalance || "",
                          hashPower: u.hashPower || ""
                        });
                      }}
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7 text-xs"
                    >
                      Edit
                    </Button>
                    {!u.isBanned ? (
                      <>
                        {u.isFrozen ? (
                          <Button
                            onClick={() => unfreezeUserMutation.mutate(u.id)}
                            size="sm"
                            variant="outline"
                            className="flex-1 h-7 text-xs text-green-500"
                          >
                            Unfreeze
                          </Button>
                        ) : (
                          <Button
                            onClick={() => freezeUserMutation.mutate(u.id)}
                            size="sm"
                            variant="outline"
                            className="flex-1 h-7 text-xs text-yellow-500"
                          >
                            Freeze
                          </Button>
                        )}
                        <Button
                          onClick={() => banUserMutation.mutate(u.id)}
                          size="sm"
                          variant="destructive"
                          className="h-7 px-2"
                        >
                          <Ban className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => unbanUserMutation.mutate(u.id)}
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-xs text-green-500"
                      >
                        Unban
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Mining Tab */}
        {activeTab === 'mining' && (
          <Card className="mobile-card">
            <div className="space-y-3">
              <div className="text-center py-3">
                <p className="text-xs text-muted-foreground">Current Block Reward</p>
                <p className="text-2xl font-bold text-orange-500">
                  {parseFloat(blockRewardSetting?.value || "50").toFixed(2)} B2B
                </p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs">Custom Reward</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="New reward"
                    value={blockRewardInput}
                    onChange={(e) => setBlockRewardInput(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button
                    onClick={() => {
                      if (blockRewardInput) {
                        updateBlockRewardMutation.mutate(blockRewardInput);
                      }
                    }}
                    size="sm"
                    disabled={!blockRewardInput || updateBlockRewardMutation.isPending}
                    className="h-8"
                  >
                    Update
                  </Button>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <Button
                  onClick={() => halveRewardMutation.mutate()}
                  className="w-full"
                  variant="destructive"
                  disabled={halveRewardMutation.isPending}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Execute Halving (50% Reduction)
                </Button>
                <p className="text-xs text-destructive/70 mt-2 text-center">
                  Warning: This permanently reduces mining rewards
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <Card className="mobile-card">
            <div className="space-y-3">
              {/* USDT Address */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">USDT Deposit Address</Label>
                  <Button
                    onClick={() => setAddressEditMode(addressEditMode === 'usdt' ? null : 'usdt')}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                </div>
                {addressEditMode === 'usdt' ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="New USDT address"
                      value={usdtAddress}
                      onChange={(e) => setUsdtAddress(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          if (usdtAddress) {
                            updateGlobalAddressMutation.mutate({ 
                              currency: 'USDT', 
                              address: usdtAddress 
                            });
                          }
                        }}
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        disabled={!usdtAddress}
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => {
                          setAddressEditMode(null);
                          setUsdtAddress("");
                        }}
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-xs font-mono break-all">
                      {globalAddresses?.usdt || 'TBGxYmP3tFrbKvJRvQcF9cENKixQeJdfQc'}
                    </p>
                  </div>
                )}
              </div>

              {/* ETH Address */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">ETH Deposit Address</Label>
                  <Button
                    onClick={() => setAddressEditMode(addressEditMode === 'eth' ? null : 'eth')}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                </div>
                {addressEditMode === 'eth' ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="New ETH address"
                      value={ethAddress}
                      onChange={(e) => setEthAddress(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          if (ethAddress) {
                            updateGlobalAddressMutation.mutate({ 
                              currency: 'ETH', 
                              address: ethAddress 
                            });
                          }
                        }}
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        disabled={!ethAddress}
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => {
                          setAddressEditMode(null);
                          setEthAddress("");
                        }}
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-xs font-mono break-all">
                      {globalAddresses?.eth || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'}
                    </p>
                  </div>
                )}
              </div>

              {/* BTC Address */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">BTC Deposit Address</Label>
                  <Button
                    onClick={() => setAddressEditMode(addressEditMode === 'btc' ? null : 'btc')}
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                </div>
                {addressEditMode === 'btc' ? (
                  <div className="space-y-2">
                    <Input
                      placeholder="New BTC address"
                      value={btcAddress}
                      onChange={(e) => setBtcAddress(e.target.value)}
                      className="h-8 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          if (btcAddress) {
                            updateGlobalAddressMutation.mutate({ 
                              currency: 'BTC', 
                              address: btcAddress 
                            });
                          }
                        }}
                        size="sm"
                        className="flex-1 h-7 text-xs"
                        disabled={!btcAddress}
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => {
                          setAddressEditMode(null);
                          setBtcAddress("");
                        }}
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-xs font-mono break-all">
                      {globalAddresses?.btc || 'bc1qy8zzqsarhp0s63txsfnn3q3nvuu0g83mv3hwrv'}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-3 h-3 text-yellow-500 mt-0.5" />
                  <p className="text-xs text-yellow-500">
                    Changing addresses affects all users immediately
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Deposit Verification Dialog */}
      <Dialog open={!!editingDeposit} onOpenChange={() => setEditingDeposit(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Verify Deposit</DialogTitle>
          </DialogHeader>
          {editingDeposit && (
            <div className="space-y-3">
              <div className="bg-muted rounded p-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">User:</span>
                  <span>{editingDeposit.user?.username}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Claimed:</span>
                  <span className="font-semibold text-destructive">
                    {editingDeposit.currency === 'ETH' ? 
                      `${parseFloat(editingDeposit.amount).toFixed(6)} ETH` : 
                      `$${parseFloat(editingDeposit.amount).toFixed(2)}`
                    }
                  </span>
                </div>
              </div>
              
              <div>
                <Label className="text-xs">TX Hash</Label>
                <div className="bg-muted p-2 rounded mt-1">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-mono truncate flex-1">{editingDeposit.txHash}</p>
                    <Button
                      onClick={() => handleCopyHash(editingDeposit.txHash, editingDeposit.id)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                    >
                      {copiedHash === editingDeposit.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-xs">Verified Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={editingDeposit.currency === 'ETH' ? "ETH amount" : "USD amount"}
                  value={actualAmount}
                  onChange={(e) => setActualAmount(e.target.value)}
                  className="h-8 text-sm mt-1"
                />
              </div>
              
              <DialogFooter className="gap-2">
                <Button
                  onClick={() => setEditingDeposit(null)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (actualAmount) {
                      approveDepositMutation.mutate({ 
                        id: editingDeposit.id, 
                        actualAmount 
                      });
                    }
                  }}
                  disabled={!actualAmount || approveDepositMutation.isPending}
                  size="sm"
                  className="flex-1"
                >
                  Approve
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Withdrawal Processing Dialog */}
      <Dialog open={!!editingWithdrawal} onOpenChange={() => setEditingWithdrawal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Process Withdrawal</DialogTitle>
          </DialogHeader>
          {editingWithdrawal && (
            <div className="space-y-3">
              <div className="bg-muted rounded p-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">User:</span>
                  <span>{editingWithdrawal.user?.username}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-semibold">
                    {editingWithdrawal.currency === 'ETH' ? 
                      `${parseFloat(editingWithdrawal.amount).toFixed(6)} ETH` :
                      editingWithdrawal.currency === 'B2B' ?
                      `${parseFloat(editingWithdrawal.amount).toFixed(6)} B2B` :
                      `${parseFloat(editingWithdrawal.amount).toFixed(2)} USDT`
                    }
                  </span>
                </div>
              </div>
              
              <div>
                <Label className="text-xs">Destination Address</Label>
                <div className="bg-muted p-2 rounded mt-1 text-xs font-mono break-all">
                  {editingWithdrawal.address}
                </div>
              </div>
              
              <div>
                <Label className="text-xs">TX Hash (Optional)</Label>
                <Input
                  placeholder="Transaction hash"
                  value={txHashInput}
                  onChange={(e) => setTxHashInput(e.target.value)}
                  className="h-8 text-sm mt-1"
                />
              </div>
              
              <DialogFooter className="gap-2">
                <Button
                  onClick={() => setEditingWithdrawal(null)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    approveWithdrawalMutation.mutate({ 
                      id: editingWithdrawal.id, 
                      txHash: txHashInput || undefined
                    });
                  }}
                  disabled={approveWithdrawalMutation.isPending}
                  size="sm"
                  className="flex-1"
                >
                  Complete
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* User Balance Edit Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Edit {selectedUser?.username} Balances</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">USDT Balance</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={userBalanceEdit.usdt}
                  onChange={(e) => setUserBalanceEdit(prev => ({ ...prev, usdt: e.target.value }))}
                  className="h-8 text-sm mt-1"
                />
              </div>
              
              <div>
                <Label className="text-xs">ETH Balance</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={userBalanceEdit.eth}
                  onChange={(e) => setUserBalanceEdit(prev => ({ ...prev, eth: e.target.value }))}
                  className="h-8 text-sm mt-1"
                />
              </div>
              
              <div>
                <Label className="text-xs">B2B Balance</Label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={userBalanceEdit.gbtc}
                  onChange={(e) => setUserBalanceEdit(prev => ({ ...prev, gbtc: e.target.value }))}
                  className="h-8 text-sm mt-1"
                />
              </div>
              
              <div>
                <Label className="text-xs">Hash Power (TH/s)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={userBalanceEdit.hashPower}
                  onChange={(e) => setUserBalanceEdit(prev => ({ ...prev, hashPower: e.target.value }))}
                  className="h-8 text-sm mt-1"
                />
              </div>
              
              <DialogFooter className="gap-2">
                <Button
                  onClick={() => setSelectedUser(null)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    updateUserBalanceMutation.mutate({
                      userId: selectedUser.id,
                      balances: {
                        usdtBalance: userBalanceEdit.usdt,
                        ethBalance: userBalanceEdit.eth,
                        gbtcBalance: userBalanceEdit.gbtc,
                        hashPower: userBalanceEdit.hashPower
                      }
                    });
                  }}
                  disabled={updateUserBalanceMutation.isPending}
                  size="sm"
                  className="flex-1"
                >
                  Update
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}